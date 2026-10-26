import { Request, Response, NextFunction } from 'express';

export const ROLES = {
  MEMBER: 1,
  MODERATOR: 2,
  SUPERADMIN: 3,
} as const;

export type RoleLevel = (typeof ROLES)[keyof typeof ROLES];

const roleNames: Record<number, string> = {
  1: 'Member',
  2: 'Moderator',
  3: 'SuperAdmin',
};

export const requireRole = (minRole: number) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Authentication required.',
        });
      }

      if (req.user.role < minRole) {
        return res.status(403).json({
          message: `This action requires ${roleNames[minRole] || 'higher'} privileges.`,
        });
      }

      next();
    } catch (error: any) {
      console.error('RBAC Middleware Error:', error.message);
      return res.status(500).json({
        message: 'Authorization failed.',
      });
    }
  };
};

export default {
  requireRole,
  ROLES,
};
