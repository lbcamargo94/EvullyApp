import {
  Activity,
  Apple,
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Moon,
  Ruler,
  Scale,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { shellMessages as m } from './messages.pt-BR';

/**
 * The screens of the main menu, each with its one icon (DESIGN.md §4.2).
 * Menu, headers and empty states take a module's icon from here.
 */
export const MODULES = [
  { key: 'dashboard', to: '/app', label: m.dashboard, icon: LayoutDashboard },
  { key: 'weight', to: '/app/weight', label: m.weight, icon: Scale },
  { key: 'measurements', to: '/app/measurements', label: m.measurements, icon: Ruler },
  { key: 'nutrition', to: '/app/diet', label: m.diet, icon: Apple },
  { key: 'workouts', to: '/app/workouts', label: m.workouts, icon: Dumbbell },
  { key: 'cardio', to: '/app/cardio', label: m.cardio, icon: Activity },
  { key: 'habits', to: '/app/habits', label: m.habits, icon: ListChecks },
  { key: 'sleep', to: '/app/sleep', label: m.sleep, icon: Moon },
  { key: 'stats', to: '/app/stats', label: m.stats, icon: ChartLine },
  { key: 'signals', to: '/app/signals', label: m.signals, icon: Lightbulb },
  { key: 'settings', to: '/app/settings', label: m.settings, icon: Settings },
] as const satisfies readonly { key: string; to: string; label: string; icon: LucideIcon }[];

export type ModuleKey = (typeof MODULES)[number]['key'];
