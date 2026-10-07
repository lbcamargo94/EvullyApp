import { parseLocalDate } from '@evully/domain';
import { v7 as uuidv7 } from 'uuid';
import type { Clock, IdGenerator } from './ports';

const pad = (n: number) => String(n).padStart(2, '0');

export const systemClock: Clock = {
  nowIso: () => new Date().toISOString(),
  today: () => {
    const now = new Date();
    return parseLocalDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  },
};

export const uuidV7Generator: IdGenerator = { next: () => uuidv7() };
