import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starte Initial-Seeding für Dein Weg Alltagsplaner...');

  // 1. Supermärkte anlegen
  const netto = await prisma.supermarket.upsert({
    where: { id: 'supermarket-netto' },
    update: {},
    create: {
      id: 'supermarket-netto',
      name: 'Netto Marken-Discount',
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

  // 2. Zutaten und Richtpreise (Netto)
  interface SeedIngredient {
    id: string;
    name: string;
    category: string;
    unit: string;
    nettoPrice: number;
    priceSize: number;
    priceUnit: string;
  }

  const ingredientsData: SeedIngredient[] = [
    { id: 'ing-hack', name: 'Hackfleisch gemischt', category: 'Fleisch & Fisch', unit: 'g', nettoPrice: 4.49, priceSize: 500, priceUnit: 'g' },
    { id: 'ing-spaghetti', name: 'Spaghetti', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 0.89, priceSize: 500, priceUnit: 'g' },
    { id: 'ing-tomaten-pass', name: 'Passierte Tomaten', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 0.79, priceSize: 500, priceUnit: 'g' },
    { id: 'ing-zwiebeln', name: 'Zwiebeln', category: 'Obst & Gemüse', unit: 'Stück', nettoPrice: 1.29, priceSize: 10, priceUnit: 'Stück' },
    { id: 'ing-knoblauch', name: 'Knoblauch', category: 'Obst & Gemüse', unit: 'Zehe', nettoPrice: 0.59, priceSize: 5, priceUnit: 'Zehe' },
    { id: 'ing-moehren', name: 'Möhren', category: 'Obst & Gemüse', unit: 'g', nettoPrice: 1.19, priceSize: 1000, priceUnit: 'g' },
    { id: 'ing-haehnchen', name: 'Hähnchenbrustfilet', category: 'Fleisch & Fisch', unit: 'g', nettoPrice: 5.99, priceSize: 600, priceUnit: 'g' },
    { id: 'ing-paprika', name: 'Paprika (Mix)', category: 'Obst & Gemüse', unit: 'Stück', nettoPrice: 1.99, priceSize: 3, priceUnit: 'Stück' },
    { id: 'ing-zucchini', name: 'Zucchini', category: 'Obst & Gemüse', unit: 'Stück', nettoPrice: 0.79, priceSize: 1, priceUnit: 'Stück' },
    { id: 'ing-reis', name: 'Basmati Reis', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 2.29, priceSize: 1000, priceUnit: 'g' },
    { id: 'ing-kartoffeln', name: 'Kartoffeln vorw. festk.', category: 'Obst & Gemüse', unit: 'g', nettoPrice: 2.99, priceSize: 2500, priceUnit: 'g' },
    { id: 'ing-sahne', name: 'Kochsahne 15%', category: 'Kühlregal & Milch', unit: 'ml', nettoPrice: 0.99, priceSize: 200, priceUnit: 'ml' },
    { id: 'ing-gouda', name: 'Gouda gerieben', category: 'Kühlregal & Milch', unit: 'g', nettoPrice: 1.79, priceSize: 200, priceUnit: 'g' },
    { id: 'ing-milch', name: 'Vollmilch 3.5%', category: 'Kühlregal & Milch', unit: 'ml', nettoPrice: 0.99, priceSize: 1000, priceUnit: 'ml' },
    { id: 'ing-eier', name: 'Frische Eier (Bodenhaltung)', category: 'Kühlregal & Milch', unit: 'Stück', nettoPrice: 1.99, priceSize: 10, priceUnit: 'Stück' },
    { id: 'ing-mehl', name: 'Weizenmehl Type 405', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 0.79, priceSize: 1000, priceUnit: 'g' },
    { id: 'ing-apfelmus', name: 'Apfelmus', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 1.19, priceSize: 720, priceUnit: 'g' },
    { id: 'ing-kidneybohnen', name: 'Kidneybohnen Dose', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 0.89, priceSize: 400, priceUnit: 'g' },
    { id: 'ing-mais', name: 'Mais Dose', category: 'Trockenwaren & Teigwaren', unit: 'g', nettoPrice: 0.89, priceSize: 340, priceUnit: 'g' },
    { id: 'ing-porree', name: 'Porree / Lauch', category: 'Obst & Gemüse', unit: 'Stange', nettoPrice: 0.99, priceSize: 1, priceUnit: 'Stange' },
    { id: 'ing-schmelzkaese', name: 'Schmelzkäse Kräuter', category: 'Kühlregal & Milch', unit: 'g', nettoPrice: 1.49, priceSize: 200, priceUnit: 'g' },
    { id: 'ing-gemuesebruehe', name: 'Gemüsebrühe', category: 'Gewürze & Saucen', unit: 'g', nettoPrice: 1.29, priceSize: 150, priceUnit: 'g' },
    { id: 'ing-wiener', name: 'Wiener Würstchen', category: 'Fleisch & Fisch', unit: 'Stück', nettoPrice: 3.29, priceSize: 6, priceUnit: 'Stück' },
    { id: 'ing-linsen-dose', name: 'Linseneintopf mit Gemüse', category: 'Trockenwaren & Teigwaren', unit: 'Dose', nettoPrice: 1.89, priceSize: 1, priceUnit: 'Dose' },
    { id: 'ing-gurke', name: 'Salatgurke', category: 'Obst & Gemüse', unit: 'Stück', nettoPrice: 0.89, priceSize: 1, priceUnit: 'Stück' },
    { id: 'ing-tomaten-frisch', name: 'Rispentomaten', category: 'Obst & Gemüse', unit: 'g', nettoPrice: 1.49, priceSize: 500, priceUnit: 'g' },
    { id: 'ing-salat', name: 'Kopfsalat / Eissalat', category: 'Obst & Gemüse', unit: 'Kopf', nettoPrice: 1.19, priceSize: 1, priceUnit: 'Kopf' },
    { id: 'ing-dressing', name: 'Salatdressing Joghurt/Kräuter', category: 'Gewürze & Saucen', unit: 'ml', nettoPrice: 1.29, priceSize: 250, priceUnit: 'ml' },
    { id: 'ing-pizza-tk', name: 'Steinofenpizza Salami / Margherita', category: 'Kühlregal & Milch', unit: 'Packung', nettoPrice: 3.49, priceSize: 1, priceUnit: 'Packung' },
    { id: 'ing-butter', name: 'Deutsche Markenbutter', category: 'Kühlregal & Milch', unit: 'g', nettoPrice: 1.89, priceSize: 250, priceUnit: 'g' },
    { id: 'ing-olivenoel', name: 'Brat- & Olivenöl', category: 'Gewürze & Saucen', unit: 'ml', nettoPrice: 4.99, priceSize: 500, priceUnit: 'ml' },
  ];

  for (const ing of ingredientsData) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {
        name: ing.name,
        category: ing.category,
        standardUnit: ing.unit,
      },
      create: {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        standardUnit: ing.unit,
      },
    });

    await prisma.ingredientPrice.upsert({
      where: {
        ingredientId_supermarketId: {
          ingredientId: ing.id,
          supermarketId: netto.id,
        },
      },
      update: {
        pricePerUnit: ing.nettoPrice,
        unitSize: ing.priceSize,
        unit: ing.priceUnit,
      },
      create: {
        ingredientId: ing.id,
        supermarketId: netto.id,
        pricePerUnit: ing.nettoPrice,
        unitSize: ing.priceSize,
        unit: ing.priceUnit,
      },
    });
  }

  console.log('✅ Initialer Stammdaten-Katalog erfolgreich vorbereitet:');
  console.log(`- 4 Supermärkte (Netto, Rewe, Aldi Nord, Lidl)`);
  console.log(`- ${ingredientsData.length} Zutaten mit Netto-Richtpreisen`);
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
