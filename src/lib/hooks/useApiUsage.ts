'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiRemaining, getApiUsageToday } from '@/lib/api/api-usage';

export function useApiUsage() {
  const [remaining, setRemaining] = useState(25);
  const [used, setUsed] = useState(0);

  const refresh = useCallback(() => {
    setRemaining(getApiRemaining());
    setUsed(getApiUsageToday());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { remaining, used, refresh };
}
