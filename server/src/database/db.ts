import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ insertId?: number | string; affectedRows: number }>;
  transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

class SQLiteAdapter implements DatabaseAdapter {
  private db: sqlite3.Database;

  constructor(filePath: string) {
    this.db = new sqlite3.Database(filePath);
  }

  query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      // Normalize MySQL specific dialect syntax for SQLite compatibility
      const normalizedSql = this.normalizeSql(sql);
      this.db.all(normalizedSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows as T[]);
      });
    });
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  execute(sql: string, params: any[] = []): Promise<{ insertId?: number | string; affectedRows: number }> {
    return new Promise((resolve, reject) => {
      const normalizedSql = this.normalizeSql(sql);
      this.db.run(normalizedSql, params, function (err) {
        if (err) return reject(err);
        resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    });
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    await this.execute('BEGIN TRANSACTION');
    try {
      const result = await callback(this);
      await this.execute('COMMIT');
      return result;
    } catch (error) {
      await this.execute('ROLLBACK');
      throw error;
    }
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private normalizeSql(sql: string): string {
    // Basic compatibility conversion if MySQL functions like CURRENT_TIMESTAMP ON UPDATE or DATE_ADD are in queries
    return sql
      .replace(/ENGINE=InnoDB/gi, '')
      .replace(/DEFAULT CHARSET=\w+/gi, '')
      .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '')
      .replace(/DATE_ADD\(CURRENT_DATE,\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date('now', '+$1 days')")
      .replace(/DATE_ADD\(CURRENT_DATE,\s*INTERVAL\s+(\d+)\s+MONTH\)/gi, "date('now', '+$1 months')");
  }
}

class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor() {
    if (env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    } else {
      this.pool = new Pool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    }
  }

  private convertPlaceholders(sql: string): string {
    let index = 1;
    // Replace ? with $1, $2, ...
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  private normalizeSql(sql: string): string {
    let converted = this.convertPlaceholders(sql);
    // Replace MySQL DATE_ADD(CURRENT_DATE, INTERVAL X DAY) with Postgres (CURRENT_DATE + INTERVAL 'X DAY')
    converted = converted.replace(/DATE_ADD\(CURRENT_DATE,\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "(CURRENT_DATE + INTERVAL '$1 DAY')");
    converted = converted.replace(/DATE_ADD\(CURRENT_DATE,\s*INTERVAL\s+(\d+)\s+MONTH\)/gi, "(CURRENT_DATE + INTERVAL '$1 MONTH')");
    // Replace GROUP_CONCAT with STRING_AGG
    converted = converted.replace(/GROUP_CONCAT\(([^,]+),\s*([^)]+)\)/gi, 'STRING_AGG($1, $2)');
    return converted;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const convertedSql = this.normalizeSql(sql);
    const result = await this.pool.query(convertedSql, params);
    return result.rows as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ insertId?: number | string; affectedRows: number }> {
    const convertedSql = this.normalizeSql(sql);
    const result = await this.pool.query(convertedSql, params);
    return { affectedRows: result.rowCount || 0 };
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    await client.query('BEGIN');

    const connAdapter: DatabaseAdapter = {
      query: async (sql, params = []) => {
        const converted = this.normalizeSql(sql);
        const res = await client.query(converted, params);
        return res.rows as any[];
      },
      queryOne: async (sql, params = []) => {
        const converted = this.normalizeSql(sql);
        const res = await client.query(converted, params);
        return res.rows.length > 0 ? res.rows[0] : null;
      },
      execute: async (sql, params = []) => {
        const converted = this.normalizeSql(sql);
        const res = await client.query(converted, params);
        return { affectedRows: res.rowCount || 0 };
      },
      transaction: async (cb) => cb(connAdapter),
      close: async () => {}
    };

    try {
      const result = await callback(connAdapter);
      await client.query('COMMIT');
      client.release();
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class MySQLAdapter implements DatabaseAdapter {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T[];
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ insertId?: number | string; affectedRows: number }> {
    const [result] = await this.pool.execute(sql, params);
    const res = result as mysql.ResultSetHeader;
    return { insertId: res.insertId, affectedRows: res.affectedRows };
  }

  async transaction<T>(callback: (adapter: DatabaseAdapter) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    
    // Create connection-bound adapter
    const connAdapter: DatabaseAdapter = {
      query: async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows as any[];
      },
      queryOne: async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        const r = rows as any[];
        return r.length > 0 ? r[0] : null;
      },
      execute: async (sql, params = []) => {
        const [result] = await connection.execute(sql, params);
        const res = result as mysql.ResultSetHeader;
        return { insertId: res.insertId, affectedRows: res.affectedRows };
      },
      transaction: async (cb) => cb(connAdapter),
      close: async () => {}
    };

    try {
      const result = await callback(connAdapter);
      await connection.commit();
      connection.release();
      return result;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Instantiate Database Adapter
function createDatabaseAdapter(): DatabaseAdapter {
  const driver = (env.DB_DRIVER || '').toLowerCase();
  if (driver === 'postgres' || driver === 'postgresql' || driver === 'supabase') {
    return new PostgreSQLAdapter();
  }
  if (driver === 'mysql') {
    return new MySQLAdapter();
  }
  return new SQLiteAdapter(env.SQLITE_PATH);
}

export const db: DatabaseAdapter = createDatabaseAdapter();
