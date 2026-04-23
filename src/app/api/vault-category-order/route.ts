import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, unauthorized } from '@/lib/apiGuards';

export async function GET() {
  const session = await requireAuth().catch(() => null);
  if (!session) return unauthorized();

  const orders = await prisma.vaultCategoryOrder.findMany({
    where: { householdId: session.householdId },
  });
  return NextResponse.json({ orders });
}
