import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';

const router = Router();

router.use(requireAuth, requireRole(['PHARMACIST', 'ADMIN']));

// GET /api/pharmacist/inventory - Pharmacy Stock with safety badges
router.get('/inventory', async (req: AuthRequest, res) => {
  try {
    const pharmId = req.user?.organization_id || req.query.pharmacy_id;
    const inventory = await db.query(
      `SELECT i.*, b.batch_number, b.manufacturing_date, b.expiry_date, b.batch_status, b.unit_cost,
              m.medicine_name, m.generic_name, m.brand_name, m.prescription_required, m.unit_price,
              mfr.company_name as manufacturer_name,
              CASE 
                WHEN b.expiry_date < CURRENT_DATE THEN 'EXPIRED'
                WHEN b.batch_status = 'RECALLED' THEN 'RECALLED'
                WHEN b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'NEAR_EXPIRY'
                WHEN i.quantity <= i.reorder_level THEN 'LOW_STOCK'
                ELSE 'AVAILABLE'
              END AS safety_status
       FROM inventory i
       JOIN batches b ON i.batch_id = b.batch_id
       JOIN medicines m ON i.medicine_id = m.medicine_id
       JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
       WHERE i.owner_type = 'PHARMACY' AND i.owner_id = ?
       ORDER BY b.expiry_date ASC`,
      [pharmId]
    );
    return res.json({ success: true, count: inventory.length, inventory });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pharmacist/medicines/search - Search Medicines & Batches
router.get('/medicines/search', async (req, res) => {
  try {
    const { q, pharmacy_id } = req.query;
    let sql = `
      SELECT i.inventory_id, i.quantity as available_quantity, i.owner_id as pharmacy_id,
             b.batch_id, b.batch_number, b.manufacturing_date, b.expiry_date, b.batch_status,
             m.medicine_id, m.medicine_name, m.generic_name, m.brand_name, m.dosage_form, m.strength, m.unit_price, m.prescription_required,
             mfr.company_name as manufacturer_name
      FROM inventory i
      JOIN batches b ON i.batch_id = b.batch_id
      JOIN medicines m ON i.medicine_id = m.medicine_id
      JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
      WHERE i.owner_type = 'PHARMACY'
    `;
    const params: any[] = [];

    if (pharmacy_id) {
      sql += ` AND i.owner_id = ?`;
      params.push(pharmacy_id);
    }
    if (q) {
      sql += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.brand_name LIKE ? OR b.batch_number LIKE ?)`;
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    const results = await db.query(sql, params);
    return res.json({ success: true, count: results.length, results });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pharmacist/check-interactions - Check prescription items for drug-drug interactions (Rule 4)
router.post('/check-interactions', async (req, res) => {
  try {
    const { medicine_ids } = req.body;
    if (!Array.isArray(medicine_ids) || medicine_ids.length < 2) {
      return res.json({ success: true, count: 0, interactions: [], status: 'SAFE' });
    }

    const placeholders = medicine_ids.map(() => '?').join(',');
    const query = `
      SELECT i.*, m1.medicine_name as med1_name, m2.medicine_name as med2_name
      FROM drug_interactions i
      JOIN medicines m1 ON i.medicine_id_1 = m1.medicine_id
      JOIN medicines m2 ON i.medicine_id_2 = m2.medicine_id
      WHERE i.medicine_id_1 IN (${placeholders}) AND i.medicine_id_2 IN (${placeholders})
    `;

    const interactions = await db.query(query, [...medicine_ids, ...medicine_ids]);

    const hasContraindicated = interactions.some(i => i.severity === 'CONTRAINDICATED');
    const hasHigh = interactions.some(i => i.severity === 'HIGH');

    return res.json({
      success: true,
      count: interactions.length,
      interactions,
      status: hasContraindicated ? 'CONTRAINDICATED' : hasHigh ? 'HIGH_RISK' : interactions.length > 0 ? 'WARNING' : 'SAFE'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pharmacist/dispense - ATOMIC DATABASE TRANSACTION WORKFLOW WITH BUSINESS RULES
router.post('/dispense', async (req: AuthRequest, res) => {
  try {
    const {
      pharmacy_id,
      patient_name,
      doctor_name,
      items, // Array of { batch_id, medicine_id, quantity, unit_price }
      override_contraindication
    } = req.body;

    const pharmId = req.user?.organization_id || pharmacy_id;

    if (!pharmId || !patient_name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Pharmacy ID, patient name, and at least one dispensing item are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // =========================================================================
    // STEP 1-7: PRE-TRANSACTION BUSINESS RULES VALIDATIONS
    // =========================================================================

    // Rule 4: Check Drug-Drug Interactions across prescribed items
    const medIds = items.map(i => i.medicine_id);
    if (medIds.length > 1) {
      const placeholders = medIds.map(() => '?').join(',');
      const interactions = await db.query(
        `SELECT i.*, m1.medicine_name as med1_name, m2.medicine_name as med2_name
         FROM drug_interactions i
         JOIN medicines m1 ON i.medicine_id_1 = m1.medicine_id
         JOIN medicines m2 ON i.medicine_id_2 = m2.medicine_id
         WHERE i.medicine_id_1 IN (${placeholders}) AND i.medicine_id_2 IN (${placeholders})`,
        [...medIds, ...medIds]
      );

      const contraindicated = interactions.find(i => i.severity === 'CONTRAINDICATED');
      if (contraindicated && !override_contraindication) {
        return res.status(422).json({
          success: false,
          rule: 'RULE_4_DRUG_INTERACTION',
          message: `BUSINESS RULE VIOLATION (Drug Interaction): CONTRAINDICATED pairing detected between '${contraindicated.med1_name}' and '${contraindicated.med2_name}'. ${contraindicated.description}`
        });
      }
    }

    // Validate each batch item against rules 1, 2, and 3
    for (const item of items) {
      const batch = await db.queryOne<any>(
        `SELECT b.*, m.medicine_name 
         FROM batches b 
         JOIN medicines m ON b.medicine_id = m.medicine_id 
         WHERE b.batch_id = ?`,
        [item.batch_id]
      );

      if (!batch) {
        return res.status(404).json({ success: false, message: `Batch ${item.batch_id} not found.` });
      }

      // RULE 1: EXPIRED MEDICINES CANNOT BE DISPENSED
      if (batch.expiry_date < todayStr || batch.batch_status === 'EXPIRED') {
        return res.status(422).json({
          success: false,
          rule: 'RULE_1_EXPIRED_DISPENSING',
          message: `BUSINESS RULE VIOLATION (Rule 1): Cannot dispense batch '${batch.batch_number}' (${batch.medicine_name}) because it EXPIRED on ${batch.expiry_date}. Transaction rejected.`
        });
      }

      // RULE 2: RECALLED MEDICINES CANNOT BE DISPENSED
      if (batch.batch_status === 'RECALLED') {
        return res.status(422).json({
          success: false,
          rule: 'RULE_2_RECALLED_DISPENSING',
          message: `BUSINESS RULE VIOLATION (Rule 2): Cannot dispense batch '${batch.batch_number}' (${batch.medicine_name}) because it has been RECALLED due to safety defects. Transaction rejected.`
        });
      }

      // RULE 3: INSUFFICIENT INVENTORY REJECTION
      const inv = await db.queryOne<any>(
        `SELECT * FROM inventory WHERE owner_type = 'PHARMACY' AND owner_id = ? AND batch_id = ?`,
        [pharmId, item.batch_id]
      );

      if (!inv || inv.quantity < item.quantity) {
        return res.status(422).json({
          success: false,
          rule: 'RULE_3_INSUFFICIENT_INVENTORY',
          message: `BUSINESS RULE VIOLATION (Rule 3): Insufficient pharmacy stock for batch '${batch.batch_number}'. Available: ${inv?.quantity || 0} units, Requested: ${item.quantity} units. Transaction rejected.`
        });
      }
    }

    // =========================================================================
    // STEP 8-12: ATOMIC DATABASE TRANSACTION (ALL OR NOTHING ROLLBACK GUARANTEE)
    // =========================================================================
    const dispensing_id = `DSP_${Date.now().toString().slice(-6)}`;
    const rx_id = `RX_${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    await db.transaction(async (tx) => {
      // 1. Create prescription entry
      const rxNo = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      await tx.execute(
        `INSERT INTO prescriptions (prescription_id, pharmacy_id, prescription_number, patient_name, doctor_name, prescription_date, status)
         VALUES (?, ?, ?, ?, ?, ?, 'DISPENSED')`,
        [rx_id, pharmId, rxNo, patient_name, doctor_name || 'Dr. Self-Prescribed', todayStr]
      );

      // 2. Insert prescription items & calculate total amount
      for (const item of items) {
        const rxItemId = `RX_ITM_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
        await tx.execute(
          `INSERT INTO prescription_items (prescription_item_id, prescription_id, medicine_id, prescribed_quantity, dosage_instructions)
           VALUES (?, ?, ?, ?, ?)`,
          [rxItemId, rx_id, item.medicine_id, item.quantity, 'As directed by physician']
        );

        const subtotal = Number(item.quantity) * Number(item.unit_price || 10.0);
        totalAmount += subtotal;
      }

      // 3. Create dispensation record
      await tx.execute(
        `INSERT INTO dispensations (dispensing_id, prescription_id, pharmacist_user_id, pharmacy_id, patient_name, total_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')`,
        [dispensing_id, rx_id, req.user!.user_id, pharmId, patient_name, totalAmount]
      );

      // 4. Create dispensing items and decrement pharmacy stock
      for (const item of items) {
        const dispItemId = `DSP_ITM_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
        const subtotal = Number(item.quantity) * Number(item.unit_price || 10.0);

        await tx.execute(
          `INSERT INTO dispensing_items (dispensing_item_id, dispensing_id, batch_id, medicine_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [dispItemId, dispensing_id, item.batch_id, item.medicine_id, item.quantity, item.unit_price || 10.0, subtotal]
        );

        // Deduct pharmacy inventory
        await tx.execute(
          `UPDATE inventory SET quantity = quantity - ? WHERE owner_type = 'PHARMACY' AND owner_id = ? AND batch_id = ?`,
          [item.quantity, pharmId, item.batch_id]
        );

        // Deduct remaining batch quantity
        await tx.execute(
          `UPDATE batches SET remaining_quantity = remaining_quantity - ? WHERE batch_id = ?`,
          [item.quantity, item.batch_id]
        );
      }

      // 5. Create audit log entry
      await logAuditAction(
        req.user!.user_id,
        'DISPENSATION_COMPLETED',
        'DISPENSATION',
        dispensing_id,
        `Atomic transaction completed: Dispensed medicines (ID: ${dispensing_id}, Total: ₹${totalAmount.toFixed(2)}) to patient ${patient_name}. Inventory decremented.`,
        tx
      );
    });

    return res.json({
      success: true,
      message: 'Dispensing transaction completed successfully. Inventory updated and audit logged.',
      dispensing_id,
      prescription_id: rx_id,
      total_amount: totalAmount
    });

  } catch (error: any) {
    console.error('Dispensing transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Transaction Rollback Error: ' + error.message
    });
  }
});

// GET /api/pharmacist/dispensing-history
router.get('/dispensing-history', async (req: AuthRequest, res) => {
  try {
    const pharmId = req.user?.organization_id || req.query.pharmacy_id;
    const history = await db.query(
      `SELECT d.*, u.username as pharmacist_name
       FROM dispensations d
       JOIN users u ON d.pharmacist_user_id = u.user_id
       WHERE d.pharmacy_id = ?
       ORDER BY d.dispensing_date DESC`,
      [pharmId]
    );

    for (const item of history) {
      item.items = await db.query(
        `SELECT di.*, m.medicine_name, b.batch_number 
         FROM dispensing_items di
         JOIN medicines m ON di.medicine_id = m.medicine_id
         JOIN batches b ON di.batch_id = b.batch_id
         WHERE di.dispensing_id = ?`,
        [item.dispensing_id]
      );
    }

    return res.json({ success: true, count: history.length, history });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/pharmacist/orders - Pharmacy Orders placed to Distributors
router.get('/orders', async (req: AuthRequest, res) => {
  try {
    const pharmId = req.user?.organization_id || req.query.pharmacy_id;
    const orders = await db.query(
      `SELECT o.*, d.company_name as distributor_name
       FROM orders o
       JOIN distributors d ON o.distributor_id = d.distributor_id
       WHERE o.pharmacy_id = ?
       ORDER BY o.created_at DESC`,
      [pharmId]
    );
    return res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/pharmacist/orders - Create Order to Distributor
router.post('/orders', async (req: AuthRequest, res) => {
  try {
    const { distributor_id, items } = req.body;
    const pharmId = req.user?.organization_id || req.body.pharmacy_id;

    if (!pharmId || !distributor_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Pharmacy ID, distributor ID, and items array required.' });
    }

    const order_id = `ORD_${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    await db.transaction(async (tx) => {
      for (const item of items) {
        totalAmount += Number(item.quantity) * Number(item.unit_price || 10.0);
      }

      await tx.execute(
        `INSERT INTO orders (order_id, pharmacy_id, distributor_id, status, total_amount) VALUES (?, ?, ?, 'PENDING', ?)`,
        [order_id, pharmId, distributor_id, totalAmount]
      );

      for (const item of items) {
        const itemId = `ORD_ITM_${Date.now().toString().slice(-6)}_${Math.floor(Math.random()*100)}`;
        const sub = Number(item.quantity) * Number(item.unit_price || 10.0);
        await tx.execute(
          `INSERT INTO order_items (order_item_id, order_id, medicine_id, batch_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [itemId, order_id, item.medicine_id, item.batch_id || null, item.quantity, item.unit_price || 10.0, sub]
        );
      }

      await logAuditAction(req.user!.user_id, 'ORDER_CREATED', 'ORDER', order_id, `Pharmacist placed order ${order_id} to distributor ${distributor_id}`, tx);
    });

    return res.json({ success: true, message: 'Pharmacy order created successfully.', order_id });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
