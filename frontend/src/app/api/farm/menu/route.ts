import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFarmTablesExist } from '@/lib/farm-db-init';

function checkWorkerAuth(req: NextRequest) {
  const pin = req.headers.get('x-worker-pin');
  const expected = process.env.WORKER_PIN ?? '1234';
  return pin === expected;
}

export async function GET() {
  await ensureFarmTablesExist();
  const items = await prisma.coffeeMenuItem.findMany({
    where: { available: true },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  if (!checkWorkerAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureFarmTablesExist();
  const body = await req.json();
  const item = await prisma.coffeeMenuItem.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price),
      emoji: body.emoji ?? '☕',
      category: body.category ?? 'משקאות',
      sortOrder: body.sortOrder ?? 0,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      milkOptions: Array.isArray(body.milkOptions) ? body.milkOptions : [],
    },
  });
  return NextResponse.json(item, { status: 201 });
}
