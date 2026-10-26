import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';
import { uid } from '../utils/ids';
import { denyIfMissingOrg, orgIdFor } from '../utils/orgAccess';
import { blockedBatchReason, MEDICINE_MASTER_SQL, PRODUCTION_BATCH_SQL } from '../utils/stockRules';

const router = Router();

router.use(requireAuth, requireRole(['MANUFACTURER', 'ADMIN']));

// GET /api/manufacturer/medicines
router.get('/medicines', async (req: AuthRequest, res) => {
  try {
    const orgId = orgIdFor(req, 'manufacturer_id');
    let sql = `${MEDICINE_MASTER_SQL}`;
    const params: any[] = [];

    if (req.user?.role !== 'ADMIN') {
      sql += ` WHERE m.manufacturer_id = ?`;
      params.push(orgId);
    } else if (req.query.manufacturer_id) {
      sql += ` WHERE m.manufacturer_id = ?`;
      params.push(req.query.manufacturer_id);
    }

    sql += ` ORDER BY m.medicine_name ASC`;
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
      category,
      min_stock_level,
      compositions
    } = req.body;

    const manufacturer_id = req.user?.organization_id || req.body.manufacturer_id;

    if (!manufacturer_id || !medicine_name || !generic_name || !brand_name || !dosage_form || !strength) {
      return res.status(400).json({ success: false, message: 'All required medicine fields must be provided.' });
    }

    if (req.user?.role === 'MANUFACTURER' && req.user.organization_id !== manufacturer_id) {
      return res.status(403).json({ success: false, message: 'Cannot create medicines for another manufacturer.' });
    }

    const medicine_id = uid('MED');

    await db.execute(
      `INSERT INTO medicines (medicine_id, manufacturer_id, medicine_name, generic_name, brand_name, dosage_form, strength, description, prescription_required, storage_temperature_min, storage_temperature_max, unit_price, category, min_stock_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        unit_price ?? 10.0,
        category || dosage_form || 'General',
        min_stock_level ?? 100
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
    const orgId = orgIdFor(req, 'manufacturer_id');
    let sql = PRODUCTION_BATCH_SQL;
    const params: any[] = [];

    if (req.user?.role !== 'ADMIN') {
      sql += ` WHERE b.manufacturer_id = ?`;
      params.push(orgId);
    } else if (req.query.manufacturer_id) {
      sql += ` WHERE b.manufacturer_id = ?`;
      params.push(req.query.manufacturer_id);
    }

    sql += ` ORDER BY b.manufacturing_date DESC`;
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

    const manufacturer_id = orgIdFor(req, 'manufacturer_id', 'manufacturer_id');

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

    if (Number(quantity_produced) <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity produced must be a positive integer.' });
    }

    const ownedMed = await db.queryOne<any>('SELECT medicine_id, manufacturer_id FROM medicines WHERE medicine_id = ?', [medicine_id]);
    if (!ownedMed) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    if (req.user?.role === 'MANUFACTURER' && ownedMed.manufacturer_id !== manufacturer_id) {
      return res.status(403).json({ success: false, message: 'Cannot create batches for another manufacturer medicine.' });
    }

    const batch_id = uid('BAT');

    await db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO batches (batch_id, medicine_id, manufacturer_id, batch_number, manufacturing_date, expiry_date, quantity_produced, quantity_dispatched, remaining_quantity, unit_cost, batch_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'ACTIVE')`,
        [batch_id, medicine_id, manufacturer_id, batch_number, manufacturing_date, expiry_date, quantity_produced, quantity_produced, unit_cost || 5.0]
      );

      const invId = uid('INV');
      await tx.execute(
        `INSERT INTO inventory (inventory_id, owner_type, owner_id, batch_id, medicine_id, quantity, quantity_received, reorder_level)
         VALUES (?, 'MANUFACTURER', ?, ?, ?, ?, ?, 100)`,
        [invId, manufacturer_id, batch_id, medicine_id, quantity_produced, quantity_produced]
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
    const manufacturer_id = orgIdFor(req, 'manufacturer_id', 'manufacturer_id');

    if (!batch_id || !distributor_id || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Batch ID, distributor ID, and positive quantity are required.' });
    }

    const batch = await db.queryOne<any>('SELECT * FROM batches WHERE batch_id = ?', [batch_id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    if (req.user?.role === 'MANUFACTURER' && batch.manufacturer_id !== manufacturer_id) {
      return res.status(403).json({ success: false, message: 'Cannot dispatch another manufacturer batch.' });
    }

    const blocked = blockedBatchReason(batch);
    if (blocked) return res.status(422).json({ success: false, message: blocked });

    const dist = await db.queryOne<any>(`SELECT * FROM distributors WHERE distributor_id = ? AND approval_status = 'APPROVED'`, [distributor_id]);
    if (!dist) return res.status(400).json({ success: false, message: 'Receiver must be an approved distributor.' });

    const remaining = Number(batch.quantity_produced) - Number(batch.quantity_dispatched || 0);
    const mfrInv = await db.queryOne<any>(
      `SELECT * FROM inventory WHERE owner_type = 'MANUFACTURER' AND owner_id = ? AND batch_id = ?`,
      [manufacturer_id, batch_id]
    );

    if (!mfrInv || mfrInv.quantity < quantity || remaining < quantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot dispatch more than batch contains. Manufacturer stock: ${mfrInv?.quantity || 0}, Batch remaining: ${remaining}, Requested: ${quantity}`
      });
    }

    const shipment_id = uid('SHP');
    const tracking_number = `TRK-MFR-${Date.now().toString().slice(-6)}`;
    const medMeta = await db.queryOne<any>('SELECT storage_temperature_max FROM medicines WHERE medicine_id = ?', [batch.medicine_id]);
    const cold = Number(medMeta?.storage_temperature_max ?? 25) <= 8;

    await db.transaction(async (tx) => {
      await tx.execute(
        `UPDATE inventory SET quantity = quantity - ?, quantity_supplied = COALESCE(quantity_supplied,0) + ?, last_supplied_at = CURRENT_TIMESTAMP WHERE inventory_id = ? AND quantity >= ?`,
        [quantity, quantity, mfrInv.inventory_id, quantity]
      );
      await tx.execute(
        `UPDATE batches SET quantity_dispatched = COALESCE(quantity_dispatched,0) + ?, remaining_quantity = quantity_produced - (COALESCE(quantity_dispatched,0) + ?) WHERE batch_id = ?`,
        [quantity, quantity, batch_id]
      );

      await tx.execute(
        `INSERT INTO shipments (shipment_id, sender_type, sender_id, receiver_type, receiver_id, tracking_number, cold_chain_required, status)
         VALUES (?, 'MANUFACTURER', ?, 'DISTRIBUTOR', ?, ?, ?, 'IN_TRANSIT')`,
        [shipment_id, manufacturer_id, distributor_id, tracking_number, cold ? 1 : 0]
      );

      await tx.execute(
        `INSERT INTO shipment_items (shipment_item_id, shipment_id, batch_id, quantity) VALUES (?, ?, ?, ?)`,
        [uid('SIT'), shipment_id, batch_id, quantity]
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
      `SELECT d.distributor_id, d.company_name, d.email, d.phone, d.warehouse_address, d.approval_status,
              COUNT(DISTINCT s.shipment_id) as shipment_count,
              COALESCE(SUM(si.quantity), 0) as units_supplied
       FROM distributors d
       LEFT JOIN shipments s ON d.distributor_id = s.receiver_id AND s.sender_id = ? AND s.sender_type = 'MANUFACTURER'
       LEFT JOIN shipment_items si ON s.shipment_id = si.shipment_id
       WHERE d.approval_status = 'APPROVED'
       GROUP BY d.distributor_id, d.company_name, d.email, d.phone, d.warehouse_address, d.approval_status`,
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

    const batch = await db.queryOne<any>('SELECT * FROM batches WHERE batch_id = ?', [batch_id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    if (req.user?.role === 'MANUFACTURER' && batch.manufacturer_id !== req.user.organization_id) {
      return res.status(403).json({ success: false, message: 'Cannot recall another manufacturer batch.' });
    }

    const recall_id = uid('RCL');

    await db.transaction(async (tx) => {
      await tx.execute(`UPDATE batches SET batch_status = 'RECALLED', defect_notes = ? WHERE batch_id = ?`, [reason, batch_id]);

      // Create recall record
      await tx.execute(
        `INSERT INTO recalls (recall_id, batch_id, initiated_by, reason, severity, status) VALUES (?, ?, ?, ?, ?, 'INITIATED')`,
        [recall_id, batch_id, req.user!.user_id, reason, severity || 'CLASS_I']
      );

      // Create system-wide alert
      const alert_id = uid('ALT');
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

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const mfrId = orgIdFor(req, 'manufacturer_id');
    if (denyIfMissingOrg(res, mfrId) && req.user?.role !== 'ADMIN') return;
    const where = req.user?.role === 'ADMIN' && !req.query.manufacturer_id ? '1=1' : 'manufacturer_id = ?';
    const params = where === '1=1' ? [] : [mfrId];
    const scoped = req.user?.role === 'ADMIN' && !req.query.manufacturer_id ? '' : 'WHERE manufacturer_id = ?';
    const sParams = scoped ? [mfrId] : [];

    const totalManufacturers = req.user?.role === 'ADMIN'
      ? (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM manufacturers'))?.cnt || 0
      : 1;
    const produced = (await db.queryOne<any>(`SELECT COALESCE(SUM(quantity_produced),0) as sum FROM batches ${scoped}`, sParams))?.sum || 0;
    const dispatched = (await db.queryOne<any>(`SELECT COALESCE(SUM(COALESCE(quantity_dispatched,0)),0) as sum FROM batches ${scoped}`, sParams))?.sum || 0;
    const batchesCreated = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM batches ${scoped}`, sParams))?.cnt || 0;
    const medicinesProduced = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM medicines ${scoped}`, sParams))?.cnt || 0;
    const defective = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM batches ${scoped ? scoped + ' AND' : 'WHERE'} batch_status IN ('DEFECTIVE','RECALLED')`, scoped ? [mfrId] : []))?.cnt || 0;

    return res.json({
      success: true,
      stats: {
        totalManufacturers,
        totalMedicinesProduced: medicinesProduced,
        totalBatchesCreated: batchesCreated,
        totalUnitsProduced: produced,
        totalUnitsDispatched: dispatched,
        defectiveOrRecalledBatches: defective
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/shipments', async (req: AuthRequest, res) => {
  try {
    const mfrId = orgIdFor(req, 'manufacturer_id');
    const shipments = await db.query(
      `SELECT s.*, d.company_name as receiver_name
       FROM shipments s
       LEFT JOIN distributors d ON s.receiver_id = d.distributor_id
       WHERE s.sender_type = 'MANUFACTURER' AND s.sender_id = ?
       ORDER BY s.created_at DESC`,
      [mfrId]
    );
    for (const shp of shipments) {
      shp.items = await db.query(
        `SELECT si.*, b.batch_number, m.medicine_name FROM shipment_items si
         JOIN batches b ON si.batch_id = b.batch_id JOIN medicines m ON b.medicine_id = m.medicine_id
         WHERE si.shipment_id = ?`,
        [shp.shipment_id]
      );
    }
    return res.json({ success: true, shipments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const mfrId = orgIdFor(req, 'manufacturer_id');
    const profile = await db.queryOne('SELECT * FROM manufacturers WHERE manufacturer_id = ?', [mfrId]);
    return res.json({ success: true, profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/profile', async (req: AuthRequest, res) => {
  try {
    const mfrId = req.user?.organization_id;
    if (!mfrId || req.user?.role === 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Manufacturer profile updates must be made by the manufacturer account.' });
    }
    const { company_name, license_number, email, phone, address } = req.body;
    await db.execute(
      `UPDATE manufacturers SET company_name = COALESCE(?, company_name), license_number = COALESCE(?, license_number),
       email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE manufacturer_id = ?`,
      [company_name || null, license_number || null, email || null, phone || null, address || null, mfrId]
    );
    await logAuditAction(req.user!.user_id, 'PROFILE_UPDATED', 'MANUFACTURER', mfrId, 'Updated manufacturer profile');
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/medicines/:id', async (req: AuthRequest, res) => {
  try {
    const med = await db.queryOne<any>('SELECT * FROM medicines WHERE medicine_id = ?', [req.params.id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    if (req.user?.role === 'MANUFACTURER' && med.manufacturer_id !== req.user.organization_id) {
      return res.status(403).json({ success: false, message: 'Cannot modify another manufacturer medicine.' });
    }
    const { medicine_name, description, unit_price, category, min_stock_level, storage_temperature_min, storage_temperature_max, prescription_required } = req.body;
    await db.execute(
      `UPDATE medicines SET medicine_name = COALESCE(?, medicine_name), description = COALESCE(?, description),
       unit_price = COALESCE(?, unit_price), category = COALESCE(?, category), min_stock_level = COALESCE(?, min_stock_level),
       storage_temperature_min = COALESCE(?, storage_temperature_min), storage_temperature_max = COALESCE(?, storage_temperature_max),
       prescription_required = COALESCE(?, prescription_required) WHERE medicine_id = ?`,
      [medicine_name ?? null, description ?? null, unit_price ?? null, category ?? null, min_stock_level ?? null, storage_temperature_min ?? null, storage_temperature_max ?? null, prescription_required ?? null, req.params.id]
    );
    await logAuditAction(req.user!.user_id, 'MEDICINE_UPDATED', 'MEDICINE', req.params.id, `Updated medicine ${req.params.id}`);
    return res.json({ success: true, message: 'Medicine updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/batches/:id/defective', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;
    const batch = await db.queryOne<any>('SELECT * FROM batches WHERE batch_id = ?', [req.params.id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    if (req.user?.role === 'MANUFACTURER' && batch.manufacturer_id !== req.user.organization_id) {
      return res.status(403).json({ success: false, message: 'Cannot modify another manufacturer batch.' });
    }
    await db.execute(`UPDATE batches SET batch_status = 'DEFECTIVE', defect_notes = ? WHERE batch_id = ?`, [reason || 'Reported defective', req.params.id]);
    await logAuditAction(req.user!.user_id, 'BATCH_DEFECTIVE', 'BATCH', req.params.id, reason || 'Defective');
    return res.json({ success: true, message: 'Batch marked defective. Historical production totals were preserved.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
