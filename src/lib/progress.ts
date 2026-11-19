import { ProgressUpdate } from "@/types/progress";

const subscribers = new Map<string, Set<(update: ProgressUpdate) => void>>();

export function subscribe(projectId: string, callback: (update: ProgressUpdate) => void) {
  if (!subscribers.has(projectId)) {
    subscribers.set(projectId, new Set());
  }
  subscribers.get(projectId)!.add(callback);
  return () => {
    subscribers.get(projectId)?.delete(callback);
  };
}

export function publish(projectId: string, update: ProgressUpdate) {
  const subs = subscribers.get(projectId);
  if (subs) {
    subs.forEach((cb) => cb(update));
  }
}

export function unsubscribe(projectId: string) {
  subscribers.delete(projectId);
}
