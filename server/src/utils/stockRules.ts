import { DatabaseAdapter } from '../database/db';

export function isExpired(expiryDate: string | Date, today = new Date().toISOString().slice(0, 10)): boolean {
  const exp = String(expiryDate).slice(0, 10);
  return exp < today;
}

export function blockedBatchReason(batch: any): string | null {
  if (!batch) return 'Batch not found.';
  if (batch.batch_status === 'RECALLED') {
    return `Batch '${batch.batch_number}' is RECALLED and cannot be supplied or dispensed.`;
  }
  if (batch.batch_status === 'DEFECTIVE' || batch.batch_status === 'QUARANTINED' || batch.batch_status === 'DISPOSED') {
    return `Batch '${batch.batch_number}' is ${batch.batch_status} and cannot move through the supply chain.`;
  }
  if (batch.batch_status === 'EXPIRED' || isExpired(batch.expiry_date)) {
    return `Batch '${batch.batch_number}' is EXPIRED (${String(batch.expiry_date).slice(0, 10)}) and cannot be supplied or dispensed.`;
  }
  return null;
}

export async function getSetting(db: DatabaseAdapter, key: string, fallback: string): Promise<string> {
  const row = await db.queryOne<{ setting_value: string }>('SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]);
  return row?.setting_value ?? fallback;
}

export const MEDICINE_MASTER_SQL = `
  SELECT
    m.medicine_id,
    m.medicine_name,
    m.generic_name,
    m.brand_name,
    m.dosage_form,
    m.strength,
    m.description,
    m.prescription_required,
    m.storage_temperature_min,
    m.storage_temperature_max,
    m.unit_price,
    COALESCE(m.category, m.dosage_form) AS category,
    COALESCE(m.min_stock_level, 100) AS min_stock_level,
    m.status AS catalog_status,
    mfr.manufacturer_id,
    mfr.company_name AS manufacturer_name,
    (SELECT GROUP_CONCAT(ingredient_name || ' ' || strength || unit, ', ')
       FROM medicine_compositions c WHERE c.medicine_id = m.medicine_id) AS composition,
    (SELECT COUNT(*) FROM batches b WHERE b.medicine_id = m.medicine_id) AS total_batches,
    (SELECT COALESCE(SUM(quantity_produced), 0) FROM batches b WHERE b.medicine_id = m.medicine_id) AS total_quantity_produced,
    (SELECT COALESCE(SUM(COALESCE(quantity_dispatched, 0)), 0) FROM batches b WHERE b.medicine_id = m.medicine_id) AS total_quantity_distributed,
    (SELECT COALESCE(SUM(di.quantity), 0) FROM dispensing_items di WHERE di.medicine_id = m.medicine_id) AS total_quantity_dispensed,
    (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.medicine_id = m.medicine_id) AS available_stock,
    (SELECT MIN(manufacturing_date) FROM batches b WHERE b.medicine_id = m.medicine_id) AS manufacturing_date,
    (SELECT MIN(expiry_date) FROM batches b WHERE b.medicine_id = m.medicine_id AND b.batch_status NOT IN ('DISPOSED')) AS expiry_date,
    CASE
      WHEN EXISTS (SELECT 1 FROM batches b WHERE b.medicine_id = m.medicine_id AND b.batch_status = 'RECALLED') THEN 'Recalled'
      WHEN EXISTS (SELECT 1 FROM batches b WHERE b.medicine_id = m.medicine_id AND (b.batch_status = 'EXPIRED' OR b.expiry_date < CURRENT_DATE))
           AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.medicine_id = m.medicine_id AND b.batch_status = 'ACTIVE' AND b.expiry_date >= CURRENT_DATE) THEN 'Expired'
      WHEN EXISTS (SELECT 1 FROM batches b WHERE b.medicine_id = m.medicine_id AND b.batch_status = 'ACTIVE' AND b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) AND b.expiry_date >= CURRENT_DATE) THEN 'Near Expiry'
      WHEN (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.medicine_id = m.medicine_id) <= COALESCE(m.min_stock_level, 100) THEN 'Low Stock'
      WHEN m.status = 'DISCONTINUED' THEN 'Inactive'
      ELSE 'Active'
    END AS medicine_status
  FROM medicines m
  JOIN manufacturers mfr ON m.manufacturer_id = mfr.manufacturer_id
`;

export const PRODUCTION_BATCH_SQL = `
  SELECT
    b.batch_id,
    b.batch_number,
    b.medicine_id,
    b.manufacturer_id,
    mfr.company_name AS manufacturer_name,
    m.medicine_name,
    m.brand_name,
    m.generic_name,
    b.manufacturing_date,
    b.expiry_date,
    b.quantity_produced,
    COALESCE(b.quantity_dispatched, 0) AS quantity_sent_to_distributors,
    (b.quantity_produced - COALESCE(b.quantity_dispatched, 0)) AS remaining_quantity,
    b.batch_status,
    b.defect_notes,
    b.unit_cost,
    CASE
      WHEN b.batch_status = 'RECALLED' THEN 'Recalled'
      WHEN b.batch_status = 'DEFECTIVE' THEN 'Defective'
      WHEN b.batch_status = 'EXPIRED' OR b.expiry_date < CURRENT_DATE THEN 'Expired'
      WHEN b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) THEN 'Near Expiry'
      ELSE b.batch_status
    END AS display_status
  FROM batches b
  JOIN medicines m ON b.medicine_id = m.medicine_id
  JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
`;
