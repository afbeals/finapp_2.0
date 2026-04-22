import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Public endpoint — returns members of the first household for the login screen
export async function GET() {
  const household = await prisma.household.findFirst({
    include: {
      members: {
        select: { id: true, name: true, color: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!household) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 });
  }

  return NextResponse.json({
    householdId: household.id,
    householdName: household.name,
    members: household.members,
  });
}
