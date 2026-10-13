import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';

const router = Router();

router.use(requireAuth, requireRole(['MANUFACTURER', 'ADMIN']));

// GET /api/manufacturer/medicines
router.get('/medicines', async (req: AuthRequest, res) => {
  try {
    const orgId = req.user?.organization_id || req.query.manufacturer_id;
    let sql = `
      SELECT m.*, mfr.company_name AS manufacturer_name 
      FROM medicines m 
      JOIN manufacturers mfr ON m.manufacturer_id = mfr.manufacturer_id
    `;
    const params: any[] = [];

    if (orgId && req.user?.role !== 'ADMIN') {
      sql += ` WHERE m.manufacturer_id = ?`;
      params.push(orgId);
    }

    sql += ` ORDER BY m.created_at DESC`;
    const medicines = await db.query(sql, params);

    // Fetch compositions for each medicine
    for (const med of medicines) {
      med.compositions = await db.query('SELECT * FROM medicine_compositions WHERE medicine_id = ?', [med.medicine_id]);
    }

    return res.json({ success: true, count: medicines.length, medicines });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/manufacturer/medicines - Create new medicine with compositions
router.post('/medicines', async (req: AuthRequest, res) => {
  try {
    const {
      medicine_name,
      generic_name,
      brand_name,
      dosage_form,
      strength,
      description,
      prescription_required,
      storage_temperature_min,
      storage_temperature_max,
      unit_price,
      compositions
    } = req.body;

    const manufacturer_id = req.user?.organization_id || req.body.manufacturer_id;

    if (!manufacturer_id || !medicine_name || !generic_name || !brand_name || !dosage_form || !strength) {
      return res.status(400).json({ success: false, message: 'All required medicine fields must be provided.' });
    }

    const medicine_id = `MED_${Date.now().toString().slice(-6)}`;

    await db.execute(
      `INSERT INTO medicines (medicine_id, manufacturer_id, medicine_name, generic_name, brand_name, dosage_form, strength, description, prescription_required, storage_temperature_min, storage_temperature_max, unit_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicine_id,
        manufacturer_id,
        medicine_name,
        generic_name,
        brand_name,
        dosage_form,
        strength,
        description || '',
        prescription_required ?? true,
        storage_temperature_min ?? 15.0,
        storage_temperature_max ?? 25.0,
        unit_price ?? 10.0
      ]
    );

    // Insert active ingredient compositions
    if (Array.isArray(compositions)) {
      for (const comp of compositions) {
        if (comp.ingredient_name) {
          await db.execute(
            `INSERT INTO medicine_compositions (medicine_id, ingredient_name, strength, unit) VALUES (?, ?, ?, ?)`,
            [medicine_id, comp.ingredient_name, comp.strength || strength, comp.unit || 'mg']
          );
        }
      }
    }

    await logAuditAction(req.user!.user_id, 'MEDICINE_CREATED', 'MEDICINE', medicine_id, `Created medicine ${medicine_name} (${brand_name})`);

    return res.json({ success: true, message: 'Medicine registered successfully.', medicine_id });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/manufacturer/batches - View production batches
router.get('/batches', async (req: AuthRequest, res) => {
  try {
    const orgId = req.user?.organization_id || req.query.manufacturer_id;
    let sql = `
      SELECT b.*, m.medicine_name, m.generic_name, m.brand_name, mfr.company_name as manufacturer_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.medicine_id
      JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
    `;
    const params: any[] = [];

    if (orgId && req.user?.role !== 'ADMIN') {
      sql += ` WHERE b.manufacturer_id = ?`;
      params.push(orgId);
    }

    sql += ` ORDER BY b.created_at DESC`;
    const batches = await db.query(sql, params);

    return res.json({ success: true, count: batches.length, batches });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/manufacturer/batches - Create batch with strict validation rules
router.post('/batches', async (req: AuthRequest, res) => {
  try {
    const {
      medicine_id,
      batch_number,
      manufacturing_date,
      expiry_date,
      quantity_produced,
      unit_cost
    } = req.body;

    const manufacturer_id = req.user?.organization_id || req.body.manufacturer_id;

    if (!medicine_id || !batch_number || !manufacturing_date || !expiry_date || !quantity_produced) {
      return res.status(400).json({ success: false, message: 'All batch parameters are required.' });
    }

    // Rule 6: Validate Expiry Date > Manufacturing Date
    const mfgDate = new Date(manufacturing_date);
    const expDate = new Date(expiry_date);
    if (isNaN(mfgDate.getTime()) || isNaN(expDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid manufacturing or expiry date format.' });
    }
    if (expDate <= mfgDate) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Expiry date (${expiry_date}) must be strictly after manufacturing date (${manufacturing_date}).`
      });
    }

    // Rule 7: Duplicate batch number check
    const existingBatch = await db.queryOne('SELECT batch_id FROM batches WHERE batch_number = ?', [batch_number]);
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: `Validation Error: Duplicate batch number '${batch_number}' already exists in system.`
      });
    }

    const batch_id = `BAT_${Date.now().toString().slice(-6)}`;

    // Create batch & seed manufacturer inventory inside database transaction
    await db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO batches (batch_id, medicine_id, manufacturer_id, batch_number, manufacturing_date, expiry_date, quantity_produced, remaining_quantity, unit_cost, batch_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [batch_id, medicine_id, manufacturer_id, batch_number, manufacturing_date, expiry_date, quantity_produced, quantity_produced, unit_cost || 5.0]
      );

      // Create manufacturer inventory record
      const invId = `INV_MFR_${Date.now().toString().slice(-6)}`;
      await tx.execute(
        `INSERT INTO inventory (inventory_id, owner_type, owner_id, batch_id, medicine_id, quantity, reorder_level)
         VALUES (?, 'MANUFACTURER', ?, ?, ?, ?, 100)`,
        [invId, manufacturer_id, batch_id, medicine_id, quantity_produced]
      );

      await logAuditAction(req.user!.user_id, 'BATCH_CREATED', 'BATCH', batch_id, `Produced batch ${batch_number} (${quantity_produced} units)`, tx);
    });

    return res.json({ success: true, message: 'Production batch created successfully.', batch_id, batch_number });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/manufacturer/shipments - Ship batch to Distributor
