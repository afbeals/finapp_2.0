import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(1).max(64).optional(),
  icon: z.string().max(4).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const existing = await prisma.expenseCategory.findUnique({ where: { id: Number(id) } });
  if (!existing || existing.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.expenseCategory.update({
    where: { id: Number(id) },
    data: parsed.data,
  });

  return NextResponse.json({ category: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.expenseCategory.findUnique({ where: { id: Number(id) } });
  if (!existing || existing.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.expenseCategory.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
