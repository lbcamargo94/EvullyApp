import type { DueReminder } from '@evully/domain';

const list = (items: readonly string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;

/**
 * Notification text (README §25): the profile name and the subject only. It
 * may show over other windows or on the lock screen, so it never carries
 * numbers from the records.
 */
export function reminderText(
  profileName: string,
  due: DueReminder,
): { title: string; body: string; route: string } {
  switch (due.type) {
    case 'weighing':
      return {
        title: `${profileName}: hora da pesagem`,
        body: 'Registre o peso de hoje no Evully.',
        route: '/app/weight',
      };
    case 'measurements':
      return {
        title: `${profileName}: dia de medidas`,
        body: 'Registre suas medidas no Evully.',
        route: '/app/measurements',
      };
    case 'workout':
      return {
        title: `${profileName}: treino de hoje`,
        body: `${list(due.dayNames)}.`,
        route: '/app/workouts',
      };
    case 'meal':
      return {
        title: `${profileName}: refeições de hoje`,
        body: 'Registre o que você comeu hoje no Evully.',
        route: '/app/diet',
      };
    case 'protein':
      return {
        title: `${profileName}: proteína do dia`,
        body: 'A proteína de hoje ainda está abaixo da meta.',
        route: '/app/diet',
      };
    case 'water':
      return {
        title: `${profileName}: hora da água`,
        body: 'Registre a água de hoje no Evully.',
        route: '/app/diet',
      };
    case 'habits':
      return {
        title: `${profileName}: hábitos de hoje`,
        body: 'Ainda há hábitos para marcar hoje.',
        route: '/app/habits',
      };
    case 'sleep':
      return {
        title: `${profileName}: como foi a noite?`,
        body: 'Registre o sono da última noite no Evully.',
        route: '/app/sleep',
      };
  }
}
