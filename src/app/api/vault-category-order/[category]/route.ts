import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, unauthorized, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ category: string }> };

const patchSchema = z.object({
  groupOrder: z.number().int().positive(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAuth().catch(() => null);
  if (!session) return unauthorized();

  const { category } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request', parsed.error.issues);

  const order = await prisma.vaultCategoryOrder.upsert({
    where: { householdId_category: { householdId: session.householdId, category } },
    create: { householdId: session.householdId, category, groupOrder: parsed.data.groupOrder },
    update: { groupOrder: parsed.data.groupOrder },
  });
  return NextResponse.json({ order });
}
