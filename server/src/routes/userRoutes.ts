import { Router } from 'express';
import { db } from '../database/db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAuditAction } from '../utils/auditLogger';
import { uid } from '../utils/ids';
import { MEDICINE_MASTER_SQL } from '../utils/stockRules';

const router = Router();

router.use(requireAuth, requireRole(['USER', 'ADMIN']));

router.get('/medicines', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    let sql = `${MEDICINE_MASTER_SQL} WHERE m.status = 'ACTIVE'`;
    const params: any[] = [];
    if (q) {
      sql += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ? OR m.brand_name LIKE ? OR m.composition LIKE ? OR m.category LIKE ?)`;
      const s = `%${q}%`;
      params.push(s, s, s, s, s);
    }
    sql += ' ORDER BY m.medicine_name';
    // composition is an alias — filter on joined fields instead if dialect rejects alias
    let medicines;
    try {
      medicines = await db.query(sql, params);
    } catch {
      medicines = await db.query(`${MEDICINE_MASTER_SQL} WHERE m.status = 'ACTIVE' ORDER BY m.medicine_name`);
      if (q) {
        const n = q.toLowerCase();
        medicines = medicines.filter((m: any) =>
          [m.medicine_name, m.generic_name, m.brand_name, m.composition, m.category].some((v) => String(v || '').toLowerCase().includes(n))
        );
      }
    }
    const publicRows = medicines.map((m: any) => ({
      medicine_id: m.medicine_id,
      medicine_name: m.medicine_name,
      generic_name: m.generic_name,
      brand_name: m.brand_name,
      composition: m.composition,
      category: m.category,
      manufacturer_name: m.manufacturer_name,
      dosage_form: m.dosage_form,
      strength: m.strength,
      description: m.description,
      prescription_required: m.prescription_required,
      storage_temperature_min: m.storage_temperature_min,
      storage_temperature_max: m.storage_temperature_max,
      medicine_status: m.medicine_status
    }));
    return res.json({ success: true, medicines: publicRows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/batches/:batchNumber', async (req, res) => {
  try {
    const batch = await db.queryOne<any>(
      `SELECT b.batch_number, b.manufacturing_date, b.expiry_date, b.batch_status, m.medicine_name, m.generic_name, mfr.company_name as manufacturer_name,
              CASE WHEN EXISTS (SELECT 1 FROM recalls r WHERE r.batch_id = b.batch_id AND r.status != 'CANCELLED') THEN 1 ELSE 0 END AS is_recalled
       FROM batches b
       JOIN medicines m ON b.medicine_id = m.medicine_id
       JOIN manufacturers mfr ON b.manufacturer_id = mfr.manufacturer_id
       WHERE b.batch_number = ?`,
      [req.params.batchNumber]
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    return res.json({
      success: true,
      batch: {
        ...batch,
        safety: batch.batch_status === 'RECALLED' || batch.is_recalled
          ? 'This batch has been recalled. Do not use this medicine and return it to a licensed pharmacy.'
          : batch.expiry_date < new Date().toISOString().slice(0, 10)
            ? 'This batch is expired.'
            : 'No active recall on this batch. Always follow pharmacist guidance.'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/history', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const patient = await db.queryOne<any>('SELECT * FROM patients WHERE user_id = ?', [userId]);
    const history = await db.query(
      `SELECT d.dispensing_id, d.dispensing_date, d.total_amount, d.status, d.patient_name, p.pharmacy_name, pr.prescription_number, pr.doctor_name
       FROM dispensations d
       JOIN pharmacies p ON d.pharmacy_id = p.pharmacy_id
       LEFT JOIN prescriptions pr ON d.prescription_id = pr.prescription_id
       WHERE pr.patient_user_id = ? OR d.patient_name = ?
       ORDER BY d.dispensing_date DESC`,
      [userId, patient?.full_name || req.user!.username]
    );
    for (const row of history) {
      row.items = await db.query(
        `SELECT di.quantity, di.unit_price, m.medicine_name, b.batch_number
         FROM dispensing_items di JOIN medicines m ON di.medicine_id = m.medicine_id
         JOIN batches b ON di.batch_id = b.batch_id WHERE di.dispensing_id = ?`,
        [row.dispensing_id]
      );
    }
    return res.json({ success: true, history });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const user = await db.queryOne<any>(
      `SELECT u.user_id, u.username, u.email, u.full_name, u.status, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.user_id = ?`,
      [req.user!.user_id]
    );
    const patient = await db.queryOne('SELECT * FROM patients WHERE user_id = ?', [req.user!.user_id]);
    return res.json({ success: true, profile: { ...user, patient } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/profile', async (req: AuthRequest, res) => {
  try {
    const { full_name, phone, email } = req.body;
    await db.execute(`UPDATE users SET full_name = COALESCE(?, full_name), email = COALESCE(?, email) WHERE user_id = ?`, [full_name || null, email || null, req.user!.user_id]);
    await db.execute(`UPDATE patients SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE user_id = ?`, [full_name || null, phone || null, req.user!.user_id]);
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/complaints', async (req: AuthRequest, res) => {
  try {
    const { medicine_id, batch_number, complaint_type, description } = req.body;
    if (!description) return res.status(400).json({ success: false, message: 'Description is required.' });
    const complaint_id = uid('CMP');
    await db.execute(
      `INSERT INTO complaints (complaint_id, user_id, medicine_id, batch_number, complaint_type, description, status)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
      [complaint_id, req.user!.user_id, medicine_id || null, batch_number || null, complaint_type || 'QUALITY', description]
    );
    await logAuditAction(req.user!.user_id, 'COMPLAINT_SUBMITTED', 'COMPLAINT', complaint_id, description);
    return res.json({ success: true, complaint_id, message: 'Report submitted to administrators.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/complaints', async (req: AuthRequest, res) => {
  try {
    const rows = await db.query('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC', [req.user!.user_id]);
    return res.json({ success: true, complaints: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
