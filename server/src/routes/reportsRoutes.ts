import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// 1. Inventory Report SQL & Execution
router.get('/inventory', async (req, res) => {
  const sql = `
    SELECT 
      i.inventory_id,
      i.owner_type,
      i.owner_id,
      COALESCE(m.company_name, d.company_name, p.pharmacy_name) AS organization_name,
      med.medicine_name,
      med.generic_name,
      b.batch_number,
      b.expiry_date,
      b.batch_status,
      i.quantity AS available_quantity,
      CASE 
        WHEN b.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'CRITICAL_EXPIRY'
        WHEN b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY) THEN 'NEAR_EXPIRY'
        WHEN i.quantity <= i.reorder_level THEN 'LOW_STOCK'
        ELSE 'OPTIMAL'
      END AS stock_health_status
    FROM inventory i
    JOIN batches b ON i.batch_id = b.batch_id
    JOIN medicines med ON i.medicine_id = med.medicine_id
    LEFT JOIN manufacturers m ON i.owner_type = 'MANUFACTURER' AND i.owner_id = m.manufacturer_id
    LEFT JOIN distributors d ON i.owner_type = 'DISTRIBUTOR' AND i.owner_id = d.distributor_id
    LEFT JOIN pharmacies p ON i.owner_type = 'PHARMACY' AND i.owner_id = p.pharmacy_id
    ORDER BY b.expiry_date ASC, i.quantity ASC
  `;

  try {
    const data = await db.query(sql);
    return res.json({ success: true, report: 'Inventory Report', sql, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Monthly Dispensing Report
router.get('/dispensing', async (req, res) => {
  const sql = `
    SELECT 
      p.pharmacy_name,
      strftime('%Y-%m', disp.dispensing_date) AS dispensing_month,
      med.medicine_name,
      med.generic_name,
      COUNT(DISTINCT disp.dispensing_id) AS total_dispensing_transactions,
      SUM(item.quantity) AS total_units_dispensed,
      SUM(item.subtotal) AS total_revenue
    FROM dispensations disp
    JOIN dispensing_items item ON disp.dispensing_id = item.dispensing_id
    JOIN medicines med ON item.medicine_id = med.medicine_id
    JOIN pharmacies p ON disp.pharmacy_id = p.pharmacy_id
    WHERE disp.status = 'COMPLETED'
    GROUP BY p.pharmacy_name, strftime('%Y-%m', disp.dispensing_date), med.medicine_name, med.generic_name
    ORDER BY dispensing_month DESC, total_revenue DESC
  `;

  try {
    const data = await db.query(sql);
    return res.json({ success: true, report: 'Monthly Dispensing Report', sql, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Manufacturer Production Report
router.get('/production', async (req, res) => {
  const sql = `
    SELECT 
      m.company_name AS manufacturer_name,
      med.medicine_name,
      med.dosage_form,
      med.strength,
      COUNT(b.batch_id) AS total_batches_produced,
      SUM(b.quantity_produced) AS total_quantity_produced,
      SUM(b.remaining_quantity) AS current_remaining_quantity,
      SUM(b.quantity_produced * b.unit_cost) AS total_production_cost
    FROM manufacturers m
    JOIN medicines med ON m.manufacturer_id = med.manufacturer_id
    JOIN batches b ON med.medicine_id = b.medicine_id
    GROUP BY m.company_name, med.medicine_name, med.dosage_form, med.strength
    HAVING total_batches_produced > 0
    ORDER BY total_quantity_produced DESC
  `;

  try {
    const data = await db.query(sql);
    return res.json({ success: true, report: 'Manufacturer Production Report', sql, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Expiry Report
router.get('/expiry', async (req, res) => {
  const sql = `
    SELECT 
      b.batch_number,
      med.medicine_name,
      med.generic_name,
      m.company_name AS manufacturer_name,
      b.manufacturing_date,
      b.expiry_date,
      ROUND(julianday(b.expiry_date) - julianday(CURRENT_DATE)) AS days_until_expiry,
      b.remaining_quantity,
      b.batch_status,
      CASE 
        WHEN julianday(b.expiry_date) < julianday(CURRENT_DATE) THEN 'EXPIRED - DO NOT DISPENSE'
        WHEN (julianday(b.expiry_date) - julianday(CURRENT_DATE)) <= 30 THEN 'CRITICAL (<= 30 Days)'
        WHEN (julianday(b.expiry_date) - julianday(CURRENT_DATE)) <= 60 THEN 'HIGH RISK (31-60 Days)'
        WHEN (julianday(b.expiry_date) - julianday(CURRENT_DATE)) <= 90 THEN 'MODERATE RISK (61-90 Days)'
        ELSE 'SAFE'
      END AS risk_classification
    FROM batches b
    JOIN medicines med ON b.medicine_id = med.medicine_id
    JOIN manufacturers m ON b.manufacturer_id = m.manufacturer_id
    ORDER BY b.expiry_date ASC
  `;

  try {
    const data = await db.query(sql);
    return res.json({ success: true, report: 'Expiry & Risk Assessment Report', sql, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Recall Report
router.get('/recalls', async (req, res) => {
  const sql = `
    SELECT 
      r.recall_id,
      r.recall_date,
      r.severity AS recall_class,
      r.status AS recall_status,
      r.reason AS defect_reason,
      b.batch_number,
      med.medicine_name,
      m.company_name AS manufacturer_name,
      u.username AS initiated_by_user,
      COALESCE(SUM(inv.quantity), 0) AS affected_stock_in_circulation
    FROM recalls r
    JOIN batches b ON r.batch_id = b.batch_id
    JOIN medicines med ON b.medicine_id = med.medicine_id
    JOIN manufacturers m ON b.manufacturer_id = m.manufacturer_id
    JOIN users u ON r.initiated_by = u.user_id
    LEFT JOIN inventory inv ON b.batch_id = inv.batch_id
    GROUP BY r.recall_id, r.recall_date, r.severity, r.status, r.reason, b.batch_number, med.medicine_name, m.company_name, u.username
    ORDER BY r.recall_date DESC
  `;

  try {
    const data = await db.query(sql);
    return res.json({ success: true, report: 'Drug Recall Audit Report', sql, count: data.length, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
