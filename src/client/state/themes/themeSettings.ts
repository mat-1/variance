import {
  AYU_THEME,
  BUTTER_THEME,
  CLASSIC_THEME,
  LIGHT_THEME,
  SILVER_THEME,
  ThemeStyle,
} from './styles';

const DEFAULT_DARK_THEME_ID = 'ayu';
const DEFAULT_LIGHT_THEME_ID = 'light';

const DEFAULT_THEME_ID_TO_NAME = {
  ayu: 'Ayu',
  classic: 'Classic',
  butter: 'Butter',
  light: 'Light',
  silver: 'Silver',
  custom: 'Custom',
} as const;

interface ThemeSettingsOpts {
  customThemeName: string | null;
  customTheme: Partial<ThemeStyle>;
  customThemeUrl: string;
  themeId: string;
  useSystemTheme: boolean;
}

export class ThemeSettings {
  themeIdToName: Map<string, string>;

  customThemeStyle: ThemeStyle;

  customThemeUrl: string;

  themeId: string;

  useSystemTheme: boolean;

  constructor(opts: ThemeSettingsOpts) {
    this.themeIdToName = new Map(Object.entries(DEFAULT_THEME_ID_TO_NAME));
    if (opts.customThemeName) this.themeIdToName.set('custom', opts.customThemeName);

    this.customThemeStyle = {
      ...CLASSIC_THEME,
      ...opts.customTheme,
    };

    this.customThemeUrl = '';

    this.themeId = opts.themeId;

    this.useSystemTheme = opts.useSystemTheme;

    // detect when the system theme changes and apply
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    mediaQuery.addEventListener('change', () => {
      this.applyTheme();
    });
  }

  static fromSettings(settings: Record<string, unknown>): ThemeSettings {
    const customThemeName =
      typeof settings.customThemeName === 'string' ? settings.customThemeName : null;

    const customTheme = settings.customTheme || {};

    const customThemeUrl =
      typeof settings.customThemeUrl === 'string' ? settings.customThemeUrl : '';

    const themeId = typeof settings.themeId === 'string' ? settings.themeId : DEFAULT_DARK_THEME_ID;

    const useSystemTheme =
      typeof settings.useSystemTheme === 'boolean' ? settings.useSystemTheme : true;

    return new ThemeSettings({
      customThemeName,
      customTheme,
      customThemeUrl,
      themeId,
      useSystemTheme,
    });
  }

  toSettings(): Record<string, unknown> {
    return {
      customThemeName: this.getCustomThemeName(),
      customTheme: this.getCustomThemeStyle(),
      customThemeUrl: this.customThemeUrl,
      themeId: this.getThemeId(),
      useSystemTheme: this.getUseSystemTheme(),
    };
  }

  getThemeName(themeId: string): string | null {
    return this.themeIdToName.get(themeId) || null;
  }

  getCustomThemeName(): string | null {
    return this.themeIdToName.get('custom') || null;
  }

  setCustomThemeName(themeName: string): void {
    this.themeIdToName.set('custom', themeName);
  }

  /**
   * Get the theme ID that was selected by the user in settings. Note that if useSystemThee is
   * enabled then this might not be the theme that's actually being used.
   */
  getThemeId(): string {
    return this.themeId;
  }

  /**
   * Get the actual theme ID that is going to be used. This may not be the same as `getThemeId`
   * because this takes the system theme into account.
   * @returns The theme ID that is actually being used.
   */
  getActualThemeId(): string {
    if (this.useSystemTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      return mediaQuery.matches ? DEFAULT_LIGHT_THEME_ID : DEFAULT_DARK_THEME_ID;
    }
    return this.themeId;
  }

  getThemeStyle(): ThemeStyle {
    const themeId = this.getActualThemeId();
    return this.getThemeStyleFromId(themeId);
  }

  getThemeStyleFromId(themeId: string): ThemeStyle {
    const mapping: Record<keyof typeof DEFAULT_THEME_ID_TO_NAME, ThemeStyle> = {
      ayu: AYU_THEME,
      classic: CLASSIC_THEME,
      butter: BUTTER_THEME,
      light: LIGHT_THEME,
      silver: SILVER_THEME,
      custom: this.getCustomThemeStyle(),
    };
    return mapping[themeId as keyof typeof DEFAULT_THEME_ID_TO_NAME] ?? CLASSIC_THEME;
  }

