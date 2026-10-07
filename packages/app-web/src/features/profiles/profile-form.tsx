import { errorCode } from '@evully/app-core';
import { profileInputSchema, type ProfileInput } from '@evully/contracts';
import { Button, Field, Input, NativeSelect } from '@evully/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { profileErrorByCode, profileMessages as m } from './messages.pt-BR';

const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value);
const toNumberOrNull = (value: unknown) => {
  const v = emptyToNull(value);
  return v === null ? null : Number(v);
};

export const emptyProfile: ProfileInput = { name: '', birthDate: null, sex: null, heightCm: null };

/** Step 1 of the tracking questionnaire (README §8.2.1); also used to edit a profile. */
export function ProfileForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: ProfileInput;
  submitLabel: string;
  onSubmit: (values: ProfileInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues,
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const known = profileErrorByCode[errorCode(error) ?? ''];
      if (known) form.setError(known.field, { message: known.message }, { shouldFocus: true });
      else form.setError('root', { message: m.genericError });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field id="name" label={m.name} error={errors.name?.message}>
        <Input
          id="name"
          autoFocus
          autoComplete="given-name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...form.register('name')}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          id="birthDate"
          label={m.birthDate}
          hint={m.optional}
          error={errors.birthDate?.message}
        >
          <Input
            id="birthDate"
            type="date"
            aria-invalid={!!errors.birthDate}
            aria-describedby={errors.birthDate ? 'birthDate-error' : undefined}
            {...form.register('birthDate', { setValueAs: emptyToNull })}
          />
        </Field>
        <Field id="sex" label={m.sex} hint={m.optional}>
          <NativeSelect id="sex" {...form.register('sex', { setValueAs: emptyToNull })}>
            {Object.entries(m.sexOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="heightCm" label={m.height} hint={m.optional} error={errors.heightCm?.message}>
          <Input
            id="heightCm"
            type="number"
            inputMode="decimal"
            min={50}
            max={272}
            step={0.1}
            aria-invalid={!!errors.heightCm}
            aria-describedby={errors.heightCm ? 'heightCm-error' : undefined}
            {...form.register('heightCm', { setValueAs: toNumberOrNull })}
          />
        </Field>
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-danger">
          {errors.root.message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {m.cancel}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? m.saving : submitLabel}
        </Button>
      </div>
    </form>
  );
}
