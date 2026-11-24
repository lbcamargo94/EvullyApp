import { useRecommendationSettings, useSetRecommendationSettings } from '@evully/app-core';
import { recommendationRuleSchema, type RecommendationRule } from '@evully/contracts';
import { Card, Switch } from '@evully/ui';
import {
  ruleDescriptions,
  ruleNames,
  signalsMessages as m,
} from '../recommendations/messages.pt-BR';
import { useSavedToggle } from '../shared/use-saved-toggle';

/** Every rule, in the order the engine runs them. */
const RULES = recommendationRuleSchema.options;

function RuleToggle({
  rule,
  disabled,
  onChange,
}: {
  rule: RecommendationRule;
  disabled: readonly RecommendationRule[];
  onChange: (rules: RecommendationRule[]) => Promise<unknown>;
}) {
  const [on, toggle] = useSavedToggle(!disabled.includes(rule), (next) =>
    onChange(next ? disabled.filter((r) => r !== rule) : [...disabled, rule]),
  );
  const id = `rule-${rule}`;
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="flex flex-col gap-0.5">
        <span className="text-body font-semibold">{ruleNames[rule]}</span>
        <span className="text-caption text-text-muted">{ruleDescriptions[rule]}</span>
      </label>
      <Switch id={id} checked={on} onChange={(e) => toggle(e.target.checked)} />
    </li>
  );
}

/** Settings › Sinais: each rule on or off for this profile (README §20.2). */
export function RecommendationsSection({ profileId }: { profileId: string }) {
  const { data } = useRecommendationSettings(profileId);
  const save = useSetRecommendationSettings(profileId);
  if (!data) return null;
  return (
    <Card aria-labelledby="signals-settings-title">
      <div className="flex flex-col gap-1">
        <h2 id="signals-settings-title" className="text-heading font-semibold">
          {m.settingsTitle}
        </h2>
        <p className="text-caption text-text-muted">{m.settingsDescription}</p>
      </div>
      <ul className="flex flex-col divide-y divide-border/60">
        {RULES.map((rule) => (
          <RuleToggle
            key={rule}
            rule={rule}
            disabled={data.disabledRules}
            onChange={(rules) => save.mutateAsync({ disabledRules: rules })}
          />
        ))}
      </ul>
      {save.isError && (
        <p role="alert" className="text-caption text-danger">
          {m.failed}
        </p>
      )}
    </Card>
  );
}
