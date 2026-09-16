import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starte Initial-Seeding für Dein Weg Alltagsplaner...');

  // 1. Supermärkte anlegen
  const netto = await prisma.supermarket.upsert({
    where: { id: 'supermarket-netto' },
    update: {
      name: 'Netto',
    },
    create: {
      id: 'supermarket-netto',
      name: 'Netto',
      isGlobal: true,
    },
  });

  const rewe = await prisma.supermarket.upsert({
    where: { id: 'supermarket-rewe' },
    update: {},
    create: {
      id: 'supermarket-rewe',
      name: 'Rewe',
      isGlobal: true,
    },
  });

  const aldi = await prisma.supermarket.upsert({
    where: { id: 'supermarket-aldi' },
    update: {},
    create: {
      id: 'supermarket-aldi',
      name: 'Aldi Nord',
      isGlobal: true,
    },
  });

  const lidl = await prisma.supermarket.upsert({
    where: { id: 'supermarket-lidl' },
    update: {},
    create: {
      id: 'supermarket-lidl',
      name: 'Lidl',
      isGlobal: true,
    },
  });

  // 2. Standard Rezept-Kategorien initialisieren
  const defaultCategories = [
    'Alltagsküche',
    'Pasta & Teigwaren',
    'Fleisch & Geflügel',
    'Vegetarisch & Vegan',
    'Suppen & Eintöpfe',
    'Schnelle Küche',
    'Fisch & Meeresfrüchte',
    'Salate & Bowls',
    'Desserts & Süßspeisen',
  ];

  for (let i = 0; i < defaultCategories.length; i++) {
    const catName = defaultCategories[i];
    await prisma.recipeCategory.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        sortOrder: i,
      },
    });
  }

  console.log('✅ Initialer Stammdaten-Katalog erfolgreich vorbereitet:');
  console.log(`- 4 Supermärkte (Netto, Rewe, Aldi Nord, Lidl)`);
  console.log(`- ${defaultCategories.length} Rezept-Kategorien hinterlegt`);
  console.log(`- 0 Zutaten hinterlegt (Preise & Lebensmittel werden manuell gepflegt)`);
  console.log(`- 0 Rezepte im Katalog hinterlegt (Katalog startet leer)`);
  console.log(`- 0 Benutzer hinterlegt (Ersteinrichtungs-Modus aktiv)`);
}

main()
  .catch((e) => {
    console.error('Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
