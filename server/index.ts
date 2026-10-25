import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureFoundersInitialized } from './services/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure Founders KOLLOJU RAVI CHARAN & VOORE YASHWANTH are securely bootstrapped
ensureFoundersInitialized();

// Route Handlers
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import eventsRouter from './routes/events.js';
import teamsRouter from './routes/teams.js';
import postsRouter from './routes/posts.js';
import careersRouter from './routes/careers.js';
import contactRouter from './routes/contact.js';
import dashboardRouter from './routes/dashboard.js';

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/org', teamsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/careers', careersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/dashboard', dashboardRouter);

// System Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    organization: 'AICONEKT TECHNOLOGIES',
    tagline: 'CONNECT IDEAS. CREATE IMPACT.',
    database: 'SQLite (Persistent node:sqlite)',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static files in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`[AICONEKT Server] API engine listening on port ${PORT}`);
  console.log(`[AICONEKT Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
