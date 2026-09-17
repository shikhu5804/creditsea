import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { runSeed } from './seed/seedData';

dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://localhost:5001'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { ensureUploadsDirectory } from './utils/initUploads';

const uploadDir = ensureUploadsDirectory();

// Serve uploaded salary slips statically
app.use('/uploads', express.static(uploadDir));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
import authRoutes from './routes/authRoutes';
import loanRoutes from './routes/loanRoutes';
import opsRoutes from './routes/opsRoutes';
import seedRoutes from './routes/seedRoutes';

// Mount routes on both /api/v1 and /api for compatibility
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/ops', opsRoutes);
app.use('/api/v1/seed', seedRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/ops', opsRoutes);
app.use('/api/seed', seedRoutes);

// Health Check
app.get(['/api/v1/health', '/api/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/creditsea';

  try {
    console.log('Connecting to MongoDB Cloud Atlas / URI...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 } as any);
    console.log('✅ Connected to MongoDB Cloud Atlas database successfully!');
  } catch (err: any) {
    console.warn(`⚠️ Cloud MongoDB connection attempt (${err.message}). Launching automated MongoDB Memory Server...`);
    const mongod = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'creditsea' } });
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoMemoryServer running at ${mongoUri}`);
  }

  // Auto-seed database if empty
  try {
    await runSeed();
  } catch (seedErr) {
    console.error('Auto-seeding warning:', seedErr);
  }

  const listen = (portToTry: number) => {
    const server = app.listen(portToTry, () => {
      console.log(`🚀 CreditSea Backend Server running on http://localhost:${portToTry}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${portToTry} is in use (e.g. macOS AirPlay/ControlCenter). Retrying on port ${portToTry + 1}...`);
        listen(portToTry + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  listen(DEFAULT_PORT);
}

startServer();
