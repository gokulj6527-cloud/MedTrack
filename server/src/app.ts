import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import manufacturerRoutes from './routes/manufacturerRoutes';
import distributorRoutes from './routes/distributorRoutes';
import pharmacistRoutes from './routes/pharmacistRoutes';
import reportsRoutes from './routes/reportsRoutes';
import vivaRoutes from './routes/vivaRoutes';
import userRoutes from './routes/userRoutes';
import { env } from './config/env';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manufacturer', manufacturerRoutes);
app.use('/api/distributor', distributorRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/viva', vivaRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint with diagnostic information
app.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  let dbDriver = env.DB_DRIVER;
  let userCount = 0;
  let dbError: string | null = null;

  try {
    const { db } = await import('./database/db');
    const result = await db.queryOne<{ cnt: number }>('SELECT COUNT(*) as cnt FROM users').catch((err) => {
      dbError = err.message;
      return null;
    });
    if (result) {
      dbStatus = 'CONNECTED';
      userCount = Number(result.cnt);
    }
  } catch (err: any) {
    dbError = err.message;
  }

  res.json({
    status: 'ONLINE',
    system: 'MedTrack Pharmaceutical Supply Chain & Pharmacy Management System',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      driver: dbDriver,
      users_found: userCount,
      error: dbError
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express Unhandled Exception:', err);
  res.status(500).json({
    success: false,
    message: err?.message || 'Internal Server Error'
  });
});

export default app;
