import { useAppInfo, useLegalDocuments, useOpenLogs } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { useState, type ReactNode } from 'react';
import { shellMessages } from '../shell/messages.pt-BR';
import { aboutMessages as m } from './messages.pt-BR';
import { UpdateSection } from './update-section';

const textBox =
  'max-h-72 overflow-auto rounded-md border border-border bg-surface-muted p-4 font-mono text-caption leading-relaxed whitespace-pre-wrap';

/** Settings › Sobre (README §8.4): version, health notice, license and notices. */
export function AboutSection() {
  const { data: info } = useAppInfo();
  const [showNotices, setShowNotices] = useState(false);
  const legal = useLegalDocuments();
  const logs = useOpenLogs();

  return (
    <>
      <Section id="about-version" title={m.versionTitle}>
        {info && (
          <p>
            {m.version(info.version)}
            {info.environment === 'development' && (
              <span className="text-text-muted"> · {m.development}</span>
            )}
          </p>
        )}
        <UpdateSection />
        {logs.available && (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" onClick={() => logs.mutate()}>
              {m.openLogs}
            </Button>
            <span className="text-caption text-text-muted">{m.logsHint}</span>
          </div>
        )}
      </Section>

      <Section id="about-health" title={m.healthTitle}>
        <div className="flex flex-col gap-3 text-body leading-relaxed">
          {shellMessages.healthBody.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Section>

      <Section id="about-license" title={m.licenseTitle}>
        <LegalText text={legal.data?.license} failed={legal.isError} />
      </Section>

      <Section id="about-notices" title={m.noticesTitle}>
        <p className="text-caption text-text-muted">{m.noticesHint}</p>
        {showNotices ? (
          <LegalText text={legal.data?.thirdPartyNotices} failed={legal.isError} />
        ) : (
          <button
            type="button"
            onClick={() => setShowNotices(true)}
            className="self-start text-body font-semibold text-brand underline-offset-4 hover:underline"
          >
            {m.showNotices}
          </button>
        )}
      </Section>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id}>
      <h2 id={id} className="text-heading font-semibold">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function LegalText({ text, failed }: { text: string | undefined; failed: boolean }) {
  if (failed || text === '') return <p className="text-caption text-text-muted">{m.unavailable}</p>;
  if (text === undefined) return null;
  return (
    // A scrollable box must take focus so keyboard users can scroll it (WCAG 2.1.1).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <pre tabIndex={0} className={textBox}>
      {text}
    </pre>
  );
}
