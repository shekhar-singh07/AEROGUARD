import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, getDatabaseType } from './db';

import dashboardRoutes from './routes/dashboard';
import stationRoutes from './routes/stations';
import anomalyRoutes from './routes/anomalies';
import sensorHealthRoutes from './routes/sensorHealth';
import maintenanceRoutes from './routes/maintenance';
import simulationRoutes from './routes/simulation';
import reportRoutes from './routes/reports';
import auditLogRoutes from './routes/auditLogs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/network', dashboardRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/sensor-health', sensorHealthRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'AEROGUARD Synoptic Intelligence Server',
    version: '1.0.0',
    database: getDatabaseType(),
    cadence: '15-minute observation stream',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` AEROGUARD Operational Server listening on port ${PORT}`);
      console.log(` Active Database Engine: ${getDatabaseType()}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start AEROGUARD server:', err);
    process.exit(1);
  }
}

startServer();
