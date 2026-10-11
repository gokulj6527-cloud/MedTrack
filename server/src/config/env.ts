import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'medtrack_super_secret_jwt_key_2026_dbms_mini_project',
  DB_DRIVER: process.env.DB_DRIVER || 'sqlite', // 'sqlite' or 'mysql'
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'pharma_management',
  SQLITE_PATH: process.env.SQLITE_PATH || path.join(__dirname, '../../medtrack.sqlite')
};
