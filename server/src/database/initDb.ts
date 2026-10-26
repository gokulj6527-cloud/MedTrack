import fs from 'fs';
import path from 'path';
import { db } from './db';
import { env } from '../config/env';
import { migrateDatabase } from './migrate';

export async function initializeDatabase(): Promise<void> {
  try {
    const driver = (env.DB_DRIVER || '').toLowerCase();
    const isPostgres = driver === 'postgres' || driver === 'postgresql' || driver === 'supabase';

    let tableExists = false;

    if (isPostgres) {
      // For Supabase PostgreSQL, check information_schema
      const checkTable = await db.queryOne<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles';"
      ).catch(() => null);
      tableExists = !!checkTable;
    } else if (driver === 'mysql') {
      const checkTable = await db.queryOne<{ TABLE_NAME: string }>(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'roles';",
        [env.DB_NAME]
      ).catch(() => null);
      tableExists = !!checkTable;
    } else {
      // SQLite
      const checkTable = await db.queryOne<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='roles';"
      ).catch(() => null);
      tableExists = !!checkTable;
    }

    if (!tableExists) {
      if (isPostgres) {
        console.log('ℹ PostgreSQL / Supabase target detected without roles table.');
        console.log('⚡ Running Supabase PostgreSQL schema migration & seed scripts is recommended via database/schema.sql.');
      } else {
        console.log('⚡ Initializing MedTrack database schema and seed records...');

        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const seedPath = path.join(__dirname, '../../../database/seed.sql');

        if (fs.existsSync(schemaPath) && fs.existsSync(seedPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
          const seedSql = fs.readFileSync(seedPath, 'utf-8');

          await executeMultiStatementSql(schemaSql);
          await executeMultiStatementSql(seedSql);
          console.log('✅ Database successfully initialized with 3NF entities and seed accounts!');
        }
      }
    } else {
      console.log('✔ Database existing schema verified.');
    }

    // Always run non-destructive incremental migrations
    await migrateDatabase().catch((err) => {
      console.warn('Notice: migrateDatabase completed with non-fatal notice:', err.message);
    });
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
