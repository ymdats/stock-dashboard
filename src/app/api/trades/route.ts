import { list, put } from '@vercel/blob';
import type { TradeStore } from '@/lib/types/trade';

const BLOB_PATH = 'trades/trades.json';
const EMPTY_STORE: TradeStore = { version: 1, trades: [], updatedAt: 0 };

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'trades/', limit: 10 });
    const blob = blobs.find((b) => b.pathname === BLOB_PATH);
    if (!blob) {
      return Response.json(EMPTY_STORE);
    }
    const res = await fetch(blob.url);
    const data: TradeStore = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: 'Failed to read trades', detail: String(err) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const store: TradeStore = await request.json();
    store.updatedAt = Date.now();
    await put(BLOB_PATH, JSON.stringify(store), {
      access: 'public',
      addRandomSuffix: false,
    });
    return Response.json({ ok: true, updatedAt: store.updatedAt });
  } catch (err) {
    return Response.json(
      { error: 'Failed to save trades', detail: String(err) },
      { status: 500 },
    );
  }
}
