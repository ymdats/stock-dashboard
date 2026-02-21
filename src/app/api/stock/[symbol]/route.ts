import type { DailyBar, StockData, StockQuote } from '@/lib/types/stock';

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;

  // Validate symbol format: 1-5 uppercase letters
  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    return Response.json(
      { error: 'Invalid symbol format. Must be 1-5 uppercase letters.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Alpha Vantage API key is not configured.' },
      { status: 500 },
    );
  }

  const url = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    // Handle rate limit errors
    if (json['Note'] || json['Information']) {
      return Response.json(
        { error: 'Alpha Vantage API rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const timeSeries = json['Time Series (Daily)'];

    // Handle symbol not found
    if (!timeSeries) {
      return Response.json(
        { error: `No data found for symbol: ${symbol}` },
        { status: 404 },
      );
    }

    // Transform to DailyBar[], sort oldest-first, take last 90 trading days
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

    // Calculate quote from last 2 days
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

    const data: StockData = { symbol, bars, quote };

    return Response.json(data);
  } catch {
    return Response.json(
      { error: 'Failed to fetch stock data from Alpha Vantage.' },
      { status: 502 },
    );
  }
}
