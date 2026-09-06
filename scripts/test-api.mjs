// Automated API and Integration verification script
const BASE = 'http://127.0.0.1:4731';

async function runTests() {
  console.log('=== Starte Verifikationstests für Dein Weg Alltagsplaner ===\n');

  // 1. Health Check
  const healthRes = await fetch(`${BASE}/api/health`);
  const health = await healthRes.json();
  console.log('✓ Health Check:', health);
  if (health.status !== 'ok' || health.port !== 4731) {
    throw new Error('Health check fehlgeschlagen');
  }

  // 2. Login als Bewohner Kevin
  console.log('\n--- Test 2: Login als Bewohner Kevin (Emsdetten) ---');
  const loginKevinRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'kevin',
      password: 'emsdetten2026!',
      rememberMe: true,
    }),
  });
  const kevinAuth = await loginKevinRes.json();
  console.log('✓ Login erfolgreich:', kevinAuth.user);
  if (!kevinAuth.token || kevinAuth.user.role !== 'BEWOHNER') {
    throw new Error('Kevin Login fehlerhaft');
  }

  // 3. Standort-Isolation für Bewohner testen
  console.log('\n--- Test 3: Strikte Standort-Isolation ---');
  // Abruf des eigenen Standorts Emsdetten (erlaubt)
  const emsdettenPlanRes = await fetch(
    `${BASE}/api/food/mealplan?locationId=location-emsdetten&year=2026&weekNumber=36`,
    { headers: { Authorization: `Bearer ${kevinAuth.token}` } }
  );
  if (!emsdettenPlanRes.ok) {
    throw new Error(`Fehler beim Laden des eigenen Wochenplans: ${emsdettenPlanRes.status}`);
  }
  const emsdettenPlan = await emsdettenPlanRes.json();
  console.log(`✓ Eigener Wochenplan (Emsdetten) geladen: ${emsdettenPlan.days.length} Tage geplant.`);

  // Versuch, fremden Standort Steinfurt abzurufen (muss 403 verweigert werden)
  const forbiddenRes = await fetch(
    `${BASE}/api/food/mealplan?locationId=location-steinfurt&year=2026&weekNumber=36`,
    { headers: { Authorization: `Bearer ${kevinAuth.token}` } }
  );
  console.log(`✓ Fremder Standort Zugriff: Status ${forbiddenRes.status} (Erwartet: 403)`);
  if (forbiddenRes.status !== 403) {
    throw new Error('Sicherheitslücke: Bewohner konnte fremden Standort abrufen!');
  }

  // 4. Konsolidierte Einkaufsliste & Preisschätzung prüfen
  console.log('\n--- Test 4: Konsolidierte Einkaufsliste & Netto-Preise ---');
  const shoppingRes = await fetch(
    `${BASE}/api/food/shopping-list?locationId=location-emsdetten&year=2026&weekNumber=36`,
    { headers: { Authorization: `Bearer ${kevinAuth.token}` } }
  );
  const shopping = await shoppingRes.json();
  console.log(`✓ Einkaufsliste für ${shopping.supermarketName}:`);
  console.log(`  - ${shopping.items.length} konsolidierte Zutaten`);
  console.log(`  - Geschätzte Gesamtkosten: ${shopping.totalEstimatedCost} €`);
  if (shopping.items.length === 0 || shopping.totalEstimatedCost <= 0) {
    throw new Error('Einkaufslistenaggregation oder Preisschätzung unvollständig');
  }

  // 5. Login als Betreuer
  console.log('\n--- Test 5: Login als Betreuer ---');
  const loginBetreuerRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'betreuer',
      password: 'betreuer2026!',
    }),
  });
  const betreuerAuth = await loginBetreuerRes.json();
  console.log('✓ Betreuer Login erfolgreich:', betreuerAuth.user);

  // Betreuer kann standortübergreifend zugreifen
  const steinfurtByBetreuer = await fetch(
    `${BASE}/api/food/mealplan?locationId=location-steinfurt&year=2026&weekNumber=36`,
    { headers: { Authorization: `Bearer ${betreuerAuth.token}` } }
  );
  console.log(`✓ Betreuer Zugriff auf Steinfurt: Status ${steinfurtByBetreuer.status} (Erwartet: 200)`);
  if (!steinfurtByBetreuer.ok) {
    throw new Error('Betreuer konnte nicht auf Standort Steinfurt zugreifen');
  }

  // 6. Abfallkalender & Notizen Endpunkte prüfen
  console.log('\n--- Test 6: Abfallkalender & Notizen ---');
  const wasteRes = await fetch(`${BASE}/api/waste?locationId=location-emsdetten`, {
    headers: { Authorization: `Bearer ${kevinAuth.token}` },
  });
  const wasteList = await wasteRes.json();
  console.log(`✓ Abfallkalender geladen: ${wasteList.length} Termine hinterlegt.`);

  const notesRes = await fetch(`${BASE}/api/notes?locationId=location-emsdetten`, {
    headers: { Authorization: `Bearer ${kevinAuth.token}` },
  });
  const notesList = await notesRes.json();
  console.log(`✓ Betreuernotizen geladen: ${notesList.length} Notizen hinterlegt.`);

  // 7. Statisches Frontend (index.html)
  console.log('\n--- Test 7: Statisches Frontend Serving ---');
  const indexRes = await fetch(`${BASE}/`);
  const indexHtml = await indexRes.text();
  const hasAppTitle = indexHtml.includes('Dein Weg Alltagsplaner');
  console.log(`✓ Index HTML ausgeliefert (Enthält App-Titel: ${hasAppTitle})`);
  if (!hasAppTitle) {
    throw new Error('Frontend index.html nicht korrekt ausgeliefert');
  }

  console.log('\n🎉 ALLE 7 VERIFIKATIONSTESTS ERFOLGREICH BESTANDEN! 🎉\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test fehlgeschlagen:', err);
  process.exit(1);
});
