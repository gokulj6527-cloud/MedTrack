import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import manufacturerRoutes from './routes/manufacturerRoutes';
import distributorRoutes from './routes/distributorRoutes';
import pharmacistRoutes from './routes/pharmacistRoutes';
import reportsRoutes from './routes/reportsRoutes';
import vivaRoutes from './routes/vivaRoutes';

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'MedTrack Pharmaceutical Supply Chain & Pharmacy Management System',
    timestamp: new Date().toISOString()
  });
});

export default app;
