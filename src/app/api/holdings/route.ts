import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  accountId: z.number().int().positive(),
  ticker: z.string().min(1).max(10),
  name: z.string().min(1),
  category: z.string().default(''),
  purchaseDate: z.string(), // ISO date string
  pricePerShare: z.number().int().nonnegative(), // cents
  shares: z.number().positive(),
});

// POST — add a new purchase lot
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.investmentAccount.findUnique({ where: { id: parsed.data.accountId } });
  if (!account || account.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const purchase = await prisma.purchase.create({
    data: {
      ...parsed.data,
      ticker: parsed.data.ticker.toUpperCase(),
      purchaseDate: new Date(parsed.data.purchaseDate),
    },
  });

  return NextResponse.json({ purchase }, { status: 201 });
}
