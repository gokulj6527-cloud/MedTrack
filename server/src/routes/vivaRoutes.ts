import { Router } from 'express';
import { db } from '../database/db';

const router = Router();

// GET /api/viva/schema - Summary of database schema and table row counts
router.get('/schema', async (req, res) => {
  try {
    const tables = [
      'roles', 'users', 'manufacturers', 'distributors', 'pharmacies',
      'medicines', 'medicine_compositions', 'batches', 'inventory',
      'orders', 'order_items', 'shipments', 'shipment_items', 'temperature_readings',
      'prescriptions', 'prescription_items', 'dispensations', 'dispensing_items',
      'drug_interactions', 'recalls', 'alerts', 'audit_logs'
    ];

    const counts: Record<string, number> = {};
    for (const t of tables) {
      const res = await db.queryOne<{ cnt: number }>(`SELECT COUNT(*) as cnt FROM ${t}`).catch(() => ({ cnt: 0 }));
      counts[t] = res?.cnt || 0;
    }

    return res.json({
      success: true,
      total_tables: tables.length,
      normalization: '3NF (Third Normal Form)',
      table_counts: counts
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/viva/execute-sql - Safe raw SQL query evaluator for viva demo
router.post('/execute-sql', async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, message: 'SQL string is required.' });
    }

    const trimmed = sql.trim();
    if (!trimmed.toUpperCase().startsWith('SELECT')) {
      return res.status(403).json({ success: false, message: 'Security restriction: Viva query executor permits SELECT statements only.' });
    }

    const startTime = Date.now();
    const rows = await db.query(trimmed);
    const executionTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      execution_time_ms: executionTimeMs,
      row_count: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      data: rows
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: 'SQL Error: ' + error.message });
  }
});

export default router;
