import type { DailyBar, StockData, StockQuote } from '@/lib/types/stock';
import { put } from '@vercel/blob';
import { DEFAULT_SYMBOLS } from '@/config/defaults';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';
const DELAY_MS = 13_000; // 13s between calls to respect 5/min limit

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchAndParse(symbol: string, apiKey: string): Promise<StockData> {
  const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;

  return fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (json['Note'] || json['Information']) {
        throw new Error('Rate limit exceeded');
      }

      const timeSeries = json['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error(`No data for ${symbol}`);
      }

      const entries = timeSeries as Record<string, Record<string, string>>;
      const bars: DailyBar[] = Object.entries(entries)
        .map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'], 10),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-90);

      const latest = bars[bars.length - 1];
      const previous = bars[bars.length - 2];
      const change = latest.close - previous.close;
      const changePercent = (change / previous.close) * 100;

      const quote: StockQuote = {
        symbol,
        price: latest.close,
        change,
        changePercent,
        lastTradingDay: latest.date,
      };

      return { symbol, bars, quote };
    });
}

export async function POST() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }

  const results: { symbol: string; status: 'ok' | 'error'; error?: string }[] = [];

  for (let i = 0; i < DEFAULT_SYMBOLS.length; i++) {
    const symbol = DEFAULT_SYMBOLS[i];

    // Wait between calls (skip first)
    if (i > 0) {
      await wait(DELAY_MS);
    }

    try {
      const data = await fetchAndParse(symbol, apiKey);

      await put(`stocks/${symbol}.json`, JSON.stringify({ ...data, cachedAt: Date.now() }), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      results.push({ symbol, status: 'ok' });
    } catch (err) {
      results.push({ symbol, status: 'error', error: String(err) });
    }
  }

  const succeeded = results.filter((r) => r.status === 'ok').length;
  return Response.json({
    message: `Refreshed ${succeeded}/${DEFAULT_SYMBOLS.length} stocks`,
    apiCallsUsed: DEFAULT_SYMBOLS.length,
    results,
  });
}
