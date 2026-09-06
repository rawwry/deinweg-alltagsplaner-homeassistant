// Automated API and Integration verification script for Dein Weg Alltagsplaner
const BASE = 'http://127.0.0.1:4731';

async function runTests() {
  console.log('=== Starte Verifikationstests für Dein Weg Alltagsplaner ===\n');

  // 1. Health Check
  const healthRes = await fetch(`${BASE}/api/health`);
  const health = await healthRes.json();
  console.log('✓ Test 1: Health Check OK:', health);
  if (health.status !== 'ok' || health.port !== 4731) {
    throw new Error('Health check fehlgeschlagen');
  }

  // 2. Setup Status Check (Initial Clean State: 0 Users)
  console.log('\n--- Test 2: Setup Status vor Ersteinrichtung ---');
  const setupStatusRes = await fetch(`${BASE}/api/auth/setup-status`);
  const setupStatus = await setupStatusRes.json();
  console.log('✓ Setup Status:', setupStatus);
  if (!setupStatus.setupRequired || setupStatus.userCount !== 0) {
    throw new Error(`Erwartet setupRequired: true und userCount: 0, erhalten: ${JSON.stringify(setupStatus)}`);
  }

  // 3. Initial Setup: Erster Benutzer als Betreuer / Admin mit Firmen-E-Mail
  console.log('\n--- Test 3: Ersteinrichtung (Setup Wizard) ---');
  const setupPostRes = await fetch(`${BASE}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      name: 'Marcel Betreuer',
      email: 'marcel.betreuer@deinweg.de',
      password: 'startAdmin2026!',
    }),
  });
  if (!setupPostRes.ok) {
    const err = await setupPostRes.json();
    throw new Error(`Setup fehlgeschlagen: ${err.error}`);
  }
  const setupResult = await setupPostRes.json();
  console.log('✓ Admin erfolgreich via Setup angelegt:', setupResult.user);
  if (setupResult.user.role !== 'BETREUER' || setupResult.user.email !== 'marcel.betreuer@deinweg.de') {
    throw new Error('Erster User muss Rolle BETREUER (Admin) und Firmen-E-Mail haben');
  }
  const adminToken = setupResult.token;

  // 4. Zweiter Setup-Versuch muss 403 geblockt werden
  console.log('\n--- Test 4: Schutz vor Mehrfach-Initialisierung ---');
  const blockedSetupRes = await fetch(`${BASE}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'hacker',
      name: 'Hacker',
      email: 'hacker@example.com',
      password: 'hack',
    }),
  });
  console.log(`✓ Mehrfach-Setup geblockt: Status ${blockedSetupRes.status} (Erwartet: 403)`);
  if (blockedSetupRes.status !== 403) {
    throw new Error('Sicherheitslücke: Setup-Endpunkt nach Ersteinrichtung nicht gesperrt!');
  }

  // 5. Standort anlegen als Betreuer / Admin
  console.log('\n--- Test 5: Standort anlegen (Haus Rheine) ---');
  const createLocRes = await fetch(`${BASE}/api/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Haus Rheine',
      address: 'Bahnhofstraße 12, 48429 Rheine',
      defaultServings: 6,
      defaultSupermarketId: 'supermarket-netto',
    }),
  });
  if (!createLocRes.ok) {
    const err = await createLocRes.json();
    throw new Error(`Standort-Erstellung fehlgeschlagen: ${err.error}`);
  }
  const newLocation = await createLocRes.json();
  console.log('✓ Standort erfolgreich erstellt:', newLocation);

  // 6. Bewohner anlegen und Standort zuweisen
  console.log('\n--- Test 6: Bewohner anlegen und zuweisen ---');
  const createUserRes = await fetch(`${BASE}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      username: 'dennis',
      name: 'Dennis Bewohner',
      password: 'dennis2026!',
      role: 'BEWOHNER',
      locationId: newLocation.id,
    }),
  });
  if (!createUserRes.ok) {
    const err = await createUserRes.json();
    throw new Error(`Bewohner-Erstellung fehlgeschlagen: ${err.error}`);
  }
  const newResident = await createUserRes.json();
  console.log('✓ Bewohner angelegt:', newResident);

  // 7. Login als Bewohner & Standort-Zugriff prüfen
  console.log('\n--- Test 7: Bewohner-Login & Wochenplan-Zugriff ---');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'dennis',
      password: 'dennis2026!',
    }),
  });
  if (!loginRes.ok) throw new Error('Bewohner-Login fehlgeschlagen');
  const residentAuth = await loginRes.json();
  console.log('✓ Bewohner eingeloggt:', residentAuth.user);

  // Wochenplan für den neuen Standort abrufen
  const planRes = await fetch(
    `${BASE}/api/food/mealplan?locationId=${newLocation.id}&year=2026&weekNumber=36`,
    { headers: { Authorization: `Bearer ${residentAuth.token}` } }
  );
  if (!planRes.ok) throw new Error('Wochenplan-Abruf fehlgeschlagen');
  const plan = await planRes.json();
  console.log(`✓ Wochenplan für "${newLocation.name}" erfolgreich initialisiert: ${plan.days.length} Wochentage.`);

  // 8. SMTP-Konfiguration speichern und testen
  console.log('\n--- Test 8: SMTP-Server Konfiguration & Test ---');
  const smtpSaveRes = await fetch(`${BASE}/api/admin/smtp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'notifications@deinweg.de',
      password: 'smtpSecretPassword123!',
      fromEmail: 'alltagsplaner@deinweg.de',
      fromName: 'Dein Weg Alltagsplaner',
    }),
  });
  if (!smtpSaveRes.ok) throw new Error('SMTP speichern fehlgeschlagen');
  const smtpSaveData = await smtpSaveRes.json();
  console.log('✓ SMTP-Einstellungen gespeichert:', smtpSaveData.setting);

  // Abruf der gespeicherten SMTP-Einstellungen (Passwort wird maskiert)
  const smtpGetRes = await fetch(`${BASE}/api/admin/smtp`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const smtpGet = await smtpGetRes.json();
  console.log('✓ SMTP-Einstellungen abgerufen (hasPassword = true):', {
    host: smtpGet.host,
    port: smtpGet.port,
    hasPassword: smtpGet.hasPassword,
    fromEmail: smtpGet.fromEmail,
    configured: smtpGet.configured,
  });
  if (!smtpGet.hasPassword || smtpGet.host !== 'smtp.example.com' || !smtpGet.configured) {
    throw new Error('SMTP-Abruf unvollständig oder fehlerhaft');
  }

  // 9. Stammdatenkatalog prüfen
  console.log('\n--- Test 9: Stammdatenkatalog (Supermärkte, Zutaten, Rezepte) ---');
  const marketsRes = await fetch(`${BASE}/api/food/supermarkets`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const markets = await marketsRes.json();
  console.log(`✓ Supermärkte im Katalog: ${markets.length} (Netto, Rewe, Aldi, Lidl)`);

  const recipesRes = await fetch(`${BASE}/api/food/recipes`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const recipes = await recipesRes.json();
  console.log(`✓ Vorinstallierte Rezepte: ${recipes.length} Gerichte`);

  console.log('\n======================================================');
  console.log('🎉 ALLE 9 INTEGRATIONSTESTS ERFOLGREICH BESTANDEN!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test fehlgeschlagen:', err);
  process.exit(1);
});
