import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'medtrack_super_secret_jwt_key_2026_dbms_mini_project',
  DB_DRIVER: process.env.DB_DRIVER || (process.env.DATABASE_URL ? 'postgres' : 'sqlite'), // 'sqlite', 'postgres', or 'mysql'
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 5432,
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_SSL: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL,
  SQLITE_PATH: process.env.SQLITE_PATH || path.join(__dirname, '../../medtrack.sqlite'),
  // Optional Supabase credentials
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};
