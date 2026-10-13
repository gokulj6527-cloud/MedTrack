import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';

const router = Router();

// Apply Auth + Admin Role check to all admin routes
router.use(requireAuth, requireRole(['ADMIN']));

// GET /api/admin/users - List all users with filtering
router.get('/users', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let sql = `
      SELECT u.user_id, u.username, u.email, u.status, u.rejection_reason, u.created_at, r.role_name,
             COALESCE(m.company_name, d.company_name, p.pharmacy_name, 'System') AS organization_name,
             COALESCE(m.manufacturer_id, d.distributor_id, p.pharmacy_id) AS organization_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN manufacturers m ON u.user_id = m.user_id
      LEFT JOIN distributors d ON u.user_id = d.user_id
      LEFT JOIN pharmacies p ON u.user_id = p.user_id
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
    const temperatureAlerts = (await db.queryOne<any>('SELECT COUNT(*) as cnt FROM alerts WHERE alert_type = "TEMPERATURE"'))?.cnt || 0;

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        totalManufacturers,
        totalDistributors,
        totalPharmacists,
        pendingUsers,
        activeUsers,
        bannedUsers,
        totalMedicines,
        totalBatches,
        totalInventoryUnits,
        totalSalesValue,
        activeRecalls,
        expiredBatches,
        temperatureAlerts
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/audit-logs - System activity audit trail
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.query(
      `SELECT a.*, u.username, r.role_name 
       FROM audit_logs a 
       JOIN users u ON a.user_id = u.user_id 
       JOIN roles r ON u.role_id = r.role_id 
       ORDER BY a.timestamp DESC LIMIT 100`
    );
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

export default router;
