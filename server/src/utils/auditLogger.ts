import { db, DatabaseAdapter } from '../database/db';

export async function logAuditAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  customDb?: DatabaseAdapter
): Promise<void> {
  const activeDb = customDb || db;
  try {
    await activeDb.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, description]
    );
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
}
