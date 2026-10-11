-- ============================================================================
-- SMART PHARMACEUTICAL SUPPLY CHAIN & PHARMACY MANAGEMENT SYSTEM
-- Database Constraints & Triggers Definition
-- ============================================================================

USE `pharma_management`;

-- 1. Check Constraint: Expiry date must be after manufacturing date
ALTER TABLE `batches`
ADD CONSTRAINT `chk_batch_dates` CHECK (`expiry_date` > `manufacturing_date`);

-- 2. Check Constraint: Quantities cannot be negative
ALTER TABLE `batches`
ADD CONSTRAINT `chk_batch_qty` CHECK (`quantity_produced` >= 0 AND `remaining_quantity` >= 0);

ALTER TABLE `inventory`
ADD CONSTRAINT `chk_inv_qty` CHECK (`quantity` >= 0);

ALTER TABLE `order_items`
ADD CONSTRAINT `chk_orderitem_qty` CHECK (`quantity` > 0);

ALTER TABLE `shipment_items`
ADD CONSTRAINT `chk_shipitem_qty` CHECK (`quantity` > 0);

ALTER TABLE `dispensing_items`
ADD CONSTRAINT `chk_dispitem_qty` CHECK (`quantity` > 0);

-- 3. Check Constraint: Temperature bounds check
ALTER TABLE `temperature_readings`
ADD CONSTRAINT `chk_temp_bounds` CHECK (`acceptable_min` < `acceptable_max`);

-- 4. Check Constraint: Drug interaction non-self reference & ordered pairing rule
ALTER TABLE `drug_interactions`
ADD CONSTRAINT `chk_diff_medicines` CHECK (`medicine_id_1` <> `medicine_id_2`);

-- Unique Constraint to prevent reverse duplicate drug interaction records (A+B and B+A)
ALTER TABLE `drug_interactions`
ADD CONSTRAINT `uk_drug_pair` UNIQUE (`medicine_id_1`, `medicine_id_2`);
