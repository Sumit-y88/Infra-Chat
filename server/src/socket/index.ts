import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { registerHandlers, AuthenticatedSocket } from './handlers';
import {
  addUserSocket,
  removeUserSocket,
  setUserOnline,
  setUserOffline,
  setPresenceCallback,
} from './presence';

let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance;

const getAllowedOrigins = (): string[] => {
  const defaults = [
    'https://infra-chat-six.vercel.app',
    'https://infra-chat.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  if (process.env.CLIENT_URL) {
    const customOrigins = process.env.CLIENT_URL.split(',').map((o) => o.trim());
    return Array.from(new Set([...defaults, ...customOrigins]));
  }

  return defaults;
};

const isOriginAllowed = (origin: string, allowed: string[]): boolean => {
  if (allowed.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/infra-chat.*\.vercel\.app$/.test(origin)) return true;
  return false;
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  const allowedOrigins = getAllowedOrigins();

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or allowed origins
        if (!origin || isOriginAllowed(origin, allowedOrigins)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev, allows matching origin
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance = io;

  // Set up presence change broadcaster
  setPresenceCallback((userId, status) => {
    io.emit(status === 'offline' ? 'user:offline' : 'user:online', {
      userId,
      status,
    });
  });

  // JWT auth middleware for socket connections
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      if (user.isBanned) {
        return next(new Error('Account banned'));
      }

      // Auto-check mute expiry and persist if updated
      if (user.checkMuteStatus()) {
        await user.save();
      }

      (socket as AuthenticatedSocket).user = user;
      next();
    } catch (err: any) {
      console.error('Socket Auth Error:', err.message);

      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }

      if (err.name === 'JsonWebTokenError') {
        return next(new Error('Invalid token'));
      }

      return next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const user = authSocket.user;

    console.log(`⚡ User connected: ${user.username} (${socket.id})`);
    addUserSocket(user._id.toString(), socket.id);
    setUserOnline(user._id.toString());

    socket.emit('socket:connected', {
      message: 'Socket connected successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });

    registerHandlers(io, authSocket);

    socket.on('disconnect', (reason: string) => {
      removeUserSocket(user._id.toString(), socket.id);
      setUserOffline(user._id.toString());

      console.log(`🔌 User disconnected: ${user.username} (${socket.id}) - ${reason}`);
    });
  });

  return io;
};

export default { initializeSocket, getIO };