  setThemeId(themeId: string): void {
    this.themeId = themeId;
  }

  getCustomThemeStyle(): ThemeStyle {
    return this.customThemeStyle;
  }

  setCustomThemeStyle(themeStyle: Partial<ThemeStyle>): void {
    this.customThemeStyle = {
      ...this.customThemeStyle,
      ...themeStyle,
    };
  }

  getCustomThemeUrl(): string {
    return this.customThemeUrl;
  }

  setCustomThemeUrl(url: string): void {
    this.customThemeUrl = url;
  }

  getUseSystemTheme(): boolean {
    return this.useSystemTheme;
  }

  setUseSystemTheme(useSystemTheme: boolean): void {
    this.useSystemTheme = useSystemTheme;
  }

  _clearTheme() {
    this.themeIdToName.forEach((_, themeId) => {
      if (themeId === '') return;
      document.body.classList.remove(`${themeId}-theme`);
    });
  }

  applyTheme() {
    const themeStyle = this.getThemeStyle();

    const properties = {
      'bg-surface': themeStyle.background.surface,
      'bg-surface-transparent': themeStyle.background.surface_transparent,
      'bg-surface-low': themeStyle.background.surface_low,
      'bg-surface-low-transparent': themeStyle.background.surface_low_transparent,
      'bg-surface-extra-low': themeStyle.background.surface_extra_low,
      'bg-surface-extra-low-transparent': themeStyle.background.surface_extra_low_transparent,
      'bg-surface-hover': themeStyle.background.surface_hover,
      'bg-surface-active': themeStyle.background.surface_active,
      'bg-surface-border': themeStyle.background.surface_border,

      'bg-primary': themeStyle.background.primary,
      'bg-primary-hover': themeStyle.background.primary_hover,
      'bg-primary-active': themeStyle.background.primary_active,
      'bg-primary-border': themeStyle.background.primary_border,

      'bg-tooltip': themeStyle.background.tooltip,
      'bg-badge': themeStyle.background.badge,
      'bg-ping': themeStyle.background.ping,
      'bg-ping-hover': themeStyle.background.ping_hover,
      'bg-divider': themeStyle.background.divider,

      'tc-surface-high': themeStyle.text_color.surface.high,
      'tc-surface-normal': themeStyle.text_color.surface.normal,
      'tc-surface-normal-low': themeStyle.text_color.surface.normal_low,
      'tc-surface-low': themeStyle.text_color.surface.low,

      'tc-primary-high': themeStyle.text_color.primary.high,
      'tc-primary-normal': themeStyle.text_color.primary.normal,
      'tc-primary-low': themeStyle.text_color.primary.low,

      'tc-code': themeStyle.text_color.code,
      'tc-link': themeStyle.text_color.link,
      'tc-badge': themeStyle.text_color.badge,

      'ic-surface-high': themeStyle.system_icons.surface.high,
      'ic-surface-normal': themeStyle.system_icons.surface.normal,
      'ic-surface-low': themeStyle.system_icons.surface.low,
      'ic-primary-normal': themeStyle.system_icons.primary.normal,

      'mx-uc-1': themeStyle.user_colors[0],
      'mx-uc-2': themeStyle.user_colors[1],
      'mx-uc-3': themeStyle.user_colors[2],
      'mx-uc-4': themeStyle.user_colors[3],
      'mx-uc-5': themeStyle.user_colors[4],
      'mx-uc-6': themeStyle.user_colors[5],
      'mx-uc-7': themeStyle.user_colors[6],
      'mx-uc-8': themeStyle.user_colors[7],

      'bg-overlay': themeStyle.shadow_and_overlay.background_overlay,
      'bg-overlay-low': themeStyle.shadow_and_overlay.background_overlay_low,

      'bs-popup': themeStyle.shadow_and_overlay.box_shadow_popup,

      'bs-surface-border': themeStyle.shadow_and_overlay.box_shadow_surface_border,
      'bs-surface-outline': themeStyle.shadow_and_overlay.box_shadow_surface_outline,

      'bs-primary-border': themeStyle.shadow_and_overlay.box_shadow_primary_border,
      'bs-primary-outline': themeStyle.shadow_and_overlay.box_shadow_primary_outline,
    };

    Object.entries(properties).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }
}
