import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, ROOT_DIR, DB_FILE_PATH, EXPORT_DIR } from './config/paths.js';
import coreRoutes from './modules/core/routes.js';
import foodplannerRoutes from './modules/foodplanner/routes.js';
import notesRoutes from './modules/notes/routes.js';
import wasteRoutes from './modules/waste/routes.js';
import { APP_NAME, APP_VERSION } from '../../shared/version.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });
}

// ==================== API ROUTES ====================
app.use('/api', coreRoutes);
app.use('/api/food', foodplannerRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/waste', wasteRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: APP_NAME,
    version: APP_VERSION,
    port: PORT,
    database: DB_FILE_PATH,
    exportDir: EXPORT_DIR,
  });
});

// ==================== SERVE FRONTEND (SPA) ====================
const clientDistPath = path.join(ROOT_DIR, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2>${APP_NAME} v${APP_VERSION}</h2>
        <p>API Server läuft auf Port ${PORT}.</p>
        <p>Das Frontend befindet sich im Entwicklungsmodus (Vite) oder wurde noch nicht gebaut.</p>
        <p><a href="/api/health">Systemstatus prüfen (/api/health)</a></p>
      </div>
    `);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ${APP_NAME} (v${APP_VERSION})`);
  console.log(`📡 Server läuft auf http://0.0.0.0:${PORT}`);
  console.log(`💾 SQLite DB: ${DB_FILE_PATH}`);
  console.log(`📂 PDF Export-Pfad: ${EXPORT_DIR}`);
  console.log(`======================================================\n`);
});

export default app;
