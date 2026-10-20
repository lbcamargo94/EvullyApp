import { describe, expect, it } from 'vitest';
import {
  confirmsProfileName,
  normalizeProfileDraft,
  parseLocalDate,
  profileInitial,
  type ProfileDraft,
} from '../src';

const today = parseLocalDate('2026-10-07');
const draft = (overrides: Partial<ProfileDraft> = {}): ProfileDraft => ({
  name: 'Lucas',
  birthDate: '1994-08-16',
  sex: 'male',
  heightCm: 175,
  ...overrides,
});
const codeOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return (error as { code?: string }).code;
  }
  return undefined;
};

describe('normalizeProfileDraft', () => {
  it('accepts a complete profile', () => {
    expect(normalizeProfileDraft(draft(), today)).toEqual(draft());
  });

  it('accepts only a name', () => {
    expect(
      normalizeProfileDraft(draft({ birthDate: null, sex: null, heightCm: null }), today),
    ).toMatchObject({ name: 'Lucas', birthDate: null, heightCm: null });
  });

  it('trims and collapses spaces in the name', () => {
    expect(normalizeProfileDraft(draft({ name: '  Ana   Maria ' }), today).name).toBe('Ana Maria');
  });

  it.each([
    ['empty name', { name: '   ' }, 'profile.name_required'],
    ['name over 60 chars', { name: 'a'.repeat(61) }, 'profile.name_too_long'],
    ['future birth date', { birthDate: '2026-10-08' }, 'profile.birth_date_in_future'],
    ['birth date before 1900', { birthDate: '1899-12-31' }, 'profile.birth_date_too_old'],
    ['invalid birth date', { birthDate: '1994-02-30' }, 'date.invalid'],
    ['height below 50 cm', { heightCm: 49.9 }, 'profile.height_out_of_range'],
    ['height above 272 cm', { heightCm: 272.1 }, 'profile.height_out_of_range'],
  ])('rejects %s', (_label, overrides, code) => {
    expect(codeOf(() => normalizeProfileDraft(draft(overrides), today))).toBe(code);
  });

  it('accepts a birth date of today and rounds height to one decimal', () => {
    const result = normalizeProfileDraft(draft({ birthDate: today, heightCm: 175.46 }), today);
    expect(result).toMatchObject({ birthDate: today, heightCm: 175.5 });
  });
});

describe('profileInitial', () => {
  it.each([
    ['Lucas', 'L'],
    ['érica', 'É'],
    ['  ana', 'A'],
    ['', '?'],
  ])('%s → %s', (name, initial) => {
    expect(profileInitial(name)).toBe(initial);
  });
});

describe('confirmsProfileName', () => {
  it('accepts the name ignoring case and outer spaces', () => {
    expect(confirmsProfileName('  lucas ', 'Lucas')).toBe(true);
    expect(confirmsProfileName('ANA PAULA', 'Ana Paula')).toBe(true);
  });

  it('rejects other names, partial names and empty input', () => {
    expect(confirmsProfileName('Luc', 'Lucas')).toBe(false);
    expect(confirmsProfileName('Lucas C', 'Lucas')).toBe(false);
    expect(confirmsProfileName('', 'Lucas')).toBe(false);
    expect(confirmsProfileName('', '  ')).toBe(false);
  });
});
