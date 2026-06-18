import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFarmTablesExist } from '@/lib/farm-db-init';

function checkWorkerAuth(req: NextRequest) {
  const pin = req.headers.get('x-worker-pin');
  const expected = process.env.WORKER_PIN ?? '1234';
  return pin === expected;
}

function generateOrderNumber() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5).replace(':', '');
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${hhmm}-${rand}`;
}

export async function GET(req: NextRequest) {
  if (!checkWorkerAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await ensureFarmTablesExist();
  const orders = await prisma.coffeeOrder.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  await ensureFarmTablesExist();
  const body = await req.json();

  if (!body.customerName || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const total = body.items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0,
  );

  const order = await prisma.coffeeOrder.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: body.customerName.trim(),
      tableNote: body.tableNote ?? null,
      items: body.items,
      total,
      status: 'pending',
    },
  });

  return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber }, { status: 201 });
}