router.post('/shipments', async (req: AuthRequest, res) => {
  try {
    const { batch_id, distributor_id, quantity } = req.body;
    const manufacturer_id = req.user?.organization_id || req.body.manufacturer_id;

    if (!batch_id || !distributor_id || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Batch ID, distributor ID, and positive quantity are required.' });
    }

    const batch = await db.queryOne<any>('SELECT * FROM batches WHERE batch_id = ?', [batch_id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    // Check available manufacturer stock
    const mfrInv = await db.queryOne<any>(
      `SELECT * FROM inventory WHERE owner_type = 'MANUFACTURER' AND owner_id = ? AND batch_id = ?`,
      [manufacturer_id, batch_id]
    );

    if (!mfrInv || mfrInv.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient manufacturer stock. Available: ${mfrInv?.quantity || 0}, Requested: ${quantity}`
      });
    }

    const shipment_id = `SHP_${Date.now().toString().slice(-6)}`;
    const tracking_number = `TRK-MFR-${Date.now().toString().slice(-6)}`;

    // Execute atomic shipment creation
    await db.transaction(async (tx) => {
      // Decrement manufacturer stock
      await tx.execute(
        `UPDATE inventory SET quantity = quantity - ? WHERE inventory_id = ?`,
        [quantity, mfrInv.inventory_id]
      );

      // Create shipment record
      await tx.execute(
        `INSERT INTO shipments (shipment_id, sender_type, sender_id, receiver_type, receiver_id, tracking_number, cold_chain_required, status)
         VALUES (?, 'MANUFACTURER', ?, 'DISTRIBUTOR', ?, ?, FALSE, 'IN_TRANSIT')`,
        [shipment_id, manufacturer_id, distributor_id, tracking_number]
      );

      // Create shipment item
      const item_id = `SHP_ITM_${Date.now().toString().slice(-6)}`;
      await tx.execute(
        `INSERT INTO shipment_items (shipment_item_id, shipment_id, batch_id, quantity) VALUES (?, ?, ?, ?)`,
        [item_id, shipment_id, batch_id, quantity]
      );

      await logAuditAction(req.user!.user_id, 'SHIPMENT_CREATED', 'SHIPMENT', shipment_id, `Shipped ${quantity} units of batch ${batch.batch_number} to Distributor ${distributor_id}`, tx);
    });

    return res.json({ success: true, message: 'Shipment dispatched successfully to distributor.', shipment_id, tracking_number });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/manufacturer/distributor-network
router.get('/distributor-network', async (req: AuthRequest, res) => {
  try {
    const mfrId = req.user?.organization_id || req.query.manufacturer_id;
    const network = await db.query(
      `SELECT d.distributor_id, d.company_name, d.email, d.phone,
              COUNT(DISTINCT s.shipment_id) as shipment_count,
              COALESCE(SUM(si.quantity), 0) as units_supplied
       FROM distributors d
       LEFT JOIN shipments s ON d.distributor_id = s.receiver_id AND s.sender_id = ?
       LEFT JOIN shipment_items si ON s.shipment_id = si.shipment_id
       GROUP BY d.distributor_id, d.company_name, d.email, d.phone`,
      [mfrId]
    );
    return res.json({ success: true, network });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/manufacturer/recall - Initiate recall for defective batch
router.post('/recall', async (req: AuthRequest, res) => {
  try {
    const { batch_id, reason, severity } = req.body;
    if (!batch_id || !reason) {
      return res.status(400).json({ success: false, message: 'Batch ID and defect reason are required.' });
    }

    const recall_id = `RCL_${Date.now().toString().slice(-6)}`;

    await db.transaction(async (tx) => {
      // Set batch status to RECALLED
      await tx.execute(`UPDATE batches SET batch_status = 'RECALLED' WHERE batch_id = ?`, [batch_id]);

      // Create recall record
      await tx.execute(
        `INSERT INTO recalls (recall_id, batch_id, initiated_by, reason, severity, status) VALUES (?, ?, ?, ?, ?, 'INITIATED')`,
        [recall_id, batch_id, req.user!.user_id, reason, severity || 'CLASS_I']
      );

      // Create system-wide alert
      const alert_id = `ALT_${Date.now().toString().slice(-6)}`;
      await tx.execute(
        `INSERT INTO alerts (alert_id, alert_type, severity, message, related_entity_type, related_entity_id, status)
         VALUES (?, 'RECALL', 'CRITICAL', ?, 'BATCH', ?, 'UNREAD')`,
        [alert_id, `CRITICAL RECALL INITIATED for Batch ID ${batch_id}: ${reason}`, batch_id]
      );

      await logAuditAction(req.user!.user_id, 'RECALL_INITIATED', 'RECALL', recall_id, `Initiated recall for batch ${batch_id}: ${reason}`, tx);
    });

    return res.json({ success: true, message: 'Batch recall initiated. System alerts dispatched to distributors and pharmacists.', recall_id });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
