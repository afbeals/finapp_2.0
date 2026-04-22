import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const members = await prisma.member.findMany({
    where: { householdId: session.householdId },
    select: { id: true, name: true, color: true, email: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ members });
}

const createSchema = z.object({
  name: z.string().min(1).max(64),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });

  const member = await prisma.member.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
      color: parsed.data.color,
      email: parsed.data.email ?? undefined,
    },
    select: { id: true, name: true, color: true, email: true },
  });

  return NextResponse.json({ member }, { status: 201 });
}
