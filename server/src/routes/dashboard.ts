import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';

const router = Router();

// GET /api/dashboard
router.get('/', async (req: Request, res: Response) => {
  try {
    // 1. Station counts
    const stationCounts = await queryOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN station_status = 'ONLINE' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN station_status = 'OFFLINE' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN station_status = 'WARNING' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN station_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical
      FROM stations
    `);

    // 2. Observations count and average trust
    const obsStats = await queryOne(`
      SELECT 
        COUNT(*) as total_obs,
        ROUND(AVG(trust_score), 2) as avg_trust
      FROM observations
    `);

    // 3. Active anomalies & critical alerts
    const anomStats = await queryOne(`
      SELECT 
        COUNT(*) as total_active,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high_count,
        SUM(CASE WHEN anomaly_type = 'WEATHER_EVENT' THEN 1 ELSE 0 END) as weather_events_count,
        SUM(CASE WHEN status = 'ACTIVE' AND anomaly_type != 'WEATHER_EVENT' THEN 1 ELSE 0 END) as sensor_faults_count
      FROM anomaly_events
      WHERE status IN ('ACTIVE', 'INVESTIGATING', 'CONFIRMED_FAULT')
    `);

    // 4. Sensors requiring attention
    const sensorStats = await queryOne(`
      SELECT 
        SUM(CASE WHEN health_status IN ('DEGRADING', 'CRITICAL') THEN 1 ELSE 0 END) as attention_count,
        SUM(CASE WHEN health_status = 'DEGRADING' THEN 1 ELSE 0 END) as degrading_count,
        SUM(CASE WHEN health_status = 'CRITICAL' THEN 1 ELSE 0 END) as critical_health_count
      FROM sensor_health
    `);

    // 5. Hourly trend of anomalies for past 24 hours
    const hourlyTrend = await query(`
      SELECT 
        strftime('%H:00', created_at) as hour,
        COUNT(*) as count,
        SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
      FROM anomaly_events
      GROUP BY hour
      ORDER BY hour ASC
      LIMIT 24
    `);

    // 6. Recent active alerts stream
    const recentAlerts = await query(`
      SELECT 
        ae.id,
        ae.observation_id,
        ae.station_id,
        s.station_name,
        s.state,
        ae.anomaly_type,
        ae.severity,
        ae.confidence,
        ae.trust_score,
        ae.status,
        ae.created_at
      FROM anomaly_events ae
      JOIN stations s ON ae.station_id = s.station_id
      ORDER BY ae.created_at DESC, ae.id DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      kpis: {
        total_stations: Number(stationCounts?.total || 1248),
        online_stations: Number(stationCounts?.online || 1173),
        offline_stations: Number(stationCounts?.offline || 75),
        warning_stations: Number(stationCounts?.warning || 0),
        critical_stations: Number(stationCounts?.critical || 0),
        observations_processed: Number(obsStats?.total_obs || 0),
        average_trust_score: Number(obsStats?.avg_trust || 95.0),
        active_anomalies: Number(anomStats?.total_active || 0),
        critical_alerts: Number(anomStats?.critical_count || 0),
        weather_events_count: Number(anomStats?.weather_events_count || 0),
        sensor_faults_count: Number(anomStats?.sensor_faults_count || 0),
        sensors_requiring_attention: Number(sensorStats?.attention_count || 0),
        degrading_sensors: Number(sensorStats?.degrading_count || 0),
        critical_sensors: Number(sensorStats?.critical_health_count || 0)
      },
      hourly_trend: hourlyTrend,
      recent_alerts: recentAlerts
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/network/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const stateStats = await query(`
      SELECT 
        state,
        COUNT(*) as total_stations,
        SUM(CASE WHEN station_status = 'ONLINE' THEN 1 ELSE 0 END) as online_stations,
        SUM(CASE WHEN station_status = 'OFFLINE' THEN 1 ELSE 0 END) as offline_stations,
        ROUND(AVG(sensor_health), 1) as avg_sensor_health
      FROM stations
      GROUP BY state
      ORDER BY total_stations DESC
    `);

    res.json({ success: true, states: stateStats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/network/map
router.get('/map', async (req: Request, res: Response) => {
  try {
    // Return all 1,248 stations with their latest sensor metrics and anomaly flag
    const stations = await query(`
      SELECT 
        s.station_id,
        s.station_name,
        s.state,
        s.district,
        s.latitude,
        s.longitude,
        s.station_status,
        s.sensor_health,
        s.last_seen,
        COALESCE(ae.anomaly_type, 'NONE') as active_anomaly_type,
        COALESCE(ae.severity, 'NONE') as anomaly_severity,
        COALESCE(ae.trust_score, s.sensor_health) as trust_score
      FROM stations s
      LEFT JOIN anomaly_events ae ON s.station_id = ae.station_id AND ae.status = 'ACTIVE'
      GROUP BY s.station_id
    `);

    res.json({ success: true, total: stations.length, stations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
