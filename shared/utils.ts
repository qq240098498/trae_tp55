export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
  }
  return `${mins}分钟`;
}

export function calculateDuration(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  return (e.getTime() - s.getTime()) / (1000 * 60);
}

export function calculateBaseAmount(hourlyRate: number, minutes: number): number {
  const hours = Math.ceil(minutes / 60);
  return hourlyRate * hours;
}

export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayEnd(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function getExpectedEndTime(startTime: string, bookedHours?: number): Date | null {
  if (!bookedHours || bookedHours <= 0) return null;
  const start = new Date(startTime);
  return new Date(start.getTime() + bookedHours * 60 * 60 * 1000);
}

export function getRemainingMinutes(startTime: string, bookedHours?: number): number | null {
  const endTime = getExpectedEndTime(startTime, bookedHours);
  if (!endTime) return null;
  const now = new Date();
  const remaining = (endTime.getTime() - now.getTime()) / (1000 * 60);
  return remaining;
}

export function formatRemainingTime(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = Math.floor(absMinutes % 60);
  const secs = Math.floor((absMinutes % 1) * 60);
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
