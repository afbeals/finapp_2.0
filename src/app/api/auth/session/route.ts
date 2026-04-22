import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ session: null });
  }

  // Also return full member list so the client can populate the switcher
  const members = await prisma.member.findMany({
    where: { householdId: session.householdId },
    select: { id: true, name: true, color: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ session, members });
}
