import { list } from '@vercel/blob';
import type { CachedStockEntry } from '@/lib/types/stock';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase();

  try {
    const { blobs } = await list({ prefix: 'stocks/', limit: 100 });

    if (symbol) {
      const blob = blobs.find((b) => b.pathname === `stocks/${symbol}.json`);
      if (!blob) {
        return Response.json({ error: `No cached data for ${symbol}` }, { status: 404 });
      }
      const res = await fetch(blob.url);
      const data: CachedStockEntry = await res.json();
      return Response.json(data);
    }

    // Return all cached stocks
    const results: CachedStockEntry[] = [];
    for (const blob of blobs) {
      try {
        const res = await fetch(blob.url);
        const data: CachedStockEntry = await res.json();
        results.push(data);
      } catch {
        // Skip blobs that fail to parse
      }
    }

    return Response.json({
      count: results.length,
      stocks: results.map((s) => ({
        symbol: s.symbol,
        price: s.quote.price,
        change: s.quote.change,
        changePercent: s.quote.changePercent,
        lastTradingDay: s.quote.lastTradingDay,
        cachedAt: new Date(s.cachedAt).toISOString(),
        bars: s.bars.length,
      })),
      detail: results,
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to read blob cache', detail: String(err) },
      { status: 500 },
    );
  }
}
