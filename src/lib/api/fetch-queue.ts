let queue: Promise<unknown> = Promise.resolve();

export function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(() => fn());
  queue = task.catch(() => {});
  return task;
}
