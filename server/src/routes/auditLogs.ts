import { Router, Request, Response } from 'express';
import { query, execute } from '../db';

const router = Router();

// GET /api/audit-logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const logs = await query(`
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC, id DESC
      LIMIT ${limit}
    `);

    res.json({ success: true, count: logs.length, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/audit-logs
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, action, entity_type, entity_id } = req.body;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await execute(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp)
      VALUES ($1, $2, $3, $4, $5)
    `, [user_id || 'OPERATOR', action, entity_type || 'SYSTEM', entity_id || 'N/A', now]);

    res.json({ success: true, message: 'Audit entry recorded' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
