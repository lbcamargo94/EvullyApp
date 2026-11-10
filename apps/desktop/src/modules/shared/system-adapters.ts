import { parseLocalDate } from '@evully/domain';
import { v7 as uuidv7 } from 'uuid';
import type { Clock, IdGenerator } from './ports';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local date and `HH:mm` of an instant in the system time zone. */
export function localParts(at: Date) {
  return {
    date: parseLocalDate(`${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`),
    time: `${pad(at.getHours())}:${pad(at.getMinutes())}`,
  };
}

export const systemClock: Clock = {
  nowIso: () => new Date().toISOString(),
  today: () => {
    const now = new Date();
    return parseLocalDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  },
  localToIso: (date, time) => new Date(`${date}T${time}:00`).toISOString(),
  isoToLocal: (iso) => localParts(new Date(iso)),
  localTime: () => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  },
};

export const uuidV7Generator: IdGenerator = { next: () => uuidv7() };
