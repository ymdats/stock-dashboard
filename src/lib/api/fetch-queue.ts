const DELAY_MS = 13_000; // 5 calls/min = 1 call per 12s, 13s for safety

let queue: Promise<unknown> = Promise.resolve();
let lastCallTime = 0;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(async () => {
    const elapsed = Date.now() - lastCallTime;
    if (lastCallTime > 0 && elapsed < DELAY_MS) {
      await wait(DELAY_MS - elapsed);
    }
    lastCallTime = Date.now();
    return fn();
  });
  queue = task.catch(() => {});
  return task;
}
