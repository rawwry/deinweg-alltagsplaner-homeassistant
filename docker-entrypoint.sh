#!/bin/sh
set -e

echo "=== Starte Dein Weg Alltagsplaner ==="

# 1. Sicherstellen, dass /share Verzeichnisse auf Home Assistant OS existieren
mkdir -p /share/deinweg-alltagsplaner/db
mkdir -p /share/deinweg-alltagsplaner/export

export DATABASE_URL="file:/share/deinweg-alltagsplaner/db/alltagsplaner.db"

# 2. Prüfen, ob Datenbank neu initialisiert werden muss
if [ ! -f "/share/deinweg-alltagsplaner/db/alltagsplaner.db" ]; then
  echo "Initialisiere neue SQLite-Datenbank unter /share/deinweg-alltagsplaner/db/alltagsplaner.db..."
  npx prisma db push
  echo "Führe Initial-Seeding aus..."
  npx tsx prisma/seed.ts
else
  echo "Bestehende Datenbank gefunden, aktualisiere Schema..."
  npx prisma db push --skip-generate
fi

echo "Starte Server auf Port 4731..."
exec node server/dist/server/src/index.js
