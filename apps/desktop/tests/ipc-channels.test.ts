import { describe, expect, it } from 'vitest';
import { ipcChannels } from '../src/shared/ipc-channels';

describe('IPC input schemas', () => {
  const create = ipcChannels['profiles:create'].input;

  it('accepts a valid profile', () => {
    expect(
      create.safeParse({ name: 'Lucas', birthDate: '1994-08-16', sex: 'male', heightCm: 175 })
        .success,
    ).toBe(true);
  });

  it.each([
    ['missing fields', { name: 'Lucas' }],
    ['blank name', { name: '  ', birthDate: null, sex: null, heightCm: null }],
    ['wrong date format', { name: 'L', birthDate: '16/08/1994', sex: null, heightCm: null }],
    ['unknown sex', { name: 'L', birthDate: null, sex: 'x', heightCm: null }],
    ['height as text', { name: 'L', birthDate: null, sex: null, heightCm: '175' }],
  ])('rejects %s', (_label, input) => {
    expect(create.safeParse(input).success).toBe(false);
  });

  it('rejects a non-UUID id and an inactivity value outside the options', () => {
    expect(ipcChannels['profiles:get'].input.safeParse({ id: '1' }).success).toBe(false);
    expect(
      ipcChannels['settings:update'].input.safeParse({ inactivityLockMinutes: 7 }).success,
    ).toBe(false);
  });
});
