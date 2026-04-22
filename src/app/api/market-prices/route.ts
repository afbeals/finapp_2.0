import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Proxy Yahoo Finance v8 chart endpoint — no API key required.
// Returns { prices: Record<ticker, priceInCents>, errors: string[] }
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const tickersParam = url.searchParams.get('tickers') ?? '';
  const tickers = tickersParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json({ prices: {}, errors: [] });
  }

  const prices: Record<string, number> = {};
  const names: Record<string, string> = {};
  const errors: string[] = [];

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              Accept: 'application/json',
            },
            next: { revalidate: 300 }, // cache 5 min
          }
        );
        if (!res.ok) {
          errors.push(`${ticker}: HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        const result = data?.chart?.result?.[0];
        // Prefer regularMarketPrice from meta, fall back to last close
        const price: number | undefined =
          result?.meta?.regularMarketPrice ??
          result?.meta?.previousClose;
        if (typeof price === 'number' && price > 0) {
          prices[ticker] = Math.round(price * 100); // store as cents
        } else {
          errors.push(`${ticker}: price not found`);
        }
        const rawName = result?.meta?.longName ?? result?.meta?.shortName;
        if (rawName) names[ticker] = rawName;
      } catch (e) {
        errors.push(`${ticker}: ${String(e)}`);
      }
    })
  );

  return NextResponse.json({ prices, names, errors });
}
