import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['HYSA', 'CHECKING', 'SAVINGS']).default('HYSA'),
  institution: z.string().default(''),
  rate: z.number().min(0).max(1).default(0),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid', details: parsed.error.flatten() }, { status: 400 });

  const account = await prisma.savingsAccount.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
      type: parsed.data.type,
      institution: parsed.data.institution,
      rate: parsed.data.rate,
    },
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
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const { id, ...fields } = parsed.data;

  const existing = await prisma.savingsAccount.findUnique({ where: { id } });
  if (!existing || existing.householdId !== session.householdId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const account = await prisma.savingsAccount.update({ where: { id }, data: fields });
  return NextResponse.json({ account });
}
