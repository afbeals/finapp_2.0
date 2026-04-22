import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/auth';

const schema = z.object({
  pin: z.string().min(1),
  memberId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { pin, memberId } = parsed.data;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { household: true },
  });

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(pin, member.household.pinHash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  await createSession(member.id, member.householdId);

  return NextResponse.json({
    memberId: member.id,
    memberName: member.name,
    memberColor: member.color,
    householdId: member.householdId,
    householdName: member.household.name,
  });
}
