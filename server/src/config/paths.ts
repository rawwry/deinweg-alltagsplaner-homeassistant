import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findProjectRoot(startDir: string): string {
  let cur = startDir;
  while (cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'package.json'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  return process.cwd();
}

// Project root
export const ROOT_DIR = findProjectRoot(__dirname);

// Home Assistant /share detection
const HA_SHARE_BASE = '/share/deinweg-alltagsplaner';
const hasShareMount = fs.existsSync('/share');

export const STORAGE_DIR = hasShareMount
  ? path.join(HA_SHARE_BASE, 'db')
  : path.resolve(ROOT_DIR, 'prisma');

export const EXPORT_DIR = hasShareMount
  ? path.join(HA_SHARE_BASE, 'export')
  : path.resolve(ROOT_DIR, 'export');

// Ensure storage and export directories exist
try {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Hinweis beim Anlegen der Speicherverzeichnisse:', err);
}

// Database file path
export const DB_FILE_PATH = hasShareMount
  ? path.join(STORAGE_DIR, 'alltagsplaner.db')
  : path.join(STORAGE_DIR, 'dev.db');

export function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return `file:${DB_FILE_PATH}`;
}

export const PORT = Number(process.env.PORT) || 4731;
export const JWT_SECRET = process.env.JWT_SECRET || 'dein-weg-alltagsplaner-secret-key-2026';
