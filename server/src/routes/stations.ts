import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';

const router = Router();

// Helper: Haversine distance
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/stations
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string || '').trim().toLowerCase();
    const state = req.query.state as string;
    const status = req.query.status as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(
        LOWER(station_id) LIKE $${params.length + 1} OR 
        LOWER(station_name) LIKE $${params.length + 1} OR 
        LOWER(state) LIKE $${params.length + 1} OR 
        LOWER(district) LIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (state && state !== 'ALL') {
      conditions.push(`state = $${params.length + 1}`);
      params.push(state);
    }

    if (status && status !== 'ALL') {
      conditions.push(`station_status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countRow = await queryOne(`SELECT COUNT(*) as total FROM stations ${whereClause}`, params);
    const total = Number(countRow?.total || 0);

    // Fetch page rows
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
        s.installation_date,
        COALESCE(ae.anomaly_type, 'NONE') as active_anomaly,
        COALESCE(ae.severity, 'NONE') as active_severity
      FROM stations s
      LEFT JOIN anomaly_events ae ON s.station_id = ae.station_id AND ae.status = 'ACTIVE'
      ${whereClause}
      GROUP BY s.station_id
      ORDER BY s.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json({
      success: true,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      stations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stations/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const stationId = req.params.id;

    // Station metadata
    const station = await queryOne(`
      SELECT * FROM stations WHERE station_id = $1 OR id = $1
    `, [stationId]);

    if (!station) {
      return res.status(404).json({ success: false, message: 'Station not found' });
    }

    // Latest observation
    const latestObs = await queryOne(`
      SELECT * FROM observations 
      WHERE station_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [station.station_id]);

    // Sensor health
    const sensorHealth = await queryOne(`
      SELECT * FROM sensor_health WHERE station_id = $1
    `, [station.station_id]);

    // Maintenance tasks
    const maintenanceTasks = await query(`
      SELECT * FROM maintenance WHERE station_id = $1 ORDER BY created_at DESC
    `, [station.station_id]);

    // Active anomalies for this station
    const activeAnomalies = await query(`
      SELECT * FROM anomaly_events WHERE station_id = $1 ORDER BY created_at DESC
    `, [station.station_id]);

    // Find 5 nearest peer stations
    const allPeers = await query(`
      SELECT station_id, station_name, state, district, latitude, longitude, station_status, sensor_health
      FROM stations
      WHERE station_id != $1 AND station_status != 'OFFLINE'
      LIMIT 300
    `, [station.station_id]);

    const peersWithDist = allPeers.map(p => {
      const dist = haversineKm(station.latitude, station.longitude, p.latitude, p.longitude);
      return { ...p, distance_km: dist };
    });

    peersWithDist.sort((a, b) => a.distance_km - b.distance_km);
    const nearestPeers = peersWithDist.slice(0, 5);

    // Fetch latest observation for each of the nearest peers
    for (const peer of nearestPeers) {
      const pObs = await queryOne(`
        SELECT temperature, relative_humidity, atmospheric_pressure, trust_score, timestamp
        FROM observations
        WHERE station_id = $1
        ORDER BY timestamp DESC
        LIMIT 1
      `, [peer.station_id]);
      (peer as any).latest_observation = pObs;
    }

    res.json({
      success: true,
      station,
      latest_observation: latestObs,
      sensor_health: sensorHealth,
      maintenance: maintenanceTasks,
      anomalies: activeAnomalies,
      nearby_peers: nearestPeers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stations/:id/observations
router.get('/:id/observations', async (req: Request, res: Response) => {
  try {
    const stationId = req.params.id;
    const timeRange = (req.query.timeRange as string || '24H').toUpperCase();

    let limit = 96; // 24 hours at 15m cadence
    if (timeRange === '1H') limit = 4;
    else if (timeRange === '6H') limit = 24;
    else if (timeRange === '24H') limit = 96;
    else if (timeRange === '7D') limit = 672;

    const observations = await query(`
      SELECT 
        observation_id,
        station_id,
        timestamp,
        temperature,
        relative_humidity,
        atmospheric_pressure,
        quality_status,
        anomaly_status,
        trust_score
      FROM observations
      WHERE station_id = $1
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `, [stationId]);

    // Return in chronological order
    observations.reverse();

    res.json({
      success: true,
      station_id: stationId,
      time_range: timeRange,
      count: observations.length,
      observations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
