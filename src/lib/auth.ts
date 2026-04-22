import { cookies } from 'next/headers';
import { prisma } from './db';

const SESSION_COOKIE = 'fr_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  memberId: number;
  memberName: string;
  memberColor: string;
  householdId: number;
  householdName: string;
  token: string;
}

/** Generate a cryptographically random session token */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Create a session for the given member and write cookie */
export async function createSession(memberId: number, householdId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // Remove old sessions for this member
  await prisma.session.deleteMany({ where: { memberId } });

  await prisma.session.create({
    data: { memberId, householdId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

/** Read the current session from cookie + DB */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      member: {
        include: { household: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { token } });
    return null;
  }

  return {
    memberId: session.memberId,
    memberName: session.member.name,
    memberColor: session.member.color,
    householdId: session.householdId,
    householdName: session.member.household.name,
    token,
  };
}

/** Destroy the current session */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}
