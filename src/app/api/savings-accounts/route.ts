import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, requireHouseholdResource, badRequest } from '@/lib/apiGuards';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['HYSA', 'CHECKING', 'SAVINGS']).default('HYSA'),
  institution: z.string().default(''),
  rate: z.number().min(0).max(1).default(0),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid', parsed.error.flatten());

  const account = await prisma.savingsAccount.create({
    data: { householdId: session.householdId, ...parsed.data },
  });
  return NextResponse.json({ account }, { status: 201 });
}

const updateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  institution: z.string().optional(),
  rate: z.number().min(0).max(1).optional(),
  goal: z.number().int().min(0).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAuth().catch(() => null);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return badRequest('Invalid');

  const { id, ...fields } = parsed.data;
  const result = await requireHouseholdResource(
    (id) => prisma.savingsAccount.findUnique({ where: { id } }),
    id,
  ).catch(() => null);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const account = await prisma.savingsAccount.update({ where: { id }, data: fields });
  return NextResponse.json({ account });
}
