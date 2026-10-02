import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Serving static files from: ${publicDir}`);
});
