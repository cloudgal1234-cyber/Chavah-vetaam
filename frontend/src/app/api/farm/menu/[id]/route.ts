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

  const item = await prisma.coffeeMenuItem.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.emoji !== undefined && { emoji: body.emoji }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.available !== undefined && { available: body.available }),
      ...(body.ingredients !== undefined && { ingredients: body.ingredients }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkWorkerAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = parseInt(params.id);
  await prisma.coffeeMenuItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
