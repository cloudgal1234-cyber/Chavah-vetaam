import { prisma } from './prisma';

let initialized = false;

const DEFAULT_MENU = [
  { name: 'אספרסו', description: 'אספרסו כפול עשיר', price: 12, emoji: '☕', category: 'משקאות חמים', sortOrder: 1, ingredients: ['קפה', 'מים'] },
  { name: 'קפוצ׹ינו', description: 'קפוצ׹ינו עם חלב מוקצף', price: 16, emoji: '☕', category: 'משקאות חמים', sortOrder: 2, ingredients: ['קפה', 'חלב', 'קצף חלב'] },
  { name: 'לאטה', description: 'לאטה עם שכבת קצף', price: 17, emoji: '🥛', category: 'משקאות חמים', sortOrder: 3, ingredients: ['קפה', 'חלב מוקצף', 'קצף'] },
  { name: 'תה נענע', description: 'נענע טרייה מהחווה', price: 10, emoji: '🌿', category: 'משקאות חמים', sortOrder: 4, ingredients: ['נענע טרייה', 'מים', 'סוכר'] },
  { name: 'קפה פילטר', description: 'קפה מסונן בשיטת קולד-ברו', price: 14, emoji: '🧊', category: 'משקאות קרים', sortOrder: 5, ingredients: ['קפה', 'מים קרים', 'קרח'] },
  { name: 'לימונדה', description: 'לימונדה ביתית קרה', price: 14, emoji: '🍋', category: 'משקאות קרים', sortOrder: 6, ingredients: ['לימון', 'מים', 'סוכר', 'קרח'] },
  { name: 'מיץ תפוזים', description: 'מיץ תפוזים סחוט טרי', price: 16, emoji: '🍊', category: 'משקאות קרים', sortOrder: 7, ingredients: ['תפוזים טריים'] },
  { name: 'עוגת גזר', description: 'עוגת גזר ביתית עם ציפוי', price: 18, emoji: '🥕', category: 'מאפים וממתקים', sortOrder: 8, ingredients: ['גזר', 'קמח', 'סוכר', 'ביצים', 'שמן', 'ציפוי גבינה'] },
  { name: 'מאפה גבינה', description: 'מאפה גבינה חם מהתנור', price: 16, emoji: '🧀', category: 'מאפים וממתקים', sortOrder: 9, ingredients: ['גבינה', 'בצק', 'ביצים', 'מלח'] },
  { name: 'קרואסון חמאה', description: 'קרואסון פריך וטרי', price: 14, emoji: '🥐', category: 'מאפים וממתקים', sortOrder: 10, ingredients: ['קמח', 'חמאה', 'שמרים', 'מלח', 'סוכר'] },
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
        ingredients JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE coffee_menu_items ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'
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
    } else {
      // Update existing items that have no ingredients
      for (const item of DEFAULT_MENU) {
        await prisma.$executeRawUnsafe(
          `UPDATE coffee_menu_items SET ingredients = $1::jsonb WHERE name = $2 AND (ingredients IS NULL OR ingredients = '[]'::jsonb)`,
          JSON.stringify(item.ingredients),
          item.name,
        );
      }
    }

    initialized = true;
  } catch (err) {
    console.error('[farm-db-init] Error:', err);
  }
}
