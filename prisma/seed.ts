import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getWeekNumber(d: Date): [number, number] {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [date.getUTCFullYear(), weekNo];
}

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

  // 2. Standorte anlegen
  const emsdetten = await prisma.location.upsert({
    where: { id: 'location-emsdetten' },
    update: {
      defaultServings: 6,
      defaultSupermarketId: netto.id,
    },
    create: {
      id: 'location-emsdetten',
      name: 'Emsdetten',
      address: 'Münsterstraße 42, 48282 Emsdetten',
      defaultSupermarketId: netto.id,
      defaultServings: 6,
    },
  });

  const steinfurt = await prisma.location.upsert({
    where: { id: 'location-steinfurt' },
    update: {},
    create: {
      id: 'location-steinfurt',
      name: 'Steinfurt',
      address: 'Burgsteinfurter Damm 15, 48565 Steinfurt',
      defaultSupermarketId: rewe.id,
      defaultServings: 4,
    },
  });

  const rheine = await prisma.location.upsert({
    where: { id: 'location-rheine' },
    update: {},
    create: {
      id: 'location-rheine',
      name: 'Rheine',
      address: 'Salzbergener Straße 88, 48431 Rheine',
      defaultSupermarketId: aldi.id,
      defaultServings: 5,
    },
  });

  // 3. Benutzer anlegen (Passwörter gehasht)
  const defaultResidentPw = await bcrypt.hash('emsdetten2026!', 10);
  const adminPw = await bcrypt.hash('admin2026!', 10);
  const betreuerPw = await bcrypt.hash('betreuer2026!', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: adminPw },
    create: {
      username: 'admin',
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash: adminPw,
      avatarColor: '#1e293b',
    },
  });

  await prisma.user.upsert({
    where: { username: 'betreuer' },
    update: { passwordHash: betreuerPw },
    create: {
      username: 'betreuer',
      name: 'Betreuer Team',
      role: 'BETREUER',
      passwordHash: betreuerPw,
      avatarColor: '#0284c7',
    },
  });

  const residentsEmsdetten = [
    { username: 'kevin', name: 'Kevin', color: '#3b82f6' },
    { username: 'dennis', name: 'Dennis', color: '#10b981' },
    { username: 'godfirst', name: 'Godfirst', color: '#f59e0b' },
    { username: 'arne', name: 'Arne', color: '#8b5cf6' },
    { username: 'ertugrul', name: 'Ertugrul', color: '#ec4899' },
    { username: 'udo', name: 'Udo', color: '#06b6d4' },
  ];

  const createdResidents = [];
  for (const res of residentsEmsdetten) {
    const user = await prisma.user.upsert({
      where: { username: res.username },
      update: {
        name: res.name,
        locationId: emsdetten.id,
        avatarColor: res.color,
      },
      create: {
        username: res.username,
        name: res.name,
        role: 'BEWOHNER',
        passwordHash: defaultResidentPw,
        locationId: emsdetten.id,
        avatarColor: res.color,
      },
    });
    createdResidents.push(user);
  }

  // 4. Zutaten und Richtpreise (Netto)
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

  // 5. Rezepte anlegen
  interface SeedRecipe {
    id: string;
    title: string;
    category: string;
    description: string;
    instructions: string;
    defaultServings: number;
    prepTime: number;
    ingredients: { ingId: string; amount: number; unit: string; notes?: string }[];
  }

  const recipesData: SeedRecipe[] = [
    {
      id: 'rec-spaghetti-bolognese',
      title: 'Klassische Spaghetti Bolognese',
      category: 'Pasta',
      description: 'Herzhafte Hackfleischsauce mit passierten Tomaten, Zwiebeln und Kräutern zu al dente gekochten Spaghetti.',
      instructions: '1. Zwiebeln und Knoblauch fein hacken.\n2. Hackfleisch in einem großen Topf mit etwas Öl scharf anbraten.\n3. Zwiebeln und Knoblauch zugeben und kurz mitdünsten.\n4. Passierte Tomaten einrühren, mit Salz, Pfeffer und Kräutern würzen und 20 Min köcheln lassen.\n5. Spaghetti in reichlich Salzwasser kochen, abgießen und mit der Sauce servieren.',
      defaultServings: 4,
      prepTime: 35,
      ingredients: [
        { ingId: 'ing-hack', amount: 500, unit: 'g' },
        { ingId: 'ing-spaghetti', amount: 500, unit: 'g' },
        { ingId: 'ing-tomaten-pass', amount: 500, unit: 'g' },
        { ingId: 'ing-zwiebeln', amount: 2, unit: 'Stück' },
        { ingId: 'ing-knoblauch', amount: 2, unit: 'Zehe' },
      ],
    },
    {
      id: 'rec-haehnchen-gemuese',
      title: 'Bunte Hähnchen-Gemüse-Pfanne mit Reis',
      category: 'Geflügel',
      description: 'Zartes Hähnchenbrustfilet mit knackiger Paprika, Zucchini und duftendem Basmatireis.',
      instructions: '1. Reis nach Packungsanweisung gar kochen.\n2. Hähnchenbrust in mundgerechte Stücke schneiden.\n3. Paprika und Zucchini waschen und würfeln.\n4. Fleisch in einer Pfanne rundherum anbraten, Gemüse zugeben und 8 Minuten knackig braten.\n5. Mit Salz, Pfeffer und Paprikapulver abschmecken und mit Reis anrichten.',
      defaultServings: 4,
      prepTime: 30,
      ingredients: [
        { ingId: 'ing-haehnchen', amount: 600, unit: 'g' },
        { ingId: 'ing-paprika', amount: 3, unit: 'Stück' },
        { ingId: 'ing-zucchini', amount: 1, unit: 'Stück' },
        { ingId: 'ing-reis', amount: 400, unit: 'g' },
        { ingId: 'ing-zwiebeln', amount: 1, unit: 'Stück' },
      ],
    },
    {
      id: 'rec-kartoffelgratin',
      title: 'Deftiges Kartoffelgratin mit frischem Beilagensalat',
      category: 'Vegetarisch',
      description: 'Dünn gehobelte Kartoffeln in cremiger Sahnesauce, mit goldgelbem Gouda überbacken, dazu ein knackiger Salat.',
      instructions: '1. Kartoffeln schälen und in dünne Scheiben hobeln.\n2. In eine Auflaufform schichten.\n3. Sahne mit Milch, Salz, Pfeffer und Muskat verrühren und über die Kartoffeln gießen.\n4. Mit Gouda bestreuen und bei 180°C Umluft ca. 40 Min backen.\n5. Salat, Gurke und Tomaten waschen, schneiden und mit Dressing anrichten.',
      defaultServings: 4,
      prepTime: 45,
      ingredients: [
        { ingId: 'ing-kartoffeln', amount: 1000, unit: 'g' },
        { ingId: 'ing-sahne', amount: 250, unit: 'ml' },
        { ingId: 'ing-milch', amount: 150, unit: 'ml' },
        { ingId: 'ing-gouda', amount: 200, unit: 'g' },
        { ingId: 'ing-salat', amount: 1, unit: 'Kopf' },
        { ingId: 'ing-dressing', amount: 100, unit: 'ml' },
      ],
    },
    {
      id: 'rec-chili-con-carne',
      title: 'Schnelles Chili con Carne mit Reis',
      category: 'Fleisch',
      description: 'Deftiges Chili mit Rinderhack, roten Kidneybohnen, Mais und feiner Tomatensauce.',
      instructions: '1. Zwiebeln würfeln und mit dem Hackfleisch scharf anbraten.\n2. Passierte Tomaten, abgetropfte Bohnen und Mais hinzugeben.\n3. Mit Kreuzkümmel, Paprika, Salz und milder Chilipaste 20 Min sanft köcheln.\n4. Parallel Reis kochen und zusammen servieren.',
      defaultServings: 4,
      prepTime: 35,
      ingredients: [
        { ingId: 'ing-hack', amount: 500, unit: 'g' },
        { ingId: 'ing-kidneybohnen', amount: 400, unit: 'g' },
        { ingId: 'ing-mais', amount: 250, unit: 'g' },
        { ingId: 'ing-tomaten-pass', amount: 500, unit: 'g' },
        { ingId: 'ing-reis', amount: 400, unit: 'g' },
        { ingId: 'ing-zwiebeln', amount: 2, unit: 'Stück' },
      ],
    },
    {
      id: 'rec-pfannkuchen',
      title: 'Goldgelbe Pfannkuchen mit Apfelmus',
      category: 'Süßspeise',
      description: 'Fluffige Eierpfannkuchen aus der Pfanne mit fruchtigem Apfelmus.',
      instructions: '1. Mehl, Milch, Eier und eine Prise Salz zu einem glatten Teig verrühren.\n2. Teig 10 Minuten ruhen lassen.\n3. In einer beschichteten Pfanne mit etwas Butter goldgelbe Pfannkuchen von beiden Seiten ausbacken.\n4. Mit reichlich Apfelmus servieren.',
      defaultServings: 4,
      prepTime: 25,
      ingredients: [
        { ingId: 'ing-mehl', amount: 400, unit: 'g' },
        { ingId: 'ing-milch', amount: 500, unit: 'ml' },
        { ingId: 'ing-eier', amount: 4, unit: 'Stück' },
        { ingId: 'ing-butter', amount: 50, unit: 'g' },
        { ingId: 'ing-apfelmus', amount: 500, unit: 'g' },
      ],
    },
    {
      id: 'rec-kaese-lauch-suppe',
      title: 'Käse-Lauch-Suppe mit Hackfleisch',
      category: 'Eintopf',
      description: 'Wärmender Klassiker: Hackfleisch mit feinem Porree und schmelzendem Kräuterkäse.',
      instructions: '1. Lauch gründlich waschen und in Ringe schneiden.\n2. Hackfleisch kräftig anbraten.\n3. Lauch zugeben und 5 Min mitbraten.\n4. Mit 800ml Gemüsebrühe ablöschen und 15 Min köcheln lassen.\n5. Schmelzkäse und Kochsahne einrühren, bis alles sämig ist.',
      defaultServings: 4,
      prepTime: 30,
      ingredients: [
        { ingId: 'ing-hack', amount: 500, unit: 'g' },
        { ingId: 'ing-porree', amount: 2, unit: 'Stange' },
        { ingId: 'ing-schmelzkaese', amount: 200, unit: 'g' },
        { ingId: 'ing-sahne', amount: 200, unit: 'ml' },
        { ingId: 'ing-gemuesebruehe', amount: 30, unit: 'g' },
      ],
    },
    {
      id: 'rec-pizza-gemuese',
      title: 'Ofenfrische Pizza mit gemischtem Salat',
      category: 'Schnelle Küche',
      description: 'Knusprige Pizza nach Wunsch belegt, serviert mit knackigem Gurken-Tomaten-Salat.',
      instructions: '1. Backofen auf 220°C Ober-/Unterhitze vorheizen.\n2. Pizzen auf Backbleche legen und 12-14 Min goldbraun backen.\n3. Gurke, Tomaten und Salat schneiden und mit Dressing vermengen.',
      defaultServings: 4,
      prepTime: 20,
      ingredients: [
        { ingId: 'ing-pizza-tk', amount: 2, unit: 'Packung' },
        { ingId: 'ing-gurke', amount: 1, unit: 'Stück' },
        { ingId: 'ing-tomaten-frisch', amount: 400, unit: 'g' },
        { ingId: 'ing-salat', amount: 1, unit: 'Kopf' },
        { ingId: 'ing-dressing', amount: 100, unit: 'ml' },
      ],
    },
    {
      id: 'rec-linseneintopf',
      title: 'Klassischer Linseneintopf mit Wiener Würstchen',
      category: 'Eintopf',
      description: 'Schnell, nahrhaft und lecker: Herzhafter Linseneintopf mit knackigen Würstchen.',
      instructions: '1. Linseneintopf in einen großen Topf geben und langsam erwärmen.\n2. Wiener Würstchen in Scheiben schneiden und dazugeben.\n3. Möhren raspeln oder würfeln und kurz mitgaren.\n4. Nach Geschmack mit einem Spritzer Essig verfeinern.',
      defaultServings: 4,
      prepTime: 20,
      ingredients: [
        { ingId: 'ing-linsen-dose', amount: 3, unit: 'Dose' },
        { ingId: 'ing-wiener', amount: 6, unit: 'Stück' },
        { ingId: 'ing-moehren', amount: 300, unit: 'g' },
      ],
    },
  ];

  for (const rec of recipesData) {
    const createdRecipe = await prisma.recipe.upsert({
      where: { id: rec.id },
      update: {
        title: rec.title,
        category: rec.category,
        description: rec.description,
        instructions: rec.instructions,
        defaultServings: rec.defaultServings,
        prepTimeMinutes: rec.prepTime,
      },
      create: {
        id: rec.id,
        title: rec.title,
        category: rec.category,
        description: rec.description,
        instructions: rec.instructions,
        defaultServings: rec.defaultServings,
        prepTimeMinutes: rec.prepTime,
      },
    });

    // Clean up old ingredients and re-insert
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: createdRecipe.id } });
    for (const item of rec.ingredients) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: createdRecipe.id,
          ingredientId: item.ingId,
          amount: item.amount,
          unit: item.unit,
          notes: item.notes,
        },
      });
    }
  }

  // 6. Initialer Wochenplan für Emsdetten (Aktuelle Kalenderwoche)
  const [currentYear, currentWeek] = getWeekNumber(new Date());

  const mealPlan = await prisma.mealPlan.upsert({
    where: {
      locationId_year_weekNumber: {
        locationId: emsdetten.id,
        year: currentYear,
        weekNumber: currentWeek,
      },
    },
    update: {},
    create: {
      locationId: emsdetten.id,
      year: currentYear,
      weekNumber: currentWeek,
      notes: `Gemeinsamer Wochenplan Wohngruppe Emsdetten - KW ${currentWeek}`,
    },
  });

  const weekSchedule = [
    { day: 1, recipeId: 'rec-spaghetti-bolognese', cookId: createdResidents[0]?.id }, // Mo: Kevin
    { day: 2, recipeId: 'rec-haehnchen-gemuese', cookId: createdResidents[1]?.id },   // Di: Dennis
    { day: 3, recipeId: 'rec-kartoffelgratin', cookId: createdResidents[2]?.id },     // Mi: Godfirst
    { day: 4, recipeId: 'rec-chili-con-carne', cookId: createdResidents[3]?.id },     // Do: Arne
    { day: 5, recipeId: 'rec-pizza-gemuese', cookId: createdResidents[4]?.id },       // Fr: Ertugrul
    { day: 6, recipeId: 'rec-linseneintopf', cookId: createdResidents[5]?.id },       // Sa: Udo
    { day: 7, recipeId: 'rec-pfannkuchen', cookId: null },                            // So: Betreuer/Gemeinsam
  ];

  for (const dayItem of weekSchedule) {
    await prisma.mealPlanDay.upsert({
      where: {
        mealPlanId_dayOfWeek: {
          mealPlanId: mealPlan.id,
          dayOfWeek: dayItem.day,
        },
      },
      update: {
        recipeId: dayItem.recipeId,
        servings: 6,
        cookUserId: dayItem.cookId,
      },
      create: {
        mealPlanId: mealPlan.id,
        dayOfWeek: dayItem.day,
        recipeId: dayItem.recipeId,
        servings: 6,
        cookUserId: dayItem.cookId,
      },
    });
  }

  // 7. Beispiel-Betreuernotizen für Emsdetten
  await prisma.caregiverNote.createMany({
    data: [
      {
        locationId: emsdetten.id,
        residentId: createdResidents[0].id,
        title: 'Zahnarzt-Kontrolltermin',
        content: 'Kevin hat am kommenden Dienstag um 14:30 Uhr Kontrolltermin in Emsdetten. Fahrdienst oder Begleitung benötigt.',
        status: 'OPEN',
      },
      {
        locationId: emsdetten.id,
        residentId: createdResidents[1].id,
        title: 'Sportkleidung für Freitag',
        content: 'Dennis braucht Unterstützung beim Waschen der Sporttasche vor dem Wochenendkurs.',
        status: 'IN_PROGRESS',
      },
      {
        locationId: emsdetten.id,
        residentId: createdResidents[5].id,
        title: 'Neue Hausschuhe',
        content: 'Udos Hausschuhe sind defekt (Größe 44). Beim nächsten Stadteinkauf bitte berücksichtigen.',
        status: 'OPEN',
      },
    ],
  });

  // 8. Beispiel-Abfalltermine für Emsdetten
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  await prisma.wastePickup.createMany({
    data: [
      { locationId: emsdetten.id, date: formatDate(1), wasteType: 'YELLOW', notes: 'Wertstoffsack / Gelbe Tonne ab 6:00 Uhr an die Straße' },
      { locationId: emsdetten.id, date: formatDate(4), wasteType: 'BIO', notes: 'Biotonne (grün)' },
      { locationId: emsdetten.id, date: formatDate(9), wasteType: 'REST', notes: 'Restmülltonne (schwarz)' },
      { locationId: emsdetten.id, date: formatDate(15), wasteType: 'PAPER', notes: 'Papiertonne (blau)' },
    ],
  });

  console.log('✅ Seeding erfolgreich abgeschlossen:');
  console.log(`- Standort: Emsdetten mit 6 Bewohnern (Kevin, Dennis, Godfirst, Arne, Ertugrul, Udo)`);
  console.log(`- Standorte Steinfurt & Rheine vorbereitet`);
  console.log(`- 4 Supermärkte, ${ingredientsData.length} Zutaten und Netto-Richtpreise`);
  console.log(`- ${recipesData.length} Rezepte und aktiver Wochenplan KW ${currentWeek}`);
}

main()
  .catch((e) => {
    console.error('Fehler beim Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
