import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function checkWorkerAuth(req: NextRequest) {
  const pin = req.headers.get('x-worker-pin');
  const expected = process.env.WORKER_PIN ?? '1234';
  return pin === expected;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkWorkerAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = parseInt(params.id);
  const body = await req.json();

  await prisma.coffeeOrder.update({
    where: { id },
    data: { status: body.status ?? 'done' },
  });

  return NextResponse.json({ success: true });
}
