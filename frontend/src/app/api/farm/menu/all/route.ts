import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFarmTablesExist } from '@/lib/farm-db-init';

function checkWorkerAuth(req: NextRequest) {
  const pin = req.headers.get('x-worker-pin');
  const expected = process.env.WORKER_PIN ?? '1234';
  return pin === expected;
}

export async function GET(req: NextRequest) {
  if (!checkWorkerAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureFarmTablesExist();
  const items = await prisma.coffeeMenuItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  });
  return NextResponse.json(items);
}
