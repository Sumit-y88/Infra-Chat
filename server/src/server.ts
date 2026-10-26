import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';

import connectDB from './config/db';
import { initializeSocket } from './socket';

import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import messageRoutes from './routes/messages';
import auditRoutes from './routes/audit';
import directMessageRoutes from './routes/directMessages';
import directMessageActionRoutes from './routes/directMessageActions';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';

const app = express();
const server = http.createServer(app);

// Connect database
connectDB();

// CORS configuration
const allowedOrigins = [
  'https://infra-chat-six.vercel.app',
  'https://infra-chat.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const isOriginAllowed = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/infra-chat.*\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically from root uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Internal Network Server API is running',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', messageRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/direct-message-actions', directMessageActionRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Initialize socket
initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { app, server };
