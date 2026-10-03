import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';

const router = Router();

// GET /api/sensor-health
router.get('/', async (req: Request, res: Response) => {
  try {
    // 1. Health status distribution
    const distribution = await queryOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN health_status = 'HEALTHY' THEN 1 ELSE 0 END) as healthy,
        SUM(CASE WHEN health_status = 'WATCH' THEN 1 ELSE 0 END) as watch,
        SUM(CASE WHEN health_status = 'DEGRADING' THEN 1 ELSE 0 END) as degrading,
        SUM(CASE WHEN health_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
        ROUND(AVG(health_score), 1) as avg_health
      FROM sensor_health
    `);

    // 2. Priority counts
    const priorities = await queryOne(`
      SELECT 
        SUM(CASE WHEN maintenance_priority = 'URGENT' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN maintenance_priority = 'HIGH' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN maintenance_priority = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN maintenance_priority = 'LOW' THEN 1 ELSE 0 END) as low
      FROM sensor_health
    `);

    // 3. Top degrading sensors requiring maintenance
    const degradingSensors = await query(`
      SELECT 
        sh.station_id,
        s.station_name,
        s.state,
        s.district,
        s.station_status,
        sh.health_score,
        sh.health_status,
        sh.fault_count,
        sh.last_fault,
        sh.maintenance_priority
      FROM sensor_health sh
      JOIN stations s ON sh.station_id = s.station_id
      WHERE sh.health_status IN ('DEGRADING', 'CRITICAL', 'WATCH')
      ORDER BY sh.health_score ASC, sh.fault_count DESC
      LIMIT 25
    `);

    // 4. Fault frequency by anomaly type
    const faultFrequency = await query(`
      SELECT 
        anomaly_type,
        COUNT(*) as count,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
      FROM anomaly_events
      GROUP BY anomaly_type
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      summary: {
        total: Number(distribution?.total || 1248),
        healthy: Number(distribution?.healthy || 0),
        watch: Number(distribution?.watch || 0),
        degrading: Number(distribution?.degrading || 0),
        critical: Number(distribution?.critical || 0),
        average_health: Number(distribution?.avg_health || 92.5),
        priorities: {
          urgent: Number(priorities?.urgent || 0),
          high: Number(priorities?.high || 0),
          medium: Number(priorities?.medium || 0),
          low: Number(priorities?.low || 0)
        }
      },
      degrading_sensors: degradingSensors,
      fault_frequency: faultFrequency
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
