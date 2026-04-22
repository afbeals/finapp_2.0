import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireReviewAccess, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const loans = await prisma.loan.findMany({
    where: { householdId: result.session.householdId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: {
      loanSnapshots: {
        where: { reviewId: Number(id) },
      },
    },
  });

  const snapshots = loans.flatMap((l) => l.loanSnapshots);
  const loansWithout = loans.map(({ loanSnapshots: _, ...rest }) => rest);
  return NextResponse.json({ loans: loansWithout, snapshots });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
  if (!parsed.success) return badRequest('Invalid');

  const { loanId, ...fields } = parsed.data;
  const snapshot = await prisma.loanSnapshot.upsert({
    where: { loanId_reviewId: { loanId, reviewId: Number(id) } },
    create: { loanId, reviewId: Number(id), balance: 0, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0, ...fields },
    update: fields,
  });
  return NextResponse.json({ snapshot });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const result = await requireReviewAccess(Number(id)).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const schema = z.array(z.object({
    loanId: z.number().int().positive(),
    balance: z.number().int(),
    paymentsMade: z.number().int(),
    interestPaid: z.number().int(),
    extraPayment: z.number().int().default(0),
  }));
  const parsed = schema.safeParse(body?.snapshots);
  if (!parsed.success) return badRequest('Invalid');

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
