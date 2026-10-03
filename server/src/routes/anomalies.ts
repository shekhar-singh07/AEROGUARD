import { Router, Request, Response } from 'express';
import { query, queryOne, execute } from '../db';

const router = Router();

// GET /api/anomalies
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    const severity = req.query.severity as string;
    const status = req.query.status as string;
    const state = req.query.state as string;
    const anomalyType = req.query.type as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (severity && severity !== 'ALL') {
      conditions.push(`ae.severity = $${params.length + 1}`);
      params.push(severity);
    }

    if (status && status !== 'ALL') {
      conditions.push(`ae.status = $${params.length + 1}`);
      params.push(status);
    }

    if (state && state !== 'ALL') {
      conditions.push(`s.state = $${params.length + 1}`);
      params.push(state);
    }

    if (anomalyType && anomalyType !== 'ALL') {
      conditions.push(`ae.anomaly_type = $${params.length + 1}`);
      params.push(anomalyType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await queryOne(`
      SELECT COUNT(*) as total 
      FROM anomaly_events ae
      JOIN stations s ON ae.station_id = s.station_id
      ${whereClause}
    `, params);
    const total = Number(countRow?.total || 0);

    const anomalies = await query(`
      SELECT 
        ae.id,
        ae.observation_id,
        ae.station_id,
        s.station_name,
        s.state,
        s.district,
        ae.anomaly_type,
        ae.severity,
        ae.confidence,
        ae.trust_score,
        ae.status,
        ae.created_at,
        o.temperature,
        o.relative_humidity,
        o.atmospheric_pressure
      FROM anomaly_events ae
      JOIN stations s ON ae.station_id = s.station_id
      LEFT JOIN observations o ON ae.observation_id = o.observation_id
      ${whereClause}
      ORDER BY ae.created_at DESC, ae.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    res.json({
      success: true,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      anomalies
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/anomalies/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;

    const alert = await queryOne(`
      SELECT 
        ae.*,
        s.station_name,
        s.state,
        s.district,
        s.latitude,
        s.longitude,
        s.sensor_health,
        o.temperature,
        o.relative_humidity,
        o.atmospheric_pressure,
        o.timestamp as observation_time
      FROM anomaly_events ae
      JOIN stations s ON ae.station_id = s.station_id
      LEFT JOIN observations o ON ae.observation_id = o.observation_id
      WHERE ae.id = $1
    `, [alertId]);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Anomaly alert not found' });
    }

    // Fetch evidence breakdown
    const evidences = await query(`
      SELECT * FROM anomaly_evidence WHERE anomaly_id = $1 ORDER BY id ASC
    `, [alertId]);

    // Fetch review history
    const reviews = await query(`
      SELECT * FROM reviews WHERE anomaly_id = $1 ORDER BY created_at DESC
    `, [alertId]);

    // Calculate expected baseline & deviation
    const baseline = await queryOne(`
      SELECT 
        ROUND(AVG(temperature), 2) as expected_temp,
        ROUND(AVG(relative_humidity), 2) as expected_rh,
        ROUND(AVG(atmospheric_pressure), 2) as expected_pressure
      FROM observations
      WHERE station_id = $1 AND timestamp < $2
      ORDER BY timestamp DESC
      LIMIT 24
    `, [alert.station_id, alert.created_at]);

    const expectedTemp = baseline?.expected_temp || (alert.temperature ? alert.temperature - 4.5 : 28.0);
    const deviationTemp = alert.temperature ? Math.round((alert.temperature - expectedTemp) * 10) / 10 : 0.0;

    // Fetch nearby stations for spatial investigation map
    const nearbyPeers = await query(`
      SELECT 
        s.station_id, s.station_name, s.latitude, s.longitude,
        o.temperature, o.relative_humidity, o.atmospheric_pressure
      FROM stations s
      LEFT JOIN observations o ON s.station_id = o.station_id
      WHERE s.station_id != $1 AND s.station_status = 'ONLINE'
      GROUP BY s.station_id
      LIMIT 6
    `, [alert.station_id]);

    // Format visual evidence strength bars
    const evidenceStrengths: Record<string, number> = {
      temporal: 15,
      spatial: 10,
      multivariate: 12,
      ml_isolation_forest: 18,
      rule_qc: 10
    };

    evidences.forEach((ev: any) => {
      const type = ev.evidence_type.toLowerCase();
      if (type.includes('temp')) evidenceStrengths.temporal = Math.max(evidenceStrengths.temporal, ev.score);
      else if (type.includes('spat')) evidenceStrengths.spatial = Math.max(evidenceStrengths.spatial, ev.score);
      else if (type.includes('multi')) evidenceStrengths.multivariate = Math.max(evidenceStrengths.multivariate, ev.score);
      else if (type.includes('iso') || type.includes('ml')) evidenceStrengths.ml_isolation_forest = Math.max(evidenceStrengths.ml_isolation_forest, ev.score);
      else if (type.includes('rule') || type.includes('base')) evidenceStrengths.rule_qc = Math.max(evidenceStrengths.rule_qc, ev.score);
    });

    res.json({
      success: true,
      alert: {
        ...alert,
        expected_temperature: expectedTemp,
        temperature_deviation: deviationTemp,
        evidence_strengths: evidenceStrengths,
        evidences,
        reviews,
        nearby_peers: nearbyPeers
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/anomalies/:id/review
router.get('/review', (_req, res) => res.status(405).json({ message: 'Use POST' }));
router.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;
    const { reviewer, decision, comment } = req.body;

    if (!decision) {
      return res.status(400).json({ success: false, message: 'Decision is required' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let newStatus = 'INVESTIGATING';
    if (decision === 'CONFIRM_SENSOR_FAULT') newStatus = 'CONFIRMED_FAULT';
    else if (decision === 'CONFIRM_WEATHER_EVENT') newStatus = 'CONFIRMED_WEATHER_EVENT';
    else if (decision === 'FALSE_ALARM') newStatus = 'FALSE_ALARM';
    else if (decision === 'RESOLVED') newStatus = 'RESOLVED';

    // 1. Update anomaly_events status
    await execute(`
      UPDATE anomaly_events SET status = $1 WHERE id = $2
    `, [newStatus, alertId]);

    // 2. Insert into reviews table
    await execute(`
      INSERT INTO reviews (anomaly_id, reviewer, decision, comment, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [alertId, reviewer || 'Expert Reviewer', decision, comment || '', now]);

    // 3. Log audit event
    await execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
      VALUES ($1, $2, 'ANOMALY_EVENT', $3, $4)
    `, [reviewer || 'Meteorologist', `HUMAN_REVIEW_${decision}`, alertId, now]);

    res.json({ success: true, message: 'Review successfully recorded', new_status: newStatus });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/anomalies/:id/quarantine
router.post('/:id/quarantine', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;
    const reviewer = req.body.reviewer || 'Data Quality Operator';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const alert = await queryOne(`SELECT observation_id FROM anomaly_events WHERE id = $1`, [alertId]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    await execute(`UPDATE anomaly_events SET status = 'QUARANTINED' WHERE id = $1`, [alertId]);
    await execute(`UPDATE observations SET quality_status = 'QUARANTINED', anomaly_status = 'QUARANTINED' WHERE observation_id = $1`, [alert.observation_id]);
    await execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
      VALUES ($1, 'OBSERVATION_QUARANTINE', 'OBSERVATION', $2, $3)
    `, [reviewer, alert.observation_id, now]);

    res.json({ success: true, message: 'Observation quarantined from numerical model feeds', observation_id: alert.observation_id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/anomalies/:id/restore
router.post('/:id/restore', async (req: Request, res: Response) => {
  try {
    const alertId = req.params.id;
    const reviewer = req.body.reviewer || 'Data Quality Operator';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const alert = await queryOne(`SELECT observation_id FROM anomaly_events WHERE id = $1`, [alertId]);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    await execute(`UPDATE anomaly_events SET status = 'RESTORED' WHERE id = $1`, [alertId]);
    await execute(`UPDATE observations SET quality_status = 'VALID', anomaly_status = 'NORMAL', trust_score = 92.0 WHERE observation_id = $1`, [alert.observation_id]);
    await execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
      VALUES ($1, 'OBSERVATION_RESTORE', 'OBSERVATION', $2, $3)
    `, [reviewer, alert.observation_id, now]);

    res.json({ success: true, message: 'Observation restored to valid status', observation_id: alert.observation_id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
