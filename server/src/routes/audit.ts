import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import auth from '../middleware/auth';
import { requireRole, ROLES } from '../middleware/rbac';

const router = Router();

// GET /api/audit
// Moderator and SuperAdmin can view audit logs
router.get('/', auth, requireRole(ROLES.MODERATOR), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, action = '', roomId = '' } = req.query as any;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const query: Record<string, any> = {};

    if (action) query.action = action;
    if (roomId && mongoose.isValidObjectId(roomId)) query.room = roomId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'username role email')
        .populate('targetUser', 'username role email')
        .populate('room', 'name isPrivate')
        .sort({ createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.json({
      logs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error: any) {
    console.error('Get Audit Logs Error:', error.message);
    return res.status(500).json({
      message: 'Server error while fetching audit logs.',
    });
  }
});

export default router;
