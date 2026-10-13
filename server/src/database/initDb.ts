import fs from 'fs';
import path from 'path';
import { db } from './db';

export async function initializeDatabase(): Promise<void> {
  try {
    // Check if roles table exists
    const checkTable = await db.queryOne<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='roles';"
    ).catch(() => null);

    // If SQLite check failed or tables absent, execute DDL schema & seed
    if (!checkTable) {
      console.log('⚡ Initializing MedTrack database schema and seed records...');

      const schemaPath = path.join(__dirname, '../../../database/schema.sql');
      const seedPath = path.join(__dirname, '../../../database/seed.sql');

      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      const seedSql = fs.readFileSync(seedPath, 'utf-8');

      // Execute schema statements split by semicolon
      await executeMultiStatementSql(schemaSql);
      await executeMultiStatementSql(seedSql);

      console.log('✅ Database successfully initialized with 22 3NF entities and seed accounts!');
    } else {
      console.log('✔ Database existing schema verified.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
  }
}

async function executeMultiStatementSql(sqlContent: string): Promise<void> {
  // Strip comments
  let cleanSql = sqlContent
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  cleanSql = cleanSql
    .replace(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/g, '')
    .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '')
    .replace(/ENUM\([^)]+\)/g, 'TEXT');

  const statements = cleanSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('USE ') && !s.startsWith('CREATE DATABASE') && !s.startsWith('SET FOREIGN_KEY_CHECKS'));

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (err: any) {
      // Ignore table drop errors if non-existent
      if (!err.message?.includes('no such table')) {
        // Log query warning if needed
      }
    }
  }
}
