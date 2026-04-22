import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [loans, snapshots] = await Promise.all([
    prisma.loan.findMany({ where: { householdId: session.householdId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    prisma.loanSnapshot.findMany({ where: { reviewId: Number(id) } }),
  ]);

  return NextResponse.json({ loans, snapshots });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const schema = z.object({
    loanId: z.number().int().positive(),
    balance: z.number().int().optional(),
    paymentsMade: z.number().int().optional(),
    interestPaid: z.number().int().optional(),
    extraPayment: z.number().int().optional(),
    paymentAmount: z.number().int().optional(),
    principalAmount: z.number().int().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const { loanId, ...fields } = parsed.data;
  const snapshot = await prisma.loanSnapshot.upsert({
    where: { loanId_reviewId: { loanId, reviewId: Number(id) } },
    create: { loanId, reviewId: Number(id), balance: 0, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0, ...fields },
    update: fields,
  });

  return NextResponse.json({ snapshot });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id: Number(id) } });
  if (!review || review.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const schema = z.array(z.object({
    loanId: z.number().int().positive(),
    balance: z.number().int(),
    paymentsMade: z.number().int(),
    interestPaid: z.number().int(),
    extraPayment: z.number().int().default(0),
  }));
  const parsed = schema.safeParse(body?.snapshots);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const snapshots = await Promise.all(
    parsed.data.map((s) =>
      prisma.loanSnapshot.upsert({
        where: { loanId_reviewId: { loanId: s.loanId, reviewId: Number(id) } },
        create: { ...s, reviewId: Number(id) },
        update: { balance: s.balance, paymentsMade: s.paymentsMade, interestPaid: s.interestPaid, extraPayment: s.extraPayment },
      })
    )
  );

  return NextResponse.json({ snapshots });
}
