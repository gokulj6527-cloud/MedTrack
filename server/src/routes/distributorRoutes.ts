import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';
import { uid } from '../utils/ids';
import { orgIdFor } from '../utils/orgAccess';
import { blockedBatchReason } from '../utils/stockRules';

const router = Router();

router.use(requireAuth, requireRole(['DISTRIBUTOR', 'ADMIN']));

// GET /api/distributor/inventory - Warehouse Stock
router.get('/inventory', async (req: AuthRequest, res) => {
  try {
    const distId = orgIdFor(req, 'distributor_id');
    const inventory = await db.query(
      `SELECT i.*, b.batch_number, b.manufacturing_date, b.expiry_date, b.batch_status,
              m.medicine_name, m.generic_name, m.brand_name, mfr.company_name as manufacturer_name,
              mfr.manufacturer_id,
              COALESCE(i.quantity_received, i.quantity) AS quantity_received,
              COALESCE(i.quantity_supplied, 0) AS quantity_supplied,
              i.quantity AS available_warehouse_stock,
              i.last_received_at AS received_date,
              i.last_supplied_at AS last_supply_date,
              COALESCE(i.temperature_status, 'NORMAL') AS temperature_status,
              CASE
                WHEN b.batch_status = 'RECALLED' THEN 'RECALLED'
                WHEN b.expiry_date < CURRENT_DATE OR b.batch_status = 'EXPIRED' THEN 'EXPIRED'
                WHEN i.temperature_status = 'VIOLATION' THEN 'TEMPERATURE_ALERT'
                WHEN i.quantity <= i.reorder_level THEN 'LOW_STOCK'
                ELSE 'IN_STOCK'
              END AS inventory_status
       FROM inventory i
       JOIN batches b ON i.batch_id = b.batch_id
       JOIN medicines m ON i.medicine_id = m.medicine_id
       JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
       WHERE i.owner_type = 'DISTRIBUTOR' AND i.owner_id = ?
       ORDER BY b.expiry_date ASC`,
      [distId]
    );
    return res.json({ success: true, count: inventory.length, inventory });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/distributor/shipments/incoming - Shipments from Manufacturers
router.get('/shipments/incoming', async (req: AuthRequest, res) => {
  try {
    const distId = req.user?.organization_id || req.query.distributor_id;
    const shipments = await db.query(
      `SELECT s.*, mfr.company_name as sender_name
       FROM shipments s
       JOIN manufacturers mfr ON s.sender_id = mfr.manufacturer_id
       WHERE s.receiver_type = 'DISTRIBUTOR' AND s.receiver_id = ?
       ORDER BY s.created_at DESC`,
      [distId]
    );

    for (const shp of shipments) {
      shp.items = await db.query(
        `SELECT si.*, b.batch_number, m.medicine_name 
         FROM shipment_items si 
         JOIN batches b ON si.batch_id = b.batch_id
         JOIN medicines m ON b.medicine_id = m.medicine_id
         WHERE si.shipment_id = ?`,
        [shp.shipment_id]
      );
    }

    return res.json({ success: true, count: shipments.length, shipments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/distributor/shipments/:id/receive - Accept incoming manufacturer shipment
router.post('/shipments/:id/receive', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const distId = orgIdFor(req, 'distributor_id', 'distributor_id');

    const shipment = await db.queryOne<any>('SELECT * FROM shipments WHERE shipment_id = ?', [id]);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (shipment.receiver_type !== 'DISTRIBUTOR' || (req.user?.role === 'DISTRIBUTOR' && shipment.receiver_id !== distId)) {
      return res.status(403).json({ success: false, message: 'Cannot receive a shipment destined for another warehouse.' });
    }
    if (shipment.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Shipment has already been received.' });
    }
    if (shipment.status === 'QUARANTINED') {
      return res.status(422).json({ success: false, message: 'Quarantined shipments cannot be received into saleable stock.' });
    }

    const items = await db.query<any>('SELECT * FROM shipment_items WHERE shipment_id = ?', [id]);

    await db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE shipments SET status = 'DELIVERED', received_date = CURRENT_TIMESTAMP WHERE shipment_id = ?`,
        [id]
      );

      for (const item of items) {
        const batch = await tx.queryOne<any>('SELECT medicine_id FROM batches WHERE batch_id = ?', [item.batch_id]);
        if (batch) {
          const existingInv = await tx.queryOne<any>(
            `SELECT * FROM inventory WHERE owner_type = 'DISTRIBUTOR' AND owner_id = ? AND batch_id = ?`,
            [distId, item.batch_id]
          );

          if (existingInv) {
            await tx.execute(
              `UPDATE inventory SET quantity = quantity + ?, quantity_received = COALESCE(quantity_received,0) + ?, last_received_at = CURRENT_TIMESTAMP WHERE inventory_id = ?`,
              [item.quantity, item.quantity, existingInv.inventory_id]
            );
          } else {
            await tx.execute(
              `INSERT INTO inventory (inventory_id, owner_type, owner_id, batch_id, medicine_id, quantity, quantity_received, reorder_level, last_received_at)
               VALUES (?, 'DISTRIBUTOR', ?, ?, ?, ?, ?, 200, CURRENT_TIMESTAMP)`,
              [uid('INV'), distId, item.batch_id, batch.medicine_id, item.quantity, item.quantity]
            );
          }
        }
      }

      await logAuditAction(req.user!.user_id, 'SHIPMENT_RECEIVED', 'SHIPMENT', id, `Distributor received shipment ${shipment.tracking_number}`, tx);
    });

    return res.json({ success: true, message: 'Shipment received and warehouse inventory updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/distributor/orders - Pharmacy Orders
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const distId = req.user?.organization_id || req.query.distributor_id;
    const orders = await db.query(
      `SELECT o.*, p.pharmacy_name, p.pharmacist_in_charge
       FROM orders o
       JOIN pharmacies p ON o.pharmacy_id = p.pharmacy_id
       WHERE o.distributor_id = ?
       ORDER BY o.created_at DESC`,
      [distId]
    );

    for (const ord of orders) {
      ord.items = await db.query(
        `SELECT oi.*, m.medicine_name, b.batch_number 
         FROM order_items oi
         JOIN medicines m ON oi.medicine_id = m.medicine_id
         LEFT JOIN batches b ON oi.batch_id = b.batch_id
         WHERE oi.order_id = ?`,
        [ord.order_id]
      );
    }

    return res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/distributor/orders/:id/ship - Approve & ship order to Pharmacy
router.post('/orders/:id/ship', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const distId = orgIdFor(req, 'distributor_id', 'distributor_id');

    const order = await db.queryOne<any>('SELECT * FROM orders WHERE order_id = ?', [id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user?.role === 'DISTRIBUTOR' && order.distributor_id !== distId) {
      return res.status(403).json({ success: false, message: 'Cannot ship another distributor order.' });
    }

    const orderItems = await db.query<any>('SELECT * FROM order_items WHERE order_id = ?', [id]);

    await db.transaction(async (tx) => {
      for (const item of orderItems) {
        if (!item.batch_id) throw new Error(`Batch ID not assigned for order item ${item.order_item_id}`);

        const batch = await tx.queryOne<any>('SELECT * FROM batches WHERE batch_id = ?', [item.batch_id]);
        const blocked = blockedBatchReason(batch);
        if (blocked) throw new Error(blocked);

        const distInv = await tx.queryOne<any>(
          `SELECT * FROM inventory WHERE owner_type = 'DISTRIBUTOR' AND owner_id = ? AND batch_id = ?`,
          [distId, item.batch_id]
        );

        if (!distInv || distInv.quantity < item.quantity) {
          throw new Error(`Insufficient warehouse inventory for batch ${item.batch_id}. Available: ${distInv?.quantity || 0}, Required: ${item.quantity}`);
        }

        await tx.execute(
          `UPDATE inventory SET quantity = quantity - ?, quantity_supplied = COALESCE(quantity_supplied,0) + ?, last_supplied_at = CURRENT_TIMESTAMP WHERE inventory_id = ? AND quantity >= ?`,
          [item.quantity, item.quantity, distInv.inventory_id, item.quantity]
        );
      }

      await tx.execute(`UPDATE orders SET status = 'SHIPPED', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`, [id]);

      const shipment_id = uid('SHP');
      const tracking_number = `TRK-DST-${Date.now().toString().slice(-6)}`;

      await tx.execute(
        `INSERT INTO shipments (shipment_id, sender_type, sender_id, receiver_type, receiver_id, order_id, tracking_number, cold_chain_required, status)
         VALUES (?, 'DISTRIBUTOR', ?, 'PHARMACY', ?, ?, ?, FALSE, 'IN_TRANSIT')`,
        [shipment_id, distId, order.pharmacy_id, id, tracking_number]
      );

      for (const item of orderItems) {
        await tx.execute(
          `INSERT INTO shipment_items (shipment_item_id, shipment_id, batch_id, quantity) VALUES (?, ?, ?, ?)`,
          [uid('SIT'), shipment_id, item.batch_id, item.quantity]
        );
      }

      await logAuditAction(req.user!.user_id, 'ORDER_SHIPPED', 'ORDER', id, `Distributor shipped order ${id} to pharmacy ${order.pharmacy_id} (awaiting pharmacy receipt)`, tx);
    });

    return res.json({ success: true, message: 'Pharmacy order approved, inventory deducted, and shipment dispatched.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/distributor/temperature - Record IoT Cold-Chain Temperature Sensor Reading
router.post('/temperature', async (req: AuthRequest, res) => {
  try {
    const { shipment_id, recorded_temperature, acceptable_min, acceptable_max } = req.body;
    if (!shipment_id || recorded_temperature === undefined) {
      return res.status(400).json({ success: false, message: 'Shipment ID and recorded temperature reading are required.' });
    }

    const min = acceptable_min ?? 2.0;
    const max = acceptable_max ?? 8.0;
    const temp = Number(recorded_temperature);

    let alert_status: 'NORMAL' | 'WARNING' | 'VIOLATION' = 'NORMAL';
    if (temp < min || temp > max) {
      alert_status = 'VIOLATION';
    } else if (temp <= min + 0.5 || temp >= max - 0.5) {
      alert_status = 'WARNING';
    }

    await db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO temperature_readings (shipment_id, recorded_temperature, acceptable_min, acceptable_max, alert_status)
         VALUES (?, ?, ?, ?, ?)`,
        [shipment_id, temp, min, max, alert_status]
      );

      // Rule 5: If temperature is outside permitted range, create a temperature alert!
      if (alert_status === 'VIOLATION') {
        const alert_id = uid('ALT');
        const msg = `COLD-CHAIN TEMPERATURE VIOLATION: Shipment ${shipment_id} recorded ${temp}°C (Permitted range: ${min}°C - ${max}°C). Stock quarantined.`;

        await tx.execute(
          `INSERT INTO alerts (alert_id, alert_type, severity, message, related_entity_type, related_entity_id, status)
           VALUES (?, 'TEMPERATURE', 'CRITICAL', ?, 'SHIPMENT', ?, 'UNREAD')`,
          [alert_id, msg, shipment_id]
        );

        // Update shipment status to QUARANTINED
        await tx.execute(`UPDATE shipments SET status = 'QUARANTINED' WHERE shipment_id = ?`, [shipment_id]);

        await logAuditAction(req.user!.user_id, 'TEMPERATURE_VIOLATION_TRIGGERED', 'SHIPMENT', shipment_id, msg, tx);
      }
    });

    return res.json({
      success: true,
      alert_status,
      message: alert_status === 'VIOLATION' 
        ? `ALERT: Cold-chain temperature violation detected (${temp}°C)! Shipment marked as QUARANTINED.`
        : `Temperature recorded successfully (${temp}°C). Status: ${alert_status}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/distributor/alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await db.query(`SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50`);
    return res.json({ success: true, count: alerts.length, alerts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const distId = orgIdFor(req, 'distributor_id');
    const totalDistributors = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM distributors'))?.cnt || 0;
    const received = (await db.queryOne<any>(
      `SELECT COALESCE(SUM(si.quantity),0) as sum FROM shipment_items si
       JOIN shipments s ON si.shipment_id = s.shipment_id
       WHERE s.receiver_type = 'DISTRIBUTOR' AND s.receiver_id = ? AND s.status = 'DELIVERED'`,
      [distId]
    ))?.sum || 0;
    const supplied = (await db.queryOne<any>(
      `SELECT COALESCE(SUM(si.quantity),0) as sum FROM shipment_items si
       JOIN shipments s ON si.shipment_id = s.shipment_id
       WHERE s.sender_type = 'DISTRIBUTOR' AND s.sender_id = ?`,
      [distId]
    ))?.sum || 0;
    const warehouse = (await db.queryOne<any>(
      `SELECT COALESCE(SUM(quantity),0) as sum FROM inventory WHERE owner_type = 'DISTRIBUTOR' AND owner_id = ?`,
      [distId]
    ))?.sum || 0;
    const pending = (await db.queryOne<any>(
      `SELECT COUNT(*) as cnt FROM shipments WHERE receiver_type = 'DISTRIBUTOR' AND receiver_id = ? AND status = 'IN_TRANSIT'`,
      [distId]
    ))?.cnt || 0;
    const tempViolations = (await db.queryOne<any>(
      `SELECT COUNT(*) as cnt FROM temperature_readings t
       JOIN shipments s ON t.shipment_id = s.shipment_id
       WHERE t.alert_status = 'VIOLATION' AND (s.sender_id = ? OR s.receiver_id = ?)`,
      [distId, distId]
    ))?.cnt || 0;

    return res.json({
      success: true,
      stats: {
        totalDistributors,
        totalUnitsReceived: received,
        totalUnitsSupplied: supplied,
        totalWarehouseStock: warehouse,
        pendingShipments: pending,
        temperatureViolations: tempViolations
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const distId = orgIdFor(req, 'distributor_id');
    const profile = await db.queryOne('SELECT * FROM distributors WHERE distributor_id = ?', [distId]);
    return res.json({ success: true, profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/profile', async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'DISTRIBUTOR') return res.status(403).json({ success: false, message: 'Only distributors can update warehouse details.' });
    const { company_name, warehouse_address, email, phone } = req.body;
    await db.execute(
      `UPDATE distributors SET company_name = COALESCE(?, company_name), warehouse_address = COALESCE(?, warehouse_address),
       email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE distributor_id = ?`,
      [company_name || null, warehouse_address || null, email || null, phone || null, req.user.organization_id]
    );
    return res.json({ success: true, message: 'Warehouse details updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/inventory/:inventoryId/adjust', async (req: AuthRequest, res) => {
  try {
    const distId = orgIdFor(req, 'distributor_id', 'distributor_id');
    const { quantity, reason, notes } = req.body;
    const qty = Math.abs(Number(quantity));
    if (!qty || !reason) return res.status(400).json({ success: false, message: 'Quantity and reason are required.' });

    const inv = await db.queryOne<any>('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.inventoryId]);
    if (!inv || inv.owner_type !== 'DISTRIBUTOR' || (req.user?.role === 'DISTRIBUTOR' && inv.owner_id !== distId)) {
      return res.status(404).json({ success: false, message: 'Warehouse inventory record not found.' });
    }
    if (inv.quantity < qty) return res.status(400).json({ success: false, message: 'Cannot reduce more stock than is available.' });

    await db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE inventory SET quantity = quantity - ?, quantity_reduced = COALESCE(quantity_reduced,0) + ? WHERE inventory_id = ?`,
        [qty, qty, inv.inventory_id]
      );
      await tx.execute(
        `INSERT INTO stock_adjustments (adjustment_id, inventory_id, batch_id, owner_type, owner_id, quantity_change, reason, notes, performed_by)
         VALUES (?, ?, ?, 'DISTRIBUTOR', ?, ?, ?, ?, ?)`,
        [uid('ADJ'), inv.inventory_id, inv.batch_id, distId, -qty, reason, notes || '', req.user!.user_id]
      );
      await logAuditAction(req.user!.user_id, 'STOCK_ADJUSTED', 'INVENTORY', inv.inventory_id, `${reason}: -${qty}`, tx);
    });
    return res.json({ success: true, message: 'Stock adjustment recorded. Historical receipts were not deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/inventory/:inventoryId/quarantine', async (req: AuthRequest, res) => {
  try {
    const distId = orgIdFor(req, 'distributor_id', 'distributor_id');
    const inv = await db.queryOne<any>('SELECT * FROM inventory WHERE inventory_id = ?', [req.params.inventoryId]);
    if (!inv || (req.user?.role === 'DISTRIBUTOR' && inv.owner_id !== distId)) {
      return res.status(404).json({ success: false, message: 'Inventory not found.' });
    }
    await db.execute(`UPDATE batches SET batch_status = 'QUARANTINED' WHERE batch_id = ?`, [inv.batch_id]);
    await logAuditAction(req.user!.user_id, 'BATCH_QUARANTINED', 'BATCH', inv.batch_id, req.body.reason || 'Quarantined at warehouse');
    return res.json({ success: true, message: 'Batch quarantined. It cannot be supplied to pharmacies.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
