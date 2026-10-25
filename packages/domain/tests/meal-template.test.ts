import { describe, expect, it } from 'vitest';
import { ConflictError, normalizeMealTemplateName, ValidationError } from '../src';

describe('normalizeMealTemplateName', () => {
  it('trims and collapses spaces', () => {
    expect(normalizeMealTemplateName('  Almoço   de treino ', [])).toBe('Almoço de treino');
  });

  it('rejects empty, too long and repeated names', () => {
    expect(() => normalizeMealTemplateName(' ', [])).toThrow(ValidationError);
    expect(() => normalizeMealTemplateName('x'.repeat(41), [])).toThrow(ValidationError);
    expect(() => normalizeMealTemplateName('ALMOÇO DE TREINO', ['Almoço de treino'])).toThrow(
      ConflictError,
    );
  });
});
