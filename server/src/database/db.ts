import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
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
    // Basic compatibility conversion if MySQL functions like CURRENT_TIMESTAMP ON UPDATE are in schema
    return sql
      .replace(/ENGINE=InnoDB/gi, '')
      .replace(/DEFAULT CHARSET=\w+/gi, '')
      .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
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
export const db: DatabaseAdapter = env.DB_DRIVER === 'mysql'
  ? new MySQLAdapter()
  : new SQLiteAdapter(env.SQLITE_PATH);
