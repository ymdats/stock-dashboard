const STORAGE_KEY = 'av-api-usage';
const DAILY_LIMIT = 25;

interface ApiUsage {
  date: string;
  count: number;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(): ApiUsage {
  if (typeof window === 'undefined') return { date: getTodayStr(), count: 0 };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayStr(), count: 0 };
    const usage: ApiUsage = JSON.parse(raw);
    if (usage.date !== getTodayStr()) {
      return { date: getTodayStr(), count: 0 };
    }
    return usage;
  } catch {
    return { date: getTodayStr(), count: 0 };
  }
}

export function incrementApiUsage(): void {
  const usage = getUsage();
  usage.count += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function getApiUsageToday(): number {
  return getUsage().count;
}

export function getApiRemaining(): number {
  return Math.max(0, DAILY_LIMIT - getUsage().count);
}
