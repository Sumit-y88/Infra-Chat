import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  id: string;
  role: number;
}

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';

    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User not found.',
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: 'Your account has been banned.',
      });
    }

    // Auto-check mute expiry and persist if updated
    if (user.checkMuteStatus()) {
      await user.save();
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired.',
      });
    }

    console.error('Auth Middleware Error:', error.message);
    return res.status(500).json({
      message: 'Authentication failed.',
    });
  }
};

export default auth;
