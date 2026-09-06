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

import crypto from 'crypto';

export const PORT = Number(process.env.PORT) || 4731;

function resolveJwtSecret(): string {
  // 1. Check environment variable
  let configuredSecret = process.env.JWT_SECRET;

  // 2. Check Home Assistant /data/options.json
  if (!configuredSecret && fs.existsSync('/data/options.json')) {
    try {
      const options = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));
      if (options.jwt_secret && typeof options.jwt_secret === 'string') {
        configuredSecret = options.jwt_secret;
      }
    } catch {
      // Ignore options read error
    }
  }

  // 3. If a valid custom secret was provided (not empty and not the default placeholder), use it
  const isDefaultPlaceholder =
    !configuredSecret ||
    configuredSecret === 'change_me_in_production_jwt_secret_key' ||
    configuredSecret === 'dein-weg-alltagsplaner-secret-key-2026';

  if (!isDefaultPlaceholder && configuredSecret) {
    return configuredSecret;
  }

  // 4. Otherwise, generate / read a persistent cryptographic secret from STORAGE_DIR
  const persistentSecretPath = path.join(STORAGE_DIR, 'jwt.secret');
  try {
    if (fs.existsSync(persistentSecretPath)) {
      const stored = fs.readFileSync(persistentSecretPath, 'utf8').trim();
      if (stored.length >= 16) {
        return stored;
      }
    }
    // Generate new secure 64-character secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(persistentSecretPath, newSecret, { mode: 0o600 });
    console.log(`🔐 Neues sicheres JWT-Secret persistent generiert unter: ${persistentSecretPath}`);
    return newSecret;
  } catch (err) {
    console.warn('Konnte persistentes JWT-Secret nicht schreiben/lesen, nutze Fallback:', err);
    return configuredSecret || 'dein-weg-alltagsplaner-fallback-secret-2026';
  }
}

export const JWT_SECRET = resolveJwtSecret();
