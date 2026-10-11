import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';
import { uid } from '../utils/ids';
import { MEDICINE_MASTER_SQL, PRODUCTION_BATCH_SQL } from '../utils/stockRules';
import bcrypt from 'bcryptjs';

const router = Router();

// Apply Auth + Admin Role check to all admin routes
router.use(requireAuth, requireRole(['ADMIN']));

// GET /api/admin/users - List all users with filtering
router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let sql = `
      SELECT u.user_id, u.username, u.email, u.status, u.rejection_reason, u.created_at, r.role_name,
             COALESCE(m.company_name, d.company_name, p.pharmacy_name, pt.full_name, 'System') AS organization_name,
             COALESCE(m.manufacturer_id, d.distributor_id, p.pharmacy_id, pt.patient_id) AS organization_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN manufacturers m ON u.user_id = m.user_id
      LEFT JOIN distributors d ON u.user_id = d.user_id
      LEFT JOIN pharmacies p ON u.user_id = p.user_id
      LEFT JOIN patients pt ON u.user_id = pt.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      sql += ` AND r.role_name = ?`;
      params.push(role);
    }
    if (status) {
      sql += ` AND u.status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (u.user_id LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR m.company_name LIKE ? OR d.company_name LIKE ? OR p.pharmacy_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s, s);
    }

    sql += ` ORDER BY u.created_at DESC`;
    const users = await db.query(sql, params);
    return res.json({ success: true, count: users.length, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/admin/users/:userId/status - Approve, Reject, Ban, Unban user
router.patch('/users/:userId/status', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body; // 'APPROVED', 'REJECTED', 'BANNED'

    if (!['APPROVED', 'REJECTED', 'BANNED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified.' });
    }

    const targetUser = await db.queryOne('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    await db.execute(
      `UPDATE users SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [status, reason || null, userId]
    );

    // Update organization status if applicable
    await db.execute(`UPDATE manufacturers SET approval_status = ? WHERE user_id = ?`, [status, userId]);
    await db.execute(`UPDATE distributors SET approval_status = ? WHERE user_id = ?`, [status, userId]);
    await db.execute(`UPDATE pharmacies SET approval_status = ? WHERE user_id = ?`, [status, userId]);

    // Audit log action
    const actionName = status === 'APPROVED' ? 'ADMIN_APPROVED_USER' :
                       status === 'BANNED' ? 'ADMIN_BANNED_USER' :
                       status === 'REJECTED' ? 'ADMIN_REJECTED_USER' : 'ADMIN_UPDATED_USER';

    await logAuditAction(
      req.user!.user_id,
      actionName,
      'USER',
      userId,
      `Admin changed user ${userId} status to ${status}. ${reason ? 'Reason: ' + reason : ''}`
    );

    return res.json({ success: true, message: `User ${userId} status updated to ${status}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users/:userId/profile - Detailed profile breakdown
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await db.queryOne<any>(
      `SELECT u.user_id, u.username, u.email, u.status, u.created_at, r.role_name 
       FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [userId]
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let profile: any = { ...user };

    if (user.role_name === 'MANUFACTURER') {
      profile.details = await db.queryOne('SELECT * FROM manufacturers WHERE user_id = ?', [userId]);
      if (profile.details) {
        const mfrId = profile.details.manufacturer_id;
        profile.medicinesCount = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM medicines WHERE manufacturer_id = ?', [mfrId]))?.cnt || 0;
        profile.batchesCount = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM batches WHERE manufacturer_id = ?', [mfrId]))?.cnt || 0;
        profile.totalProduction = (await db.queryOne<any>('SELECT SUM(quantity_produced) as sum FROM batches WHERE manufacturer_id = ?', [mfrId]))?.sum || 0;
      }
    } else if (user.role_name === 'DISTRIBUTOR') {
      profile.details = await db.queryOne('SELECT * FROM distributors WHERE user_id = ?', [userId]);
      if (profile.details) {
        const distId = profile.details.distributor_id;
        profile.inventoryCount = (await db.queryOne<any>('SELECT SUM(quantity) as sum FROM inventory WHERE owner_type = "DISTRIBUTOR" AND owner_id = ?', [distId]))?.sum || 0;
        profile.ordersCount = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM orders WHERE distributor_id = ?', [distId]))?.cnt || 0;
      }
    } else if (user.role_name === 'PHARMACIST') {
      profile.details = await db.queryOne('SELECT * FROM pharmacies WHERE user_id = ?', [userId]);
      if (profile.details) {
        const pharmId = profile.details.pharmacy_id;
        profile.inventoryCount = (await db.queryOne<any>('SELECT SUM(quantity) as sum FROM inventory WHERE owner_type = "PHARMACY" AND owner_id = ?', [pharmId]))?.sum || 0;
        profile.salesCount = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM dispensations WHERE pharmacy_id = ?', [pharmId]))?.cnt || 0;
        profile.salesRevenue = (await db.queryOne<any>('SELECT SUM(total_amount) as sum FROM dispensations WHERE pharmacy_id = ?', [pharmId]))?.sum || 0;
      }
    }

    return res.json({ success: true, profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/metrics - Real database aggregated metrics
router.get('/metrics', async (req, res) => {
  try {
    const totalUsers = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM users'))?.cnt || 0;
    const totalManufacturers = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM manufacturers'))?.cnt || 0;
    const totalDistributors = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM distributors'))?.cnt || 0;
    const totalPharmacists = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM pharmacies'))?.cnt || 0;
    const pendingUsers = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM users WHERE status = "PENDING"'))?.cnt || 0;
    const activeUsers = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM users WHERE status = "APPROVED"'))?.cnt || 0;
    const bannedUsers = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM users WHERE status = "BANNED"'))?.cnt || 0;

    const totalMedicines = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM medicines'))?.cnt || 0;
    const totalBatches = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM batches'))?.cnt || 0;
    const totalInventoryUnits = (await db.queryOne<any>('SELECT SUM(quantity) as sum FROM inventory'))?.sum || 0;
    const totalSalesValue = (await db.queryOne<any>('SELECT SUM(total_amount) as sum FROM dispensations WHERE status = "COMPLETED"'))?.sum || 0;
    const activeRecalls = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM recalls WHERE status IN ("INITIATED", "IN_PROGRESS")'))?.cnt || 0;
    const expiredBatches = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM batches WHERE batch_status = "EXPIRED" OR expiry_date < CURRENT_DATE'))?.cnt || 0;
    const temperatureAlerts = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM temperature_readings WHERE alert_status = "VIOLATION"'))?.cnt || 0;
    const totalPatients = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'USER'`))?.cnt || 0;
    const nearExpiry = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM batches WHERE expiry_date >= CURRENT_DATE AND expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY) AND batch_status = 'ACTIVE'`))?.cnt || 0;
    const recalledBatches = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM batches WHERE batch_status = 'RECALLED'`))?.cnt || 0;
    const lowStock = (await db.queryOne<any>(`SELECT COUNT(*) as cnt FROM inventory WHERE quantity <= reorder_level`))?.cnt || 0;
    const mfrStock = (await db.queryOne<any>(`SELECT COALESCE(SUM(quantity),0) as sum FROM inventory WHERE owner_type='MANUFACTURER'`))?.sum || 0;
    const distStock = (await db.queryOne<any>(`SELECT COALESCE(SUM(quantity),0) as sum FROM inventory WHERE owner_type='DISTRIBUTOR'`))?.sum || 0;
    const pharmStock = (await db.queryOne<any>(`SELECT COALESCE(SUM(quantity),0) as sum FROM inventory WHERE owner_type='PHARMACY'`))?.sum || 0;

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        totalManufacturers,
        totalDistributors,
        totalPharmacists,
        totalPatients,
        pendingUsers,
        activeUsers,
        bannedUsers,
        totalMedicines,
        totalBatches,
        totalInventoryUnits,
        totalStockAcrossChain: Number(mfrStock) + Number(distStock) + Number(pharmStock),
        manufacturerStock: mfrStock,
        distributorStock: distStock,
        pharmacyStock: pharmStock,
        totalSalesValue,
        activeRecalls,
        expiredBatches,
        expiredMedicines: expiredBatches,
        nearExpiryMedicines: nearExpiry,
        recalledBatches,
        lowStockAlerts: lowStock,
        temperatureAlerts,
        temperatureViolations: temperatureAlerts
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/audit-logs - System activity audit trail
router.get('/audit-logs', async (req, res) => {
  try {
    const { search, action } = req.query;
    let sql = `SELECT a.*, u.username, r.role_name 
       FROM audit_logs a 
       JOIN users u ON a.user_id = u.user_id 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE 1=1`;
    const params: any[] = [];
    if (search) {
      sql += ` AND (a.description LIKE ? OR a.entity_id LIKE ? OR u.username LIKE ? OR a.action LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }
    sql += ` ORDER BY a.timestamp DESC LIMIT 300`;
    const logs = await db.query(sql, params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/drug-interactions - Matrix of drug interactions
router.get('/drug-interactions', async (req, res) => {
  try {
    const interactions = await db.query(
      `SELECT i.*, m1.medicine_name as med1_name, m1.brand_name as med1_brand,
              m2.medicine_name as med2_name, m2.brand_name as med2_brand
       FROM drug_interactions i
       JOIN medicines m1 ON i.medicine_id_1 = m1.medicine_id
       JOIN medicines m2 ON i.medicine_id_2 = m2.medicine_id
       ORDER BY i.severity DESC`
    );
    return res.json({ success: true, interactions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/drug-interactions - Add new drug interaction
router.post('/drug-interactions', async (req: AuthRequest, res) => {
  try {
    const { medicine_id_1, medicine_id_2, severity, description, recommendation } = req.body;
    if (!medicine_id_1 || !medicine_id_2 || !severity || !description) {
      return res.status(400).json({ success: false, message: 'All interaction parameters are required.' });
    }
    if (medicine_id_1 === medicine_id_2) {
      return res.status(400).json({ success: false, message: 'Cannot set drug interaction for the same medicine.' });
    }

    const result = await db.execute(
      `INSERT INTO drug_interactions (medicine_id_1, medicine_id_2, severity, description, recommendation) VALUES (?, ?, ?, ?, ?)`,
      [medicine_id_1, medicine_id_2, severity, description, recommendation || 'Use with caution.']
    );

    await logAuditAction(req.user!.user_id, 'DRUG_INTERACTION_CREATED', 'DRUG_INTERACTION', String(result.insertId), `Added ${severity} interaction between ${medicine_id_1} and ${medicine_id_2}`);

    return res.json({ success: true, message: 'Drug interaction recorded successfully.', insertId: result.insertId });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/medicines', async (_req, res) => {
  try {
    const medicines = await db.query(`${MEDICINE_MASTER_SQL} ORDER BY m.medicine_name`);
    return res.json({ success: true, medicines });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/medicines/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'DISCONTINUED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or DISCONTINUED.' });
    }
    await db.execute(`UPDATE medicines SET status = ? WHERE medicine_id = ?`, [status, req.params.id]);
    await logAuditAction(req.user!.user_id, 'MEDICINE_STATUS', 'MEDICINE', req.params.id, `Set catalog status ${status}`);
    return res.json({ success: true, message: `Medicine ${status === 'DISCONTINUED' ? 'deactivated' : 'activated'}. Historical batches were kept.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batches', async (_req, res) => {
  try {
    const batches = await db.query(`${PRODUCTION_BATCH_SQL} ORDER BY b.expiry_date ASC`);
    return res.json({ success: true, batches });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/recalls', async (_req, res) => {
  try {
    const recalls = await db.query(
      `SELECT r.*, b.batch_number, med.medicine_name, m.company_name as manufacturer_name, u.username as initiated_by_user
       FROM recalls r
       JOIN batches b ON r.batch_id = b.batch_id
       JOIN medicines med ON b.medicine_id = med.medicine_id
       JOIN manufacturers m ON b.manufacturer_id = m.manufacturer_id
       JOIN users u ON r.initiated_by = u.user_id
       ORDER BY r.recall_date DESC`
    );
    return res.json({ success: true, recalls });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/recalls', async (req: AuthRequest, res) => {
  try {
    const { batch_id, reason, severity } = req.body;
    if (!batch_id || !reason) return res.status(400).json({ success: false, message: 'Batch and reason required.' });
    const recall_id = uid('RCL');
    await db.transaction(async (tx) => {
      await tx.execute(`UPDATE batches SET batch_status = 'RECALLED', defect_notes = ? WHERE batch_id = ?`, [reason, batch_id]);
      await tx.execute(
        `INSERT INTO recalls (recall_id, batch_id, initiated_by, reason, severity, status) VALUES (?, ?, ?, ?, ?, 'INITIATED')`,
        [recall_id, batch_id, req.user!.user_id, reason, severity || 'CLASS_I']
      );
      await tx.execute(
        `INSERT INTO alerts (alert_id, alert_type, severity, message, related_entity_type, related_entity_id, status)
         VALUES (?, 'RECALL', 'CRITICAL', ?, 'BATCH', ?, 'UNREAD')`,
        [uid('ALT'), `ADMIN RECALL: ${reason}`, batch_id]
      );
      await logAuditAction(req.user!.user_id, 'RECALL_INITIATED', 'RECALL', recall_id, reason, tx);
    });
    return res.json({ success: true, recall_id, message: 'Recall created. Historical inventory was quarantined via status, not deleted.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/recalls/:id', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    if (!['INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid recall status.' });
    }
    await db.execute(`UPDATE recalls SET status = ? WHERE recall_id = ?`, [status, req.params.id]);
    await logAuditAction(req.user!.user_id, 'RECALL_UPDATED', 'RECALL', req.params.id, `Recall status ${status}`);
    return res.json({ success: true, message: 'Recall status updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stock-movement', async (_req, res) => {
  try {
    const movement = await db.query(
      `SELECT s.shipment_id, s.sender_type, s.sender_id, s.receiver_type, s.receiver_id, s.status, s.shipment_date, s.received_date, s.tracking_number,
              si.batch_id, si.quantity, b.batch_number, m.medicine_name
       FROM shipments s
       JOIN shipment_items si ON s.shipment_id = si.shipment_id
       JOIN batches b ON si.batch_id = b.batch_id
       JOIN medicines m ON b.medicine_id = m.medicine_id
       ORDER BY s.created_at DESC LIMIT 400`
    );
    return res.json({ success: true, movement });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/settings', async (_req, res) => {
  try {
    const settings = await db.query('SELECT * FROM system_settings ORDER BY setting_key');
    return res.json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/settings', async (req: AuthRequest, res) => {
  try {
    const { setting_key, setting_value } = req.body;
    if (!setting_key) return res.status(400).json({ success: false, message: 'setting_key is required.' });
    await db.execute(
      `UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?`,
      [String(setting_value), req.user!.user_id, setting_key]
    );
    await logAuditAction(req.user!.user_id, 'SETTINGS_UPDATED', 'SETTING', setting_key, `Set ${setting_key}=${setting_value}`);
    return res.json({ success: true, message: 'Setting saved.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { username, email, password, role_name, full_name, organization } = req.body;
    if (!username || !email || !password || !role_name) {
      return res.status(400).json({ success: false, message: 'username, email, password, and role_name are required.' });
    }
    const role = await db.queryOne<any>('SELECT role_id FROM roles WHERE role_name = ?', [role_name]);
    if (!role) return res.status(400).json({ success: false, message: 'Unknown role.' });
    const user_id = uid(role_name.slice(0, 3).toUpperCase());
    const hash = await bcrypt.hash(password, 10);
    await db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO users (user_id, username, email, password_hash, role_id, status, full_name) VALUES (?, ?, ?, ?, ?, 'APPROVED', ?)`,
        [user_id, username, email, hash, role.role_id, full_name || username]
      );
      if (role_name === 'MANUFACTURER' && organization) {
        await tx.execute(
          `INSERT INTO manufacturers (manufacturer_id, user_id, company_name, license_number, email, phone, address, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
          [uid('MFR'), user_id, organization.company_name, organization.license_number, email, organization.phone || '', organization.address || '']
        );
      }
      if (role_name === 'DISTRIBUTOR' && organization) {
        await tx.execute(
          `INSERT INTO distributors (distributor_id, user_id, company_name, license_number, warehouse_address, email, phone, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
          [uid('DST'), user_id, organization.company_name, organization.license_number, organization.warehouse_address || organization.address || '', email, organization.phone || '']
        );
      }
      if (role_name === 'PHARMACIST' && organization) {
        await tx.execute(
          `INSERT INTO pharmacies (pharmacy_id, user_id, pharmacy_name, license_number, pharmacist_in_charge, email, phone, address, approval_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
          [uid('PHM'), user_id, organization.pharmacy_name || organization.company_name, organization.license_number, full_name || username, email, organization.phone || '', organization.address || '']
        );
      }
      if (role_name === 'USER') {
        await tx.execute(`INSERT INTO patients (patient_id, user_id, full_name) VALUES (?, ?, ?)`, [uid('PAT'), user_id, full_name || username]);
      }
      await logAuditAction(req.user!.user_id, 'USER_CREATED', 'USER', user_id, `Created ${role_name} ${username}`, tx);
    });
    return res.json({ success: true, user_id, message: 'User created and approved.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/complaints', async (_req, res) => {
  try {
    const complaints = await db.query(
      `SELECT c.*, u.username, m.medicine_name FROM complaints c
       JOIN users u ON c.user_id = u.user_id
       LEFT JOIN medicines m ON c.medicine_id = m.medicine_id
       ORDER BY c.created_at DESC`
    );
    return res.json({ success: true, complaints });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/complaints/:id', async (req: AuthRequest, res) => {
  try {
    const { status, admin_notes } = req.body;
    await db.execute(`UPDATE complaints SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE complaint_id = ?`, [status || null, admin_notes || null, req.params.id]);
    return res.json({ success: true, message: 'Complaint updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/:type', async (req, res) => {
  try {
    const type = req.params.type;
    let rows: any[] = [];
    if (type === 'medicines') rows = await db.query(MEDICINE_MASTER_SQL);
    else if (type === 'batches') rows = await db.query(PRODUCTION_BATCH_SQL);
    else if (type === 'inventory') rows = await db.query(`SELECT * FROM inventory`);
    else if (type === 'audit') rows = await db.query(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000`);
    else if (type === 'dispensing') rows = await db.query(`SELECT * FROM dispensations`);
    else return res.status(400).json({ success: false, message: 'Unknown export type.' });

    if (!rows.length) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send('no_data\n');
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}.csv`);
    return res.send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
