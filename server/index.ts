import 'dotenv/config';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { ensureSchema } from './migrate';
import { setupVite, serveStatic, log } from './vite';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

if (process.env.SENTRY_DSN && !process.env.SENTRY_DSN.includes('<')) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
}

const app = express();

// Move CORS middleware to the top
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  await ensureSchema().catch((err) => console.error('Database schema update failed:', err.message));
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get('env') === 'development') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const serverPort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const serverHost = process.env.HOST || 'localhost';

  server.listen(serverPort, serverHost, () => {
    console.log(`Server running at http://${serverHost}:${serverPort}`);
  });
})();
