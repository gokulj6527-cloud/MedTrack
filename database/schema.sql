-- ============================================================================
-- SMART PHARMACEUTICAL SUPPLY CHAIN & PHARMACY MANAGEMENT SYSTEM (MEDTRACK)
-- MySQL 8.0+ Database Schema (Normalized to 3NF)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `pharma_management`;
USE `pharma_management`;

-- Drop existing tables if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `alerts`;
DROP TABLE IF EXISTS `recalls`;
DROP TABLE IF EXISTS `drug_interactions`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `stock_adjustments`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `dispensing_items`;
DROP TABLE IF EXISTS `dispensations`;
DROP TABLE IF EXISTS `prescription_items`;
DROP TABLE IF EXISTS `prescriptions`;
DROP TABLE IF EXISTS `temperature_readings`;
DROP TABLE IF EXISTS `shipment_items`;
DROP TABLE IF EXISTS `shipments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `inventory`;
DROP TABLE IF EXISTS `batches`;
DROP TABLE IF EXISTS `medicine_compositions`;
DROP TABLE IF EXISTS `medicines`;
DROP TABLE IF EXISTS `pharmacies`;
DROP TABLE IF EXISTS `distributors`;
DROP TABLE IF EXISTS `manufacturers`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. ROLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `roles` (
    `role_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
    `user_id` VARCHAR(50) PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role_id` INT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'BANNED') DEFAULT 'APPROVED',
    `rejection_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. MANUFACTURERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `manufacturers` (
    `manufacturer_id` VARCHAR(50) PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL UNIQUE,
    `company_name` VARCHAR(150) NOT NULL,
    `license_number` VARCHAR(100) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `address` TEXT NOT NULL,
    `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'BANNED') DEFAULT 'APPROVED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_manufacturers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. DISTRIBUTORS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `distributors` (
    `distributor_id` VARCHAR(50) PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL UNIQUE,
    `company_name` VARCHAR(150) NOT NULL,
    `license_number` VARCHAR(100) NOT NULL UNIQUE,
    `warehouse_address` TEXT NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'BANNED') DEFAULT 'APPROVED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_distributors_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. PHARMACIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `pharmacies` (
    `pharmacy_id` VARCHAR(50) PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL UNIQUE,
    `pharmacy_name` VARCHAR(150) NOT NULL,
    `license_number` VARCHAR(100) NOT NULL UNIQUE,
    `pharmacist_in_charge` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `address` TEXT NOT NULL,
    `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'BANNED') DEFAULT 'APPROVED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pharmacies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. MEDICINES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `medicines` (
    `medicine_id` VARCHAR(50) PRIMARY KEY,
    `manufacturer_id` VARCHAR(50) NOT NULL,
    `medicine_name` VARCHAR(150) NOT NULL,
    `generic_name` VARCHAR(150) NOT NULL,
    `brand_name` VARCHAR(150) NOT NULL,
    `dosage_form` VARCHAR(50) NOT NULL,
    `strength` VARCHAR(50) NOT NULL,
    `description` TEXT,
    `prescription_required` BOOLEAN DEFAULT TRUE,
    `storage_temperature_min` DECIMAL(5,2) DEFAULT 15.00,
    `storage_temperature_max` DECIMAL(5,2) DEFAULT 25.00,
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    `category` VARCHAR(100) DEFAULT 'General',
    `min_stock_level` INT DEFAULT 100,
    `status` ENUM('ACTIVE', 'DISCONTINUED') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_medicines_mfr` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`manufacturer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. MEDICINE COMPOSITIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `medicine_compositions` (
    `composition_id` INT AUTO_INCREMENT PRIMARY KEY,
    `medicine_id` VARCHAR(50) NOT NULL,
    `ingredient_name` VARCHAR(150) NOT NULL,
    `strength` VARCHAR(50) NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    CONSTRAINT `fk_compositions_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 8. BATCHES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `batches` (
    `batch_id` VARCHAR(50) PRIMARY KEY,
    `medicine_id` VARCHAR(50) NOT NULL,
    `manufacturer_id` VARCHAR(50) NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL UNIQUE,
    `manufacturing_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `quantity_produced` INT NOT NULL,
    `quantity_dispatched` INT NOT NULL DEFAULT 0,
    `remaining_quantity` INT NOT NULL,
    `unit_cost` DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    `defect_notes` TEXT NULL,
    `batch_status` ENUM('ACTIVE', 'QUARANTINED', 'RECALLED', 'EXPIRED', 'DEFECTIVE', 'DISPOSED') DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_batches_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_batches_mfr` FOREIGN KEY (`manufacturer_id`) REFERENCES `manufacturers` (`manufacturer_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 9. INVENTORY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `inventory` (
    `inventory_id` VARCHAR(50) PRIMARY KEY,
    `owner_type` ENUM('MANUFACTURER', 'DISTRIBUTOR', 'PHARMACY') NOT NULL,
    `owner_id` VARCHAR(50) NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL,
    `medicine_id` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL DEFAULT 0,
    `quantity_received` INT NOT NULL DEFAULT 0,
    `quantity_supplied` INT NOT NULL DEFAULT 0,
    `quantity_dispensed` INT NOT NULL DEFAULT 0,
    `quantity_reduced` INT NOT NULL DEFAULT 0,
    `reorder_level` INT DEFAULT 50,
    `last_received_at` TIMESTAMP NULL,
    `last_supplied_at` TIMESTAMP NULL,
    `last_dispensed_at` TIMESTAMP NULL,
    `temperature_status` VARCHAR(30) DEFAULT 'NORMAL',
    `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_inventory_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_inventory_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uk_owner_batch` UNIQUE (`owner_id`, `batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 10. ORDERS TABLE (Pharmacy -> Distributor)
-- ----------------------------------------------------------------------------
CREATE TABLE `orders` (
    `order_id` VARCHAR(50) PRIMARY KEY,
    `pharmacy_id` VARCHAR(50) NOT NULL,
    `distributor_id` VARCHAR(50) NOT NULL,
    `order_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('PENDING', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REJECTED') DEFAULT 'PENDING',
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_orders_pharmacy` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies` (`pharmacy_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_distributor` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`distributor_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 11. ORDER ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `order_items` (
    `order_item_id` VARCHAR(50) PRIMARY KEY,
    `order_id` VARCHAR(50) NOT NULL,
    `medicine_id` VARCHAR(50) NOT NULL,
    `batch_id` VARCHAR(50) NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10,2) NOT NULL,
    `subtotal` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_orderitems_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_orderitems_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 12. SHIPMENTS TABLE (MFR -> DIST or DIST -> PHARM)
-- ----------------------------------------------------------------------------
CREATE TABLE `shipments` (
    `shipment_id` VARCHAR(50) PRIMARY KEY,
    `sender_type` ENUM('MANUFACTURER', 'DISTRIBUTOR') NOT NULL,
    `sender_id` VARCHAR(50) NOT NULL,
    `receiver_type` ENUM('DISTRIBUTOR', 'PHARMACY') NOT NULL,
    `receiver_id` VARCHAR(50) NOT NULL,
    `order_id` VARCHAR(50) NULL,
    `shipment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `received_date` TIMESTAMP NULL,
    `tracking_number` VARCHAR(100) NOT NULL UNIQUE,
    `cold_chain_required` BOOLEAN DEFAULT FALSE,
    `status` ENUM('PREPARING', 'IN_TRANSIT', 'DELIVERED', 'QUARANTINED', 'REJECTED') DEFAULT 'IN_TRANSIT',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_shipments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 13. SHIPMENT ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `shipment_items` (
    `shipment_item_id` VARCHAR(50) PRIMARY KEY,
    `shipment_id` VARCHAR(50) NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL,
    CONSTRAINT `fk_shipmentitems_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`shipment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_shipmentitems_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 14. TEMPERATURE READINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `temperature_readings` (
    `reading_id` INT AUTO_INCREMENT PRIMARY KEY,
    `shipment_id` VARCHAR(50) NOT NULL,
    `recorded_temperature` DECIMAL(5,2) NOT NULL,
    `acceptable_min` DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    `acceptable_max` DECIMAL(5,2) NOT NULL DEFAULT 8.00,
    `alert_status` ENUM('NORMAL', 'WARNING', 'VIOLATION') DEFAULT 'NORMAL',
    `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_temp_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`shipment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 15. PRESCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `prescriptions` (
    `prescription_id` VARCHAR(50) PRIMARY KEY,
    `pharmacy_id` VARCHAR(50) NOT NULL,
    `prescription_number` VARCHAR(100) NOT NULL UNIQUE,
    `patient_name` VARCHAR(150) NOT NULL,
    `patient_user_id` VARCHAR(50) NULL,
    `doctor_name` VARCHAR(150) NOT NULL,
    `prescription_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'DISPENSED', 'CANCELLED') DEFAULT 'VERIFIED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_prescriptions_pharmacy` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies` (`pharmacy_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 16. PRESCRIPTION ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `prescription_items` (
    `prescription_item_id` VARCHAR(50) PRIMARY KEY,
    `prescription_id` VARCHAR(50) NOT NULL,
    `medicine_id` VARCHAR(50) NOT NULL,
    `prescribed_quantity` INT NOT NULL,
    `dosage_instructions` VARCHAR(255) NOT NULL,
    CONSTRAINT `fk_rxitems_rx` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rxitems_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 17. DISPENSATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `dispensations` (
    `dispensing_id` VARCHAR(50) PRIMARY KEY,
    `prescription_id` VARCHAR(50) NULL,
    `pharmacist_user_id` VARCHAR(50) NOT NULL,
    `pharmacy_id` VARCHAR(50) NOT NULL,
    `patient_name` VARCHAR(150) NOT NULL,
    `dispensing_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
    CONSTRAINT `fk_dispensations_rx` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_dispensations_pharmacy` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies` (`pharmacy_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_dispensations_user` FOREIGN KEY (`pharmacist_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 18. DISPENSING ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `dispensing_items` (
    `dispensing_item_id` VARCHAR(50) PRIMARY KEY,
    `dispensing_id` VARCHAR(50) NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL,
    `medicine_id` VARCHAR(50) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10,2) NOT NULL,
    `subtotal` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_dispitems_dispensing` FOREIGN KEY (`dispensing_id`) REFERENCES `dispensations` (`dispensing_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_dispitems_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_dispitems_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`medicine_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 19. DRUG INTERACTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `drug_interactions` (
    `interaction_id` INT AUTO_INCREMENT PRIMARY KEY,
    `medicine_id_1` VARCHAR(50) NOT NULL,
    `medicine_id_2` VARCHAR(50) NOT NULL,
    `severity` ENUM('LOW', 'MODERATE', 'HIGH', 'CONTRAINDICATED') NOT NULL,
    `description` TEXT NOT NULL,
    `recommendation` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_interaction_med1` FOREIGN KEY (`medicine_id_1`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_interaction_med2` FOREIGN KEY (`medicine_id_2`) REFERENCES `medicines` (`medicine_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 20. RECALLS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `recalls` (
    `recall_id` VARCHAR(50) PRIMARY KEY,
    `batch_id` VARCHAR(50) NOT NULL,
    `initiated_by` VARCHAR(50) NOT NULL,
    `reason` TEXT NOT NULL,
    `recall_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `severity` ENUM('CLASS_I', 'CLASS_II', 'CLASS_III') DEFAULT 'CLASS_I',
    `status` ENUM('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'INITIATED',
    CONSTRAINT `fk_recalls_batch` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`batch_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_recalls_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 21. ALERTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `alerts` (
    `alert_id` VARCHAR(50) PRIMARY KEY,
    `alert_type` ENUM('EXPIRY', 'NEAR_EXPIRY', 'TEMPERATURE', 'RECALL', 'LOW_STOCK') NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'WARNING',
    `message` TEXT NOT NULL,
    `related_entity_type` VARCHAR(50) NULL,
    `related_entity_id` VARCHAR(50) NULL,
    `status` ENUM('UNREAD', 'RESOLVED') DEFAULT 'UNREAD',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `resolved_at` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 22. AUDIT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 23. PATIENTS (general USER role)
-- ----------------------------------------------------------------------------
CREATE TABLE `patients` (
    `patient_id` VARCHAR(50) PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30),
    `date_of_birth` DATE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_patients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 24. COMPLAINTS / COUNTERFEIT REPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE `complaints` (
    `complaint_id` VARCHAR(50) PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `medicine_id` VARCHAR(50),
    `batch_number` VARCHAR(100),
    `complaint_type` VARCHAR(50) NOT NULL DEFAULT 'QUALITY',
    `description` TEXT NOT NULL,
    `status` VARCHAR(30) DEFAULT 'OPEN',
    `admin_notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_complaints_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 25. STOCK ADJUSTMENTS (damage, missing, quarantine reductions)
-- ----------------------------------------------------------------------------
CREATE TABLE `stock_adjustments` (
    `adjustment_id` VARCHAR(50) PRIMARY KEY,
    `inventory_id` VARCHAR(50) NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL,
    `owner_type` VARCHAR(30) NOT NULL,
    `owner_id` VARCHAR(50) NOT NULL,
    `quantity_change` INT NOT NULL,
    `reason` VARCHAR(100) NOT NULL,
    `notes` TEXT,
    `performed_by` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_adjust_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`inventory_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 26. SYSTEM SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE `system_settings` (
    `setting_key` VARCHAR(100) PRIMARY KEY,
    `setting_value` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
