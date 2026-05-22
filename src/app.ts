import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './modules/auth/auth.routes';
import issueRoutes from './modules/issues/issues.routes';
import { errorHandler } from './middleware/errorHandler';
import { sendError } from './utils/response';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

const app: Application = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ───  Check ──────────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ success: true, message: 'DevPulse API is running 🚀' });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  sendError({
    res,
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

export default app;
