-- ============================================================================
-- SMART PHARMACEUTICAL SUPPLY CHAIN & PHARMACY MANAGEMENT SYSTEM (MEDTRACK)
-- Seed Data SQL Script (Includes Pre-Created Roles & User Accounts)
-- ============================================================================

USE `pharma_management`;

-- 1. SEED ROLES
INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'ADMIN', 'System Administrator with full system monitoring and governance control'),
(2, 'MANUFACTURER', 'Pharmaceutical Manufacturer producing medicines and batch records'),
(3, 'DISTRIBUTOR', 'Logistics & Warehouse Distributor supplying medicines to pharmacies'),
(4, 'PHARMACIST', 'Licensed Pharmacist managing pharmacy inventory and safe patient dispensing');

-- 2. SEED USERS
-- Standard Password Hashing:
-- Admin@123 -> $2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W
-- Man@123   -> $2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W
-- Dist@123  -> $2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W
-- Pharm@123 -> $2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `role_id`, `status`) VALUES
-- Admin
('ADMIN001', 'admin', 'admin@medtrack.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 1, 'APPROVED'),

-- Manufacturers
('MAN001', 'apollo_mfr', 'contact@apollopharma.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 2, 'APPROVED'),
('MAN002', 'medlife_mfr', 'contact@medlifepharma.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 2, 'APPROVED'),
('MAN003', 'novamed_mfr', 'info@novamedlabs.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 2, 'APPROVED'),

-- Distributors
('DIST001', 'healthcare_dist', 'supply@healthcaredist.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),
('DIST002', 'medsupply_dist', 'orders@medsupplynet.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),
('DIST003', 'lifecare_dist', 'logistics@lifecaredist.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),
('DIST004', 'primemed_dist', 'contact@primemeddist.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),
('DIST005', 'safemeds_dist', 'info@safemedslogistics.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),
('DIST006', 'pharmalink_dist', 'support@pharmalinkdist.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 3, 'APPROVED'),

-- Pharmacists
('PHARM001', 'rahul_pharm', 'rahul.sharma@apollopharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM002', 'priya_pharm', 'priya.patel@wellnesspharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM003', 'ananya_pharm', 'ananya.rao@carepluspharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM004', 'arjun_pharm', 'arjun.kumar@cityhealthpharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM005', 'sneha_pharm', 'sneha.reddy@medexpress.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM006', 'karan_pharm', 'karan.mehta@lifecarepharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM007', 'neha_pharm', 'neha.singh@primechemists.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM008', 'aditya_pharm', 'aditya.verma@metrohealth.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM009', 'pooja_pharm', 'pooja.nair@greenfieldpharma.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED'),
('PHARM010', 'vikram_pharm', 'vikram.joshi@apexpharmacy.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 4, 'APPROVED');

-- 3. SEED ORGANIZATIONS
-- Manufacturers
INSERT INTO `manufacturers` (`manufacturer_id`, `user_id`, `company_name`, `license_number`, `email`, `phone`, `address`, `approval_status`) VALUES
('MFR_001', 'MAN001', 'Apollo Pharma Manufacturing', 'MFG-IND-2024-8891', 'contact@apollopharma.com', '+91 9876543210', 'Plot 42, Biotech Park, Genome Valley, Hyderabad', 'APPROVED'),
('MFR_002', 'MAN002', 'MedLife Pharmaceuticals', 'MFG-IND-2024-9920', 'contact@medlifepharma.com', '+91 9876543211', 'Industrial Area Phase 2, Baddi, Himachal Pradesh', 'APPROVED'),
('MFR_003', 'MAN003', 'NovaMed Labs', 'MFG-IND-2024-7741', 'info@novamedlabs.com', '+91 9876543212', 'GIDC Electronics Estate, Gandhinagar, Gujarat', 'APPROVED');

-- Distributors
INSERT INTO `distributors` (`distributor_id`, `user_id`, `company_name`, `license_number`, `warehouse_address`, `email`, `phone`, `approval_status`) VALUES
('DST_001', 'DIST001', 'HealthCare Distributors', 'DST-2024-001', 'Hub 12, Logistics Park, Mumbai', 'supply@healthcaredist.com', '+91 9812345671', 'APPROVED'),
('DST_002', 'DIST002', 'MedSupply Network', 'DST-2024-002', 'Warehouse 4A, Tech Cargo Hub, Bengaluru', 'orders@medsupplynet.com', '+91 9812345672', 'APPROVED'),
('DST_003', 'DIST003', 'LifeCare Distribution', 'DST-2024-003', 'Sector 63 Logistics Complex, Noida', 'logistics@lifecaredist.com', '+91 9812345673', 'APPROVED'),
('DST_004', 'DIST004', 'PrimeMed Distributors', 'DST-2024-004', 'Cold Chain Terminal 9, Chennai Port', 'contact@primemeddist.com', '+91 9812345674', 'APPROVED'),
('DST_005', 'DIST005', 'SafeMeds Logistics', 'DST-2024-005', 'Express Freight Hub, Ahmedabad', 'info@safemedslogistics.com', '+91 9812345675', 'APPROVED'),
('DST_006', 'DIST006', 'PharmaLink Distribution', 'DST-2024-006', 'Air Cargo Complex, Kolkata', 'support@pharmalinkdist.com', '+91 9812345676', 'APPROVED');

-- Pharmacies
INSERT INTO `pharmacies` (`pharmacy_id`, `user_id`, `pharmacy_name`, `license_number`, `pharmacist_in_charge`, `email`, `phone`, `address`, `approval_status`) VALUES
('PHM_001', 'PHARM001', 'Apollo Pharmacy Main', 'PHM-2024-101', 'Rahul Sharma', 'rahul.sharma@apollopharmacy.com', '+91 9988776651', '101 MG Road, Connaught Place, New Delhi', 'APPROVED'),
('PHM_002', 'PHARM002', 'Wellness Chemist & Care', 'PHM-2024-102', 'Priya Patel', 'priya.patel@wellnesspharmacy.com', '+91 9988776652', '45 Park Street, Kolkata', 'APPROVED'),
('PHM_003', 'PHARM003', 'CarePlus Pharmacy', 'PHM-2024-103', 'Ananya Rao', 'ananya.rao@carepluspharmacy.com', '+91 9988776653', '77 Indiranagar 100ft Road, Bengaluru', 'APPROVED'),
('PHM_004', 'PHARM004', 'CityHealth Medicos', 'PHM-2024-104', 'Arjun Kumar', 'arjun.kumar@cityhealthpharmacy.com', '+91 9988776654', '12 FC Road, Pune', 'APPROVED'),
('PHM_005', 'PHARM005', 'MedExpress Pharmacy', 'PHM-2024-105', 'Sneha Reddy', 'sneha.reddy@medexpress.com', '+91 9988776655', '88 Banjara Hills Road 2, Hyderabad', 'APPROVED'),
('PHM_006', 'PHARM006', 'LifeCare Pharmacy', 'PHM-2024-106', 'Karan Mehta', 'karan.mehta@lifecarepharmacy.com', '+91 9988776656', '23 Marine Drive, Mumbai', 'APPROVED'),
('PHM_007', 'PHARM007', 'Prime Chemists', 'PHM-2024-107', 'Neha Singh', 'neha.singh@primechemists.com', '+91 9988776657', '19 MI Road, Jaipur', 'APPROVED'),
('PHM_008', 'PHARM008', 'Metro Health Pharmacy', 'PHM-2024-108', 'Aditya Verma', 'aditya.verma@metrohealth.com', '+91 9988776658', '56 Sector 17, Chandigarh', 'APPROVED'),
('PHM_009', 'PHARM009', 'Greenfield Pharmacy', 'PHM-2024-109', 'Pooja Nair', 'pooja.nair@greenfieldpharma.com', '+91 9988776659', '34 MG Road, Kochi', 'APPROVED'),
('PHM_010', 'PHARM010', 'Apex Pharmacy', 'PHM-2024-110', 'Vikram Joshi', 'vikram.joshi@apexpharmacy.com', '+91 9988776660', '90 Hazratganj, Lucknow', 'APPROVED');

-- 4. SEED MEDICINES
INSERT INTO `medicines` (`medicine_id`, `manufacturer_id`, `medicine_name`, `generic_name`, `brand_name`, `dosage_form`, `strength`, `description`, `prescription_required`, `storage_temperature_min`, `storage_temperature_max`, `unit_price`, `status`) VALUES
('MED_001', 'MFR_001', 'Paracetamol 650', 'Paracetamol', 'Dolo 650', 'Tablet', '650 mg', 'Analgesic and antipyretic medication used to treat fever and mild-to-moderate pain.', FALSE, 15.00, 25.00, 12.50, 'ACTIVE'),
('MED_002', 'MFR_001', 'Amoxicillin 500', 'Amoxicillin', 'Mox 500', 'Capsule', '500 mg', 'Penicillin-type antibiotic used to treat bacterial infections.', TRUE, 15.00, 25.00, 45.00, 'ACTIVE'),
('MED_003', 'MFR_002', 'Cetirizine 10', 'Cetirizine Hydrochloride', 'Cetzine 10', 'Tablet', '10 mg', 'Antihistamine medication used to treat allergic rhinitis and hives.', FALSE, 15.00, 30.00, 18.00, 'ACTIVE'),
('MED_004', 'MFR_002', 'Ibuprofen 400', 'Ibuprofen', 'Brufen 400', 'Tablet', '400 mg', 'Nonsteroidal anti-inflammatory drug (NSAID) for pain, fever, and inflammation.', FALSE, 15.00, 25.00, 22.00, 'ACTIVE'),
('MED_005', 'MFR_003', 'Azithromycin 500', 'Azithromycin', 'Azee 500', 'Tablet', '500 mg', 'Macrolide antibiotic used for respiratory and soft tissue infections.', TRUE, 15.00, 25.00, 115.00, 'ACTIVE'),
('MED_006', 'MFR_003', 'Metformin 500', 'Metformin Hydrochloride', 'Glycomet 500', 'Tablet', '500 mg', 'First-line medication for the treatment of type 2 diabetes.', TRUE, 15.00, 25.00, 28.00, 'ACTIVE'),
('MED_007', 'MFR_001', 'Omeprazole 20', 'Omeprazole', 'Omez 20', 'Capsule', '20 mg', 'Proton pump inhibitor reducing stomach acid production.', FALSE, 15.00, 25.00, 52.00, 'ACTIVE'),
('MED_008', 'MFR_002', 'Amlodipine 5', 'Amlodipine Besylate', 'Stamlo 5', 'Tablet', '5 mg', 'Calcium channel blocker used to treat high blood pressure and angina.', TRUE, 15.00, 30.00, 34.00, 'ACTIVE'),
('MED_009', 'MFR_003', 'Atorvastatin 10', 'Atorvastatin Calcium', 'Atorva 10', 'Tablet', '10 mg', 'Statin medication used to lower cholesterol and prevent cardiovascular disease.', TRUE, 15.00, 25.00, 85.00, 'ACTIVE'),
('MED_010', 'MFR_001', 'Insunorm Cold-Chain', 'Human Insulin NPH', 'Insunorm 100IU', 'Injection', '100 IU/ml', 'Biologics insulin requiring cold-chain temperature monitoring (2°C to 8°C).', TRUE, 2.00, 8.00, 320.00, 'ACTIVE');

-- 5. SEED MEDICINE COMPOSITIONS
INSERT INTO `medicine_compositions` (`medicine_id`, `ingredient_name`, `strength`, `unit`) VALUES
('MED_001', 'Paracetamol', '650', 'mg'),
('MED_002', 'Amoxicillin Trihydrate', '500', 'mg'),
('MED_003', 'Cetirizine Hydrochloride', '10', 'mg'),
('MED_004', 'Ibuprofen', '400', 'mg'),
('MED_005', 'Azithromycin Dihydrate', '500', 'mg'),
('MED_006', 'Metformin Hydrochloride', '500', 'mg'),
('MED_007', 'Omeprazole', '20', 'mg'),
('MED_008', 'Amlodipine Besylate', '5', 'mg'),
('MED_009', 'Atorvastatin Calcium', '10', 'mg'),
('MED_010', 'Isophane Insulin (Human)', '100', 'IU/ml');

-- 6. SEED BATCHES
-- Manufacturing / Expiry dates setup to cover: Active, Expired, Near-Expiry, Recalled
INSERT INTO `batches` (`batch_id`, `medicine_id`, `manufacturer_id`, `batch_number`, `manufacturing_date`, `expiry_date`, `quantity_produced`, `remaining_quantity`, `unit_cost`, `batch_status`) VALUES
-- Active normal batches
('BAT_001', 'MED_001', 'MFR_001', 'DOL-2024-001', '2025-01-10', '2027-01-10', 10000, 8500, 6.00, 'ACTIVE'),
('BAT_002', 'MED_002', 'MFR_001', 'MOX-2024-002', '2025-02-01', '2026-08-01', 5000, 4200, 20.00, 'ACTIVE'),
('BAT_003', 'MED_003', 'MFR_002', 'CET-2024-003', '2025-01-15', '2026-11-15', 8000, 6800, 8.00, 'ACTIVE'),

-- Near-Expiry batch (expiring within 30 days of 2026-10-07)
('BAT_004', 'MED_004', 'MFR_002', 'BRU-2024-EXP30', '2024-11-01', '2026-10-28', 4000, 1200, 10.00, 'ACTIVE'),

-- Expired batch (expiry date passed)
('BAT_005', 'MED_005', 'MFR_003', 'AZE-2023-EXPIRED', '2023-01-01', '2025-06-01', 3000, 450, 50.00, 'EXPIRED'),

-- Recalled batch
('BAT_006', 'MED_007', 'MFR_001', 'OMZ-2024-RECALL', '2024-08-01', '2026-08-01', 6000, 2500, 22.00, 'RECALLED'),

-- Cold chain batch
('BAT_007', 'MED_010', 'MFR_001', 'INS-2025-COLD', '2025-03-01', '2026-12-31', 2000, 1500, 150.00, 'ACTIVE');

-- 7. SEED INVENTORY
INSERT INTO `inventory` (`inventory_id`, `owner_type`, `owner_id`, `batch_id`, `medicine_id`, `quantity`, `reorder_level`) VALUES
-- Manufacturer Inventory
('INV_MFR_001', 'MANUFACTURER', 'MFR_001', 'BAT_001', 'MED_001', 5000, 1000),
('INV_MFR_002', 'MANUFACTURER', 'MFR_001', 'BAT_002', 'MED_002', 2000, 500),
('INV_MFR_003', 'MANUFACTURER', 'MFR_002', 'BAT_003', 'MED_003', 4000, 1000),
('INV_MFR_004', 'MANUFACTURER', 'MFR_001', 'BAT_007', 'MED_010', 800, 200),

-- Distributor Inventory
('INV_DST_001', 'DISTRIBUTOR', 'DST_001', 'BAT_001', 'MED_001', 2500, 300),
('INV_DST_002', 'DISTRIBUTOR', 'DST_001', 'BAT_002', 'MED_002', 1500, 200),
('INV_DST_003', 'DISTRIBUTOR', 'DST_002', 'BAT_003', 'MED_003', 2000, 400),
('INV_DST_004', 'DISTRIBUTOR', 'DST_001', 'BAT_004', 'MED_004', 800, 100),
('INV_DST_005', 'DISTRIBUTOR', 'DST_001', 'BAT_006', 'MED_007', 1500, 200),
('INV_DST_006', 'DISTRIBUTOR', 'DST_004', 'BAT_007', 'MED_010', 500, 100),

-- Pharmacy Inventory
('INV_PHM_001', 'PHARMACY', 'PHM_001', 'BAT_001', 'MED_001', 1000, 100),
('INV_PHM_002', 'PHARMACY', 'PHM_001', 'BAT_002', 'MED_002', 700, 50),
('INV_PHM_003', 'PHARMACY', 'PHM_001', 'BAT_003', 'MED_003', 800, 100),
('INV_PHM_004', 'PHARMACY', 'PHM_001', 'BAT_004', 'MED_004', 400, 50),
('INV_PHM_005', 'PHARMACY', 'PHM_001', 'BAT_005', 'MED_005', 450, 50), -- Expired stock for rejection demo
('INV_PHM_006', 'PHARMACY', 'PHM_001', 'BAT_006', 'MED_007', 1000, 100), -- Recalled stock for rejection demo
('INV_PHM_007', 'PHARMACY', 'PHM_001', 'BAT_007', 'MED_010', 200, 30);

-- 8. SEED ORDERS
INSERT INTO `orders` (`order_id`, `pharmacy_id`, `distributor_id`, `status`, `total_amount`) VALUES
('ORD_001', 'PHM_001', 'DST_001', 'DELIVERED', 27250.00),
('ORD_002', 'PHM_001', 'DST_001', 'PROCESSING', 18000.00),
('ORD_003', 'PHM_002', 'DST_002', 'PENDING', 14400.00);

-- Order Items
INSERT INTO `order_items` (`order_item_id`, `order_id`, `medicine_id`, `batch_id`, `quantity`, `unit_price`, `subtotal`) VALUES
('ORD_ITM_001', 'ORD_001', 'MED_001', 'BAT_001', 500, 12.50, 6250.00),
('ORD_ITM_002', 'ORD_001', 'MED_002', 'BAT_002', 300, 45.00, 13500.00),
('ORD_ITM_003', 'ORD_001', 'MED_004', 'BAT_004', 350, 22.00, 7700.00),
('ORD_ITM_004', 'ORD_002', 'MED_003', 'BAT_003', 1000, 18.00, 18000.00),
('ORD_ITM_005', 'ORD_003', 'MED_003', 'BAT_003', 800, 18.00, 14400.00);

-- 9. SEED SHIPMENTS
INSERT INTO `shipments` (`shipment_id`, `sender_type`, `sender_id`, `receiver_type`, `receiver_id`, `order_id`, `tracking_number`, `cold_chain_required`, `status`) VALUES
('SHP_001', 'MANUFACTURER', 'MFR_001', 'DISTRIBUTOR', 'DST_001', NULL, 'TRK-MFR-00192', FALSE, 'DELIVERED'),
('SHP_002', 'DISTRIBUTOR', 'DST_001', 'PHARMACY', 'PHM_001', 'ORD_001', 'TRK-DST-00812', FALSE, 'DELIVERED'),
('SHP_003', 'MANUFACTURER', 'MFR_001', 'DISTRIBUTOR', 'DST_004', NULL, 'TRK-COLD-9901', TRUE, 'IN_TRANSIT');

-- Shipment Items
INSERT INTO `shipment_items` (`shipment_item_id`, `shipment_id`, `batch_id`, `quantity`) VALUES
('SHP_ITM_001', 'SHP_001', 'BAT_001', 2500),
('SHP_ITM_002', 'SHP_001', 'BAT_002', 1500),
('SHP_ITM_003', 'SHP_002', 'BAT_001', 500),
('SHP_ITM_004', 'SHP_002', 'BAT_002', 300),
('SHP_ITM_005', 'SHP_003', 'BAT_007', 500);

-- 10. SEED TEMPERATURE READINGS
INSERT INTO `temperature_readings` (`shipment_id`, `recorded_temperature`, `acceptable_min`, `acceptable_max`, `alert_status`) VALUES
('SHP_003', 4.50, 2.00, 8.00, 'NORMAL'),
('SHP_003', 5.10, 2.00, 8.00, 'NORMAL'),
('SHP_003', 10.40, 2.00, 8.00, 'VIOLATION'); -- Temperature violation alert trigger

-- 11. SEED DRUG INTERACTIONS
INSERT INTO `drug_interactions` (`medicine_id_1`, `medicine_id_2`, `severity`, `description`, `recommendation`) VALUES
('MED_002', 'MED_004', 'MODERATE', 'Concurrent use of Amoxicillin and NSAID Ibuprofen may slightly alter renal clearance.', 'Monitor renal parameters if high doses are co-prescribed.'),
('MED_006', 'MED_009', 'LOW', 'Metformin and Atorvastatin co-administration has minor metabolic interaction.', 'Routine clinical monitoring recommended.'),
('MED_007', 'MED_008', 'HIGH', 'Proton Pump Inhibitor Omeprazole reduces bioavailability and hepatic metabolism of Amlodipine.', 'Consider alternative acid reducer or adjust dosage timing.'),
('MED_002', 'MED_005', 'CONTRAINDICATED', 'Bactericidal antibiotic (Amoxicillin) antagonized by bacteriostatic agent (Azithromycin).', 'DO NOT PRESCRIBE TOGETHER. Choose single definitive antibiotic therapy.');

-- 12. SEED RECALLS
INSERT INTO `recalls` (`recall_id`, `batch_id`, `initiated_by`, `reason`, `severity`, `status`) VALUES
('RCL_001', 'BAT_006', 'MAN001', 'Discoloration and sub-potent active pharmaceutical ingredient (API) detected during stability trial.', 'CLASS_I', 'INITIATED');

-- 13. SEED PRESCRIPTIONS & DISPENSATIONS
INSERT INTO `prescriptions` (`prescription_id`, `pharmacy_id`, `prescription_number`, `patient_name`, `doctor_name`, `prescription_date`, `status`) VALUES
('RX_001', 'PHM_001', 'RX-2026-9001', 'Sunil Kumar', 'Dr. V. K. Sharma', '2026-10-01', 'DISPENSED'),
('RX_002', 'PHM_001', 'RX-2026-9002', 'Meera Deshmukh', 'Dr. Anita Roy', '2026-10-05', 'VERIFIED');

INSERT INTO `prescription_items` (`prescription_item_id`, `prescription_id`, `medicine_id`, `prescribed_quantity`, `dosage_instructions`) VALUES
('RX_ITM_001', 'RX_001', 'MED_001', 30, '1 tablet 3 times a day after meals for 10 days'),
('RX_ITM_002', 'RX_001', 'MED_002', 15, '1 capsule twice daily for 7 days'),
('RX_ITM_003', 'RX_002', 'MED_003', 10, '1 tablet at bedtime for 10 days');

-- Dispensations
INSERT INTO `dispensations` (`dispensing_id`, `prescription_id`, `pharmacist_user_id`, `pharmacy_id`, `patient_name`, `total_amount`, `status`) VALUES
('DSP_001', 'RX_001', 'PHARM001', 'PHM_001', 'Sunil Kumar', 1050.00, 'COMPLETED');

INSERT INTO `dispensing_items` (`dispensing_item_id`, `dispensing_id`, `batch_id`, `medicine_id`, `quantity`, `unit_price`, `subtotal`) VALUES
('DSP_ITM_001', 'DSP_001', 'BAT_001', 'MED_001', 30, 12.50, 375.00),
('DSP_ITM_002', 'DSP_001', 'BAT_002', 'MED_002', 15, 45.00, 675.00);

-- 14. SEED ALERTS & AUDIT LOGS
INSERT INTO `alerts` (`alert_id`, `alert_type`, `severity`, `message`, `related_entity_type`, `related_entity_id`, `status`) VALUES
('ALT_001', 'RECALL', 'CRITICAL', 'RECALL INITIATED for Batch OMZ-2024-RECALL. Immediately quarantine and block dispensing!', 'BATCH', 'BAT_006', 'UNREAD'),
('ALT_002', 'EXPIRY', 'CRITICAL', 'Batch AZE-2023-EXPIRED has EXPIRED. Dispensing strictly prohibited.', 'BATCH', 'BAT_005', 'UNREAD'),
('ALT_003', 'TEMPERATURE', 'WARNING', 'Cold-chain violation detected on shipment TRK-COLD-9901 (10.40°C exceeds 8.00°C max limit).', 'SHIPMENT', 'SHP_003', 'UNREAD'),
('ALT_004', 'NEAR_EXPIRY', 'WARNING', 'Batch BRU-2024-EXP30 is near expiry (2026-10-28).', 'BATCH', 'BAT_004', 'UNREAD');

INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`, `description`) VALUES
('ADMIN001', 'USER_APPROVED', 'USER', 'MAN001', 'Approved Manufacturer account Apollo Pharma Manufacturing'),
('MAN001', 'BATCH_CREATED', 'BATCH', 'BAT_001', 'Created manufacturing production batch DOL-2024-001'),
('MAN001', 'RECALL_INITIATED', 'RECALL', 'RCL_001', 'Initiated Class-I recall for defective batch OMZ-2024-RECALL'),
('PHARM001', 'DISPENSATION_COMPLETED', 'DISPENSATION', 'DSP_001', 'Successfully dispensed prescription RX-2026-9001 to patient Sunil Kumar inside database transaction');
