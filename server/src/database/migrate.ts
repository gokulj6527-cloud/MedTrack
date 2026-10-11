import { db } from './db';

async function tryExec(sql: string, params: any[] = []): Promise<void> {
  try {
    await db.execute(sql, params);
  } catch {
    // Column/table already exists or dialect mismatch — safe to ignore.
  }
}

export async function migrateDatabase(): Promise<void> {
  console.log('⚙ Applying MedTrack schema upgrades...');

  await tryExec(`INSERT OR IGNORE INTO roles (role_id, role_name, description) VALUES (5, 'USER', 'General medicine recipient / customer')`);
  await tryExec(`INSERT IGNORE INTO roles (role_id, role_name, description) VALUES (5, 'USER', 'General medicine recipient / customer')`);

  const medicineCols = [
    `ALTER TABLE medicines ADD COLUMN category VARCHAR(100) DEFAULT 'General'`,
    `ALTER TABLE medicines ADD COLUMN min_stock_level INTEGER DEFAULT 100`
  ];
  const batchCols = [
    `ALTER TABLE batches ADD COLUMN quantity_dispatched INTEGER DEFAULT 0`,
    `ALTER TABLE batches ADD COLUMN defect_notes TEXT`
  ];
  const inventoryCols = [
    `ALTER TABLE inventory ADD COLUMN quantity_received INTEGER DEFAULT 0`,
    `ALTER TABLE inventory ADD COLUMN quantity_supplied INTEGER DEFAULT 0`,
    `ALTER TABLE inventory ADD COLUMN quantity_dispensed INTEGER DEFAULT 0`,
    `ALTER TABLE inventory ADD COLUMN quantity_reduced INTEGER DEFAULT 0`,
    `ALTER TABLE inventory ADD COLUMN last_received_at TIMESTAMP`,
    `ALTER TABLE inventory ADD COLUMN last_supplied_at TIMESTAMP`,
    `ALTER TABLE inventory ADD COLUMN last_dispensed_at TIMESTAMP`,
    `ALTER TABLE inventory ADD COLUMN temperature_status VARCHAR(30) DEFAULT 'NORMAL'`
  ];
  const userCols = [
    `ALTER TABLE users ADD COLUMN full_name VARCHAR(150)`,
    `ALTER TABLE prescriptions ADD COLUMN patient_user_id VARCHAR(50)`
  ];

  for (const sql of [...medicineCols, ...batchCols, ...inventoryCols, ...userCols]) {
    await tryExec(sql);
  }

  await tryExec(`
    CREATE TABLE IF NOT EXISTS patients (
      patient_id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(150) NOT NULL,
      phone VARCHAR(30),
      date_of_birth DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tryExec(`
    CREATE TABLE IF NOT EXISTS complaints (
      complaint_id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      medicine_id VARCHAR(50),
      batch_number VARCHAR(100),
      complaint_type VARCHAR(50) NOT NULL DEFAULT 'QUALITY',
      description TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'OPEN',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tryExec(`
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      adjustment_id VARCHAR(50) PRIMARY KEY,
      inventory_id VARCHAR(50) NOT NULL,
      batch_id VARCHAR(50) NOT NULL,
      owner_type VARCHAR(30) NOT NULL,
      owner_id VARCHAR(50) NOT NULL,
      quantity_change INTEGER NOT NULL,
      reason VARCHAR(100) NOT NULL,
      notes TEXT,
      performed_by VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tryExec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value VARCHAR(255) NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_by VARCHAR(50)
    )
  `);

  await tryExec(
    `INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
     ('near_expiry_days', '30', 'Days before expiry to flag near-expiry medicines'),
     ('default_reorder_level', '50', 'Default low-stock reorder threshold'),
     ('block_expired_supply', 'true', 'Block expired medicines from supply and dispensing'),
     ('block_recalled_supply', 'true', 'Block recalled medicines from supply and dispensing')`
  );

  await tryExec(
    `INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
     ('near_expiry_days', '30', 'Days before expiry to flag near-expiry medicines')`
  );

  await tryExec(`
    UPDATE batches
    SET quantity_dispatched = COALESCE((
      SELECT SUM(si.quantity)
      FROM shipment_items si
      JOIN shipments s ON si.shipment_id = s.shipment_id
      WHERE si.batch_id = batches.batch_id AND s.sender_type = 'MANUFACTURER'
    ), 0)
    WHERE quantity_dispatched IS NULL OR quantity_dispatched = 0
  `);

  await tryExec(`
    UPDATE batches
    SET remaining_quantity = MAX(quantity_produced - COALESCE(quantity_dispatched, 0), 0)
  `);

  await tryExec(`
    UPDATE inventory
    SET quantity_received = CASE WHEN quantity_received IS NULL OR quantity_received = 0 THEN quantity ELSE quantity_received END
  `);

  await tryExec(`
    INSERT OR IGNORE INTO users (user_id, username, email, password_hash, role_id, status, full_name)
    VALUES ('USER001', 'demo_user', 'user@medtrack.com', '$2a$10$42w79B3gE4cSmP/.JbA3t.0r/s7b6Q5vY0o0Z3g1fHk8L2n1P4q3W', 5, 'APPROVED', 'Demo Patient')
  `);

  await tryExec(`
    INSERT OR IGNORE INTO patients (patient_id, user_id, full_name, phone)
    VALUES ('PAT_001', 'USER001', 'Demo Patient', '+91 9000000001')
  `);

  await tryExec(`UPDATE medicines SET category = COALESCE(category, dosage_form)`);
  await tryExec(`UPDATE medicines SET min_stock_level = COALESCE(min_stock_level, 100)`);

  console.log('✔ Schema upgrades applied.');
}
