import { Router, Request, Response } from 'express';
import { query, queryOne, execute } from '../db';

const router = Router();

// GET /api/maintenance
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'ALL') {
      conditions.push(`m.status = $${params.length + 1}`);
      params.push(status);
    }

    if (priority && priority !== 'ALL') {
      conditions.push(`m.priority = $${params.length + 1}`);
      params.push(priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const tasks = await query(`
      SELECT 
        m.id,
        m.station_id,
        s.station_name,
        s.state,
        s.district,
        m.sensor_type,
        m.problem,
        m.priority,
        m.assigned_engineer,
        m.status,
        m.created_at,
        m.resolved_at
      FROM maintenance m
      JOIN stations s ON m.station_id = s.station_id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN m.status = 'OPEN' THEN 1
          WHEN m.status = 'INVESTIGATING' THEN 2
          WHEN m.status = 'SCHEDULED' THEN 3
          ELSE 4
        END,
        m.created_at DESC
    `, params);

    // Summary counters
    const counts = await queryOne(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'INVESTIGATING' THEN 1 ELSE 0 END) as investigating_count,
        SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_count
      FROM maintenance
    `);

    res.json({
      success: true,
      counts: {
        total: Number(counts?.total || 0),
        open: Number(counts?.open_count || 0),
        investigating: Number(counts?.investigating_count || 0),
        scheduled: Number(counts?.scheduled_count || 0),
        resolved: Number(counts?.resolved_count || 0)
      },
      tasks
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/maintenance
router.post('/', async (req: Request, res: Response) => {
  try {
    const { station_id, sensor_type, problem, priority, assigned_engineer } = req.body;

    if (!station_id || !problem) {
      return res.status(400).json({ success: false, message: 'station_id and problem description are required' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const result = await execute(`
      INSERT INTO maintenance (station_id, sensor_type, problem, priority, assigned_engineer, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'OPEN', $6)
    `, [
      station_id,
      sensor_type || 'TEMPERATURE',
      problem,
      priority || 'HIGH',
      assigned_engineer || 'Unassigned',
      now
    ]);

    // Audit log
    await execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
      VALUES ('OPERATOR', 'CREATE_MAINTENANCE_ORDER', 'STATION', $1, $2)
    `, [station_id, now]);

    res.json({ success: true, message: 'Maintenance order created successfully', id: result.lastID });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/maintenance/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const { status, assigned_engineer } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
      if (status === 'RESOLVED') {
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        updates.push(`resolved_at = $${params.length + 1}`);
        params.push(now);
      }
    }

    if (assigned_engineer !== undefined) {
      updates.push(`assigned_engineer = $${params.length + 1}`);
      params.push(assigned_engineer);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(taskId);
    await execute(`UPDATE maintenance SET ${updates.join(', ')} WHERE id = $${params.length}`, params);

    res.json({ success: true, message: 'Maintenance work order updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
