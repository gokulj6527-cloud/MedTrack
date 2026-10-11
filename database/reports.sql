-- ============================================================================
-- SMART PHARMACEUTICAL SUPPLY CHAIN & PHARMACY MANAGEMENT SYSTEM
-- Complex SQL Reports with JOINs, Aggregations, GROUP BY, and Filtering
-- ============================================================================

USE `pharma_management`;

-- ----------------------------------------------------------------------------
-- REPORT 1: Comprehensive System Inventory Report
-- Business Purpose: View live stock distribution across Manufacturers, Distributors, and Pharmacies
-- Demonstrates: INNER JOIN, LEFT JOIN, CASE expressions
-- ----------------------------------------------------------------------------
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
ORDER BY b.expiry_date ASC, i.quantity ASC;


-- ----------------------------------------------------------------------------
-- REPORT 2: Monthly Dispensing & Sales Revenue Report
-- Business Purpose: Analyze pharmacy dispensing performance, total units, and sales value by month
-- Demonstrates: INNER JOIN, GROUP BY, SUM, COUNT, DATE_FORMAT
-- ----------------------------------------------------------------------------
SELECT 
    p.pharmacy_name,
    DATE_FORMAT(disp.dispensing_date, '%Y-%m') AS dispensing_month,
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
GROUP BY p.pharmacy_name, DATE_FORMAT(disp.dispensing_date, '%Y-%m'), med.medicine_name, med.generic_name
ORDER BY dispensing_month DESC, total_revenue DESC;


-- ----------------------------------------------------------------------------
-- REPORT 3: Manufacturer Production & Yield Analysis Report
-- Business Purpose: Track total batches produced, quantity manufactured, and production value per manufacturer
-- Demonstrates: INNER JOIN, GROUP BY, SUM, COUNT, HAVING
-- ----------------------------------------------------------------------------
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
ORDER BY total_quantity_produced DESC;


-- ----------------------------------------------------------------------------
-- REPORT 4: Expiry & Shelf-Life Risk Assessment Report
-- Business Purpose: Identify expired and near-expiry batches to prevent distribution of unsafe medicines
-- Demonstrates: INNER JOIN, DATEDIFF, Date Arithmetic, WHERE filtering
-- ----------------------------------------------------------------------------
SELECT 
    b.batch_number,
    med.medicine_name,
    med.generic_name,
    m.company_name AS manufacturer_name,
    b.manufacturing_date,
    b.expiry_date,
    DATEDIFF(b.expiry_date, CURRENT_DATE) AS days_until_expiry,
    b.remaining_quantity,
    b.batch_status,
    CASE 
        WHEN DATEDIFF(b.expiry_date, CURRENT_DATE) < 0 THEN 'EXPIRED - DO NOT DISPENSE'
        WHEN DATEDIFF(b.expiry_date, CURRENT_DATE) <= 30 THEN 'CRITICAL (<= 30 Days)'
        WHEN DATEDIFF(b.expiry_date, CURRENT_DATE) <= 60 THEN 'HIGH RISK (31-60 Days)'
        WHEN DATEDIFF(b.expiry_date, CURRENT_DATE) <= 90 THEN 'MODERATE RISK (61-90 Days)'
        ELSE 'SAFE'
    END AS risk_classification
FROM batches b
JOIN medicines med ON b.medicine_id = med.medicine_id
JOIN manufacturers m ON b.manufacturer_id = m.manufacturer_id
WHERE b.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
   OR b.batch_status = 'EXPIRED'
ORDER BY b.expiry_date ASC;


-- ----------------------------------------------------------------------------
-- REPORT 5: Drug Recall & Affected Inventory Audit Report
-- Business Purpose: Track initiated recalls, defect reasons, severity class, and trace affected inventory in supply chain
-- Demonstrates: INNER JOIN, LEFT JOIN, GROUP BY, SUM
-- ----------------------------------------------------------------------------
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
ORDER BY r.recall_date DESC;
