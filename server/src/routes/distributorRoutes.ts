import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';

const router = Router();

router.use(requireAuth, requireRole(['DISTRIBUTOR', 'ADMIN']));

// GET /api/distributor/inventory - Warehouse Stock
router.get('/inventory', async (req: AuthRequest, res) => {
  try {
    const distId = req.user?.organization_id || req.query.distributor_id;
    const inventory = await db.query(
      `SELECT i.*, b.batch_number, b.manufacturing_date, b.expiry_date, b.batch_status,
              m.medicine_name, m.generic_name, m.brand_name, mfr.company_name as manufacturer_name
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
    const distId = req.user?.organization_id || req.body.distributor_id;

    const shipment = await db.queryOne<any>('SELECT * FROM shipments WHERE shipment_id = ?', [id]);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (shipment.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Shipment has already been received.' });
    }

    const items = await db.query<any>('SELECT * FROM shipment_items WHERE shipment_id = ?', [id]);

    await db.transaction(async (tx) => {
      // Update shipment status
      await tx.execute(
        `UPDATE shipments SET status = 'DELIVERED', received_date = CURRENT_TIMESTAMP WHERE shipment_id = ?`,
        [id]
      );

      // Add received stock to distributor inventory
      for (const item of items) {
        const batch = await tx.queryOne<any>('SELECT medicine_id FROM batches WHERE batch_id = ?', [item.batch_id]);
        if (batch) {
          const existingInv = await tx.queryOne<any>(
            `SELECT * FROM inventory WHERE owner_type = 'DISTRIBUTOR' AND owner_id = ? AND batch_id = ?`,
            [distId, item.batch_id]
          );

          if (existingInv) {
            await tx.execute(
              `UPDATE inventory SET quantity = quantity + ? WHERE inventory_id = ?`,
              [item.quantity, existingInv.inventory_id]
            );
          } else {
            const invId = `INV_DST_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
            await tx.execute(
              `INSERT INTO inventory (inventory_id, owner_type, owner_id, batch_id, medicine_id, quantity, reorder_level)
               VALUES (?, 'DISTRIBUTOR', ?, ?, ?, ?, 200)`,
              [invId, distId, item.batch_id, batch.medicine_id, item.quantity]
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
    const distId = req.user?.organization_id || req.body.distributor_id;

    const order = await db.queryOne<any>('SELECT * FROM orders WHERE order_id = ?', [id]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const orderItems = await db.query<any>('SELECT * FROM order_items WHERE order_id = ?', [id]);

    await db.transaction(async (tx) => {
      // Validate distributor inventory and deduct
      for (const item of orderItems) {
        if (!item.batch_id) throw new Error(`Batch ID not assigned for order item ${item.order_item_id}`);

        const distInv = await tx.queryOne<any>(
          `SELECT * FROM inventory WHERE owner_type = 'DISTRIBUTOR' AND owner_id = ? AND batch_id = ?`,
          [distId, item.batch_id]
        );

        if (!distInv || distInv.quantity < item.quantity) {
          throw new Error(`Insufficient warehouse inventory for batch ${item.batch_id}. Available: ${distInv?.quantity || 0}, Required: ${item.quantity}`);
        }

        // Deduct distributor inventory
        await tx.execute(`UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?`, [item.quantity, distInv.inventory_id]);
      }

      // Update order status
      await tx.execute(`UPDATE orders SET status = 'SHIPPED', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`, [id]);

      // Create outgoing shipment to pharmacy
      const shipment_id = `SHP_${Date.now().toString().slice(-6)}`;
      const tracking_number = `TRK-DST-${Date.now().toString().slice(-6)}`;

      await tx.execute(
        `INSERT INTO shipments (shipment_id, sender_type, sender_id, receiver_type, receiver_id, order_id, tracking_number, cold_chain_required, status)
         VALUES (?, 'DISTRIBUTOR', ?, 'PHARMACY', ?, ?, ?, FALSE, 'IN_TRANSIT')`,
        [shipment_id, distId, order.pharmacy_id, id, tracking_number]
      );

      for (const item of orderItems) {
        const shpItemId = `SHP_ITM_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
        await tx.execute(
          `INSERT INTO shipment_items (shipment_item_id, shipment_id, batch_id, quantity) VALUES (?, ?, ?, ?)`,
          [shpItemId, shipment_id, item.batch_id, item.quantity]
        );
      }

      // Add to pharmacy inventory directly or upon receive
      for (const item of orderItems) {
        const batch = await tx.queryOne<any>('SELECT medicine_id FROM batches WHERE batch_id = ?', [item.batch_id]);
        const existingPharmInv = await tx.queryOne<any>(
          `SELECT * FROM inventory WHERE owner_type = 'PHARMACY' AND owner_id = ? AND batch_id = ?`,
          [order.pharmacy_id, item.batch_id]
        );

        if (existingPharmInv) {
          await tx.execute(`UPDATE inventory SET quantity = quantity + ? WHERE inventory_id = ?`, [item.quantity, existingPharmInv.inventory_id]);
        } else {
          const invId = `INV_PHM_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
          await tx.execute(
            `INSERT INTO inventory (inventory_id, owner_type, owner_id, batch_id, medicine_id, quantity, reorder_level)
             VALUES (?, 'PHARMACY', ?, ?, ?, ?, 50)`,
            [invId, order.pharmacy_id, item.batch_id, batch.medicine_id, item.quantity]
          );
        }
      }

      await logAuditAction(req.user!.user_id, 'ORDER_SHIPPED', 'ORDER', id, `Distributor shipped order ${id} to pharmacy ${order.pharmacy_id}`, tx);
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
        const alert_id = `ALT_${Date.now().toString().slice(-6)}`;
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

export default router;
