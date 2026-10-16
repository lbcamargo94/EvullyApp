import { BackupSection } from './backup-section';
import { settingsMessages as m } from './messages.pt-BR';

/** Settings. Other sections (tracking, project, profile, about) come with the settings step. */
export function SettingsScreen() {
  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      <div className="max-w-3xl">
        <BackupSection />
      </div>
    </>
  );
}
