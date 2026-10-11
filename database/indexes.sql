-- ============================================================================
-- SMART PHARMACEUTICAL SUPPLY CHAIN & PHARMACY MANAGEMENT SYSTEM
-- Database Performance Indexes
-- ============================================================================

USE `pharma_management`;

-- User & Authentication Indexes
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_role` ON `users` (`role_id`);
CREATE INDEX `idx_users_status` ON `users` (`status`);

-- Medicine Indexes
CREATE INDEX `idx_medicines_name` ON `medicines` (`medicine_name`);
CREATE INDEX `idx_medicines_generic` ON `medicines` (`generic_name`);
CREATE INDEX `idx_medicines_brand` ON `medicines` (`brand_name`);
CREATE INDEX `idx_medicines_mfr` ON `medicines` (`manufacturer_id`);

-- Batch Indexes
CREATE INDEX `idx_batches_number` ON `batches` (`batch_number`);
CREATE INDEX `idx_batches_expiry` ON `batches` (`expiry_date`);
CREATE INDEX `idx_batches_status` ON `batches` (`batch_status`);
CREATE INDEX `idx_batches_med_status` ON `batches` (`medicine_id`, `batch_status`);

-- Inventory Indexes
CREATE INDEX `idx_inventory_owner` ON `inventory` (`owner_type`, `owner_id`);
CREATE INDEX `idx_inventory_batch` ON `inventory` (`batch_id`);
CREATE INDEX `idx_inventory_med` ON `inventory` (`medicine_id`);

-- Order Indexes
CREATE INDEX `idx_orders_status` ON `orders` (`status`);
CREATE INDEX `idx_orders_pharmacy` ON `orders` (`pharmacy_id`);
CREATE INDEX `idx_orders_distributor` ON `orders` (`distributor_id`);
CREATE INDEX `idx_orders_date` ON `orders` (`order_date`);

-- Shipment Indexes
CREATE INDEX `idx_shipments_tracking` ON `shipments` (`tracking_number`);
CREATE INDEX `idx_shipments_status` ON `shipments` (`status`);
CREATE INDEX `idx_shipments_sender` ON `shipments` (`sender_type`, `sender_id`);
CREATE INDEX `idx_shipments_receiver` ON `shipments` (`receiver_type`, `receiver_id`);

-- Dispensing & Alert Indexes
CREATE INDEX `idx_dispensing_date` ON `dispensations` (`dispensing_date`);
CREATE INDEX `idx_dispensing_pharmacy` ON `dispensations` (`pharmacy_id`);
CREATE INDEX `idx_alerts_status_type` ON `alerts` (`status`, `alert_type`);
CREATE INDEX `idx_audit_logs_user` ON `audit_logs` (`user_id`);
