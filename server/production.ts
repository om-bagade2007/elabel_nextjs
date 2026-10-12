import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import { registerRoutes } from './routes';
import { ensureSchema } from './migrate';

if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.includes('<')) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'production',
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const host = process.env.HOST || '0.0.0.0';

// Configure middleware
app.use(express.json());

// Configure API routes
registerRoutes(app);

// Serve static files from the public directory
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Handle client-side routing
app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.url.startsWith('/api')) {
    console.log('Serving index.html for:', req.url);
    res.sendFile(path.join(publicDir, 'index.html'));
  } else {
    next();
  }
});

// Global error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Bring the database up to the current schema before serving (logs and continues on failure)
ensureSchema()
  .catch((err) => console.error('Database schema update failed:', err.message))
  .finally(() =>
    app.listen(port, host, () => {
      console.log(`Server is running at http://${host}:${port}`);
      console.log(`Serving static files from: ${publicDir}`);
    }),
  );
