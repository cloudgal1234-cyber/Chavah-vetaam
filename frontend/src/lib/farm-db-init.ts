import { prisma } from './prisma';

let initialized = false;

const DEFAULT_MENU = [
  { name: 'אספרסו', description: 'אספרסו כפול עשיר', price: 12, emoji: '☕', category: 'משקאות חמים', sortOrder: 1 },
  { name: 'קפוצ׳ינו', description: 'קפוצ׳ינו עם חלב מוקצף', price: 16, emoji: '☕', category: 'משקאות חמים', sortOrder: 2 },
  { name: 'לאטה', description: 'לאטה עם שכבת קצף', price: 17, emoji: '🥛', category: 'משקאות חמים', sortOrder: 3 },
  { name: 'תה נענע', description: 'נענע טרייה מהחווה', price: 10, emoji: '🌿', category: 'משקאות חמים', sortOrder: 4 },
  { name: 'קפה פילטר', description: 'קפה מסונן בשיטת קולד-ברו', price: 14, emoji: '🧊', category: 'משקאות קרים', sortOrder: 5 },
  { name: 'לימונדה', description: 'לימונדה ביתית קרה', price: 14, emoji: '🍋', category: 'משקאות קרים', sortOrder: 6 },
  { name: 'מיץ תפוזים', description: 'מיץ תפוזים סחוט טרי', price: 16, emoji: '🍊', category: 'משקאות קרים', sortOrder: 7 },
  { name: 'עוגת גזר', description: 'עוגת גזר ביתית עם ציפוי', price: 18, emoji: '🥕', category: 'מאפים וממתקים', sortOrder: 8 },
  { name: 'מאפה גבינה', description: 'מאפה גבינה חם מהתנור', price: 16, emoji: '🧀', category: 'מאפים וממתקים', sortOrder: 9 },
  { name: 'קרואסון חמאה', description: 'קרואסון פריך וטרי', price: 14, emoji: '🥐', category: 'מאפים וממתקים', sortOrder: 10 },
];

export async function ensureFarmTablesExist() {
  if (initialized) return;

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS coffee_menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DOUBLE PRECISION NOT NULL,
        emoji TEXT NOT NULL DEFAULT '☕',
        category TEXT NOT NULL DEFAULT 'משקאות',
        available BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS coffee_orders (
        id SERIAL PRIMARY KEY,
        "orderNumber" TEXT NOT NULL UNIQUE,
        "customerName" TEXT NOT NULL,
        "tableNote" TEXT,
        items JSONB NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const count = await prisma.coffeeMenuItem.count();
    if (count === 0) {
      await prisma.coffeeMenuItem.createMany({ data: DEFAULT_MENU });
    }

    initialized = true;
  } catch (err) {
    console.error('[farm-db-init] Error:', err);
  }
}
