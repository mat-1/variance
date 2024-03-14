import { CLASSIC_THEME, ThemeStyle } from './styles';

export interface ThemeJson {
  name: string;
  style: ThemeStyle;
}

// https://stackoverflow.com/a/51365037
type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

// https://stackoverflow.com/a/37164538
export function isObject(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === 'object' && !Array.isArray(item);
}
export default function mergeDeep<T extends Record<string, unknown>>(
  target: T,
  source: RecursivePartial<T>,
): T {
  const output: Record<string, unknown> = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (target[key] === undefined) Object.assign(output, { [key]: source[key] });
        else
          output[key] = mergeDeep(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>,
          );
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output as T;
}

export interface ElementThemeJson {
  name: string;
  is_dark: boolean;
  colors: {
    'accent-color': string;
    'primary-color': string;
    'warning-color': string;
    alert: string;
    'sidebar-color': string;
    'roomlist-background-color': string;
    'roomlist-text-color': string;
    'roomlist-text-secondary-color': string;
    'roomlist-highlights-color': string;
    'roomlist-separator-color': string;
    'timeline-background-color': string;
    'timeline-text-color': string;
    'secondary-content': string;
    'tertiary-content': string;
    'timeline-text-secondary-color': string;
    'timeline-highlights-color': string;
    'reaction-row-button-selected-bg-color': string;
    'menu-selected-color': string;
    'focus-bg-color': string;
    'room-highlight-color': string;
    'togglesw-off-color': string;
    'other-user-pill-bg-color': string;
    'username-colors': string[];
    'avatar-background-colors': string[];
  };
}

export async function loadThemeFromUrl(url: string): Promise<ThemeStyle> {
  const response = await fetch(url);
  const theme: ElementThemeJson = await response.json();

  const partial: RecursivePartial<ThemeStyle> = {
    background: {
      surface: theme.colors['timeline-background-color'],
      surface_transparent: theme.colors['timeline-background-color'],
      surface_low: theme.colors['roomlist-background-color'],
      surface_low_transparent: theme.colors['roomlist-background-color'],
      surface_extra_low: theme.colors['sidebar-color'],
      surface_extra_low_transparent: theme.colors['sidebar-color'],

      badge: theme.colors['roomlist-text-color'],
    },

    text_color: {
      surface: {
        high: theme.colors['timeline-text-color'],
        normal: theme.colors['timeline-text-color'],
        normal_low: theme.colors['timeline-text-secondary-color'],
        low: theme.colors['timeline-text-secondary-color'],
      },
    },
    system_icons: {
      surface: {
        high: theme.colors['secondary-content'],
        normal: theme.colors['secondary-content'],
        low: theme.colors['tertiary-content'],
      },
    },
    user_colors: theme.colors['username-colors'] as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ],
  };

  const mergedTheme = mergeDeep(
    CLASSIC_THEME as unknown as Record<string, unknown>,
    // this gets rid of the `undefined` values
    JSON.parse(JSON.stringify(partial)),
  ) as unknown as ThemeStyle;

  console.log(mergedTheme);

  return mergedTheme;
}
