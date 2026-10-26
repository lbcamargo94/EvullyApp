import { errorCode, usePlanMutation, useWorkoutPreferences } from '@evully/app-core';
import type { PlanTemplateCode } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { useState } from 'react';
import { planErrorByCode, planMessages, workoutQuestionnaireMessages as m } from './messages.pt-BR';

/** Template plans suggested by the questionnaire (README §10, §21.2); the user decides. */
export function PlanSuggestions({ profileId }: { profileId: string }) {
  const { data: prefs } = useWorkoutPreferences(profileId);
  const importPlan = usePlanMutation(profileId, (api, pid, template: PlanTemplateCode) =>
    api.importTemplate(pid, template),
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  if (!prefs || prefs.status !== 'completed') return null;
  const { templates, buildOwnPlan } = prefs.suggestions;
  if (!templates.length && !buildOwnPlan) return null;

  const run = async (template: PlanTemplateCode) => {
    try {
      const plan = await importPlan.mutateAsync(template);
      setMessage({ ok: true, text: m.imported(plan.name) });
    } catch (e) {
      setMessage({ ok: false, text: planErrorByCode[errorCode(e) ?? ''] ?? m.genericError });
    }
  };

  return (
    <Card aria-labelledby="suggestions-title" className="gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="suggestions-title" className="text-base font-semibold">
          {m.suggestionsTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.suggestionsHint}</p>
      </div>
      <ul className="flex flex-col">
        {templates.map((s) => (
          <li
            key={s.template}
            className="flex flex-wrap items-center gap-3 border-t border-border py-2"
          >
            <div className="flex flex-1 flex-col">
              <span className="font-semibold">{planMessages.templates[s.template]}</span>
              <span className="text-sm text-text-muted">{m.reasons[s.reason]}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={importPlan.isPending}
              onClick={() => void run(s.template)}
            >
              {m.importAction}
            </Button>
          </li>
        ))}
      </ul>
      {buildOwnPlan && <p className="text-sm text-text-muted">{m.buildOwn}</p>}
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
        >
          {message.text}
        </p>
      )}
    </Card>
  );
}
