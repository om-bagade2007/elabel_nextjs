import 'dotenv/config';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import bcrypt from 'bcrypt';
import db from './db';
import cors from 'cors';
import { Pool } from 'pg';
import multer from 'multer';
import { put } from '@vercel/blob';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

const upload = multer({ storage: multer.memoryStorage() });

Sentry.init({
  dsn: process.env.SENTRY_DSN || '<YOUR_SENTRY_DSN>',
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, email, username',
      [username, email, hashedPassword],
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        username: newUser.rows[0].username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.post('/api/get-url', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const blob = await put(`products/${file.originalname}`, file.buffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });

  res.status(200).json({ url: blob.url });
});

// Add health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test route to trigger a Sentry error
app.get('/api/sentry-test', (req, res) => {
  throw new Error('Sentry test error!');
});

(async () => {
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

// Simple example using pg for PostgreSQL, adjust as needed for your setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/mydb',
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
};
