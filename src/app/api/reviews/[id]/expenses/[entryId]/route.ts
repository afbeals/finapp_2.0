import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, badRequest } from '@/lib/apiGuards';

type Params = { params: Promise<{ id: string; entryId: string }> };

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  notes: z.string().optional(),
  amount: z.number().int().positive().optional(),
});

async function getEntryOrNull(session: Awaited<ReturnType<typeof requireAuth>>, id: string, entryId: string) {
  const entry = await prisma.expenseEntry.findUnique({ where: { id: Number(entryId) }, include: { review: true } });
  if (!entry || entry.review.householdId !== session.householdId || entry.reviewId !== Number(id)) return null;
  return entry;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, entryId } = await params;
  const entry = await getEntryOrNull(session, id, entryId);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid request');

  const updated = await prisma.expenseEntry.update({ where: { id: Number(entryId) }, data: parsed.data });
  return NextResponse.json({ entry: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, entryId } = await params;
  const entry = await getEntryOrNull(session, id, entryId);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.expenseEntry.delete({ where: { id: Number(entryId) } });
  return NextResponse.json({ ok: true });
}
