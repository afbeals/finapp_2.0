// ─── Server-side API route guards ────────────────────────────────────────────
// Centralises the auth + householdId ownership check that was copy-pasted into
// every route file. All 28 routes import from here instead.

import { NextResponse } from 'next/server';
import { getSession, type SessionData } from './auth';
import { prisma } from './db';
import type { Review } from '@prisma/client';

// ─── Error types ──────────────────────────────────────────────────────────────

class RouteError extends Error {
  response: NextResponse;
  constructor(response: NextResponse) {
    super('RouteError');
    this.response = response;
  }
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function notFound(msg = 'Not found'): NextResponse {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function badRequest(msg = 'Invalid request', issues?: unknown): NextResponse {
  return NextResponse.json({ error: msg, ...(issues ? { issues } : {}) }, { status: 400 });
}

export function conflict(payload: Record<string, unknown>): NextResponse {
  return NextResponse.json(payload, { status: 409 });
}

// ─── Guards ───────────────────────────────────────────────────────────────────

/** Require a valid session. Returns SessionData or throws a RouteError. */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) throw new RouteError(unauthorized());
  return session;
}

/** Require a valid session AND that the review belongs to the household. */
export async function requireReviewAccess(reviewId: number): Promise<{ session: SessionData; review: Review }> {
  const session = await requireAuth();
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.householdId !== session.householdId) throw new RouteError(notFound());
  return { session, review };
}

/** Require auth and that a generic resource belongs to the household.
 *  @param loader   async function that fetches the record by id
 *  @param id       the record id
 *  @param hKey     the householdId field name on the record (default: 'householdId')
 */
export async function requireHouseholdResource<T extends Record<string, unknown>>(
  loader: (id: number) => Promise<T | null>,
  id: number,
  hKey = 'householdId',
): Promise<{ session: SessionData; resource: T }> {
  const session = await requireAuth();
  const resource = await loader(id);
  if (!resource || resource[hKey] !== session.householdId) throw new RouteError(notFound());
  return { session, resource };
}

// ─── withGuards wrapper ───────────────────────────────────────────────────────
// Catches RouteError and returns its response; re-throws anything else.
// Usage:
//   export const GET = withGuards(async ({ session, review }) => { ... });

export function withGuards<TArgs, TReturn>(
  handler: (args: TArgs) => Promise<TReturn>,
): (args: TArgs) => Promise<TReturn | NextResponse> {
  return async (args: TArgs) => {
    try {
      return await handler(args);
    } catch (e) {
      if (e instanceof RouteError) return e.response;
      throw e;
    }
  };
}
