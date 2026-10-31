export type Log = {
  id: string;
  title: string;
  rating: number;
  review: string;
  loggedAt: string;
};

const KEY = "logs";

export function readLogs(): Record<string, Log> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveLog(log: Log): void {
  const logs = readLogs();
  logs[log.id] = log;
  localStorage.setItem(KEY, JSON.stringify(logs));
}