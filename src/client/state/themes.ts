interface ThemeStyle {
  'bg-surface': string;
}

const DEFAULT_THEME_STYLE: ThemeStyle = {
  'bg-surface': '#000000',
};

const DEFAULT_DARK_THEME_ID = 'ayu';
const DEFAULT_LIGHT_THEME_ID = 'light';

const DEFAULT_THEME_ID_TO_NAME = {
  ayu: 'Ayu',
  classic: 'Classic',
  butter: 'Butter',
  light: 'Light',
  silver: 'Silver',
  // custom: 'Custom',
} as const;

interface ThemeSettingsOpts {
  customThemeName: string | null;
  customTheme: Partial<ThemeStyle>;
  themeId: string;
  useSystemTheme: boolean;
}

export class ThemeSettings {
  themeIdToName: Map<string, string>;

  customThemeStyle: ThemeStyle;

  themeId: string;

  useSystemTheme: boolean;

  constructor(opts: ThemeSettingsOpts) {
    this.themeIdToName = new Map(Object.entries(DEFAULT_THEME_ID_TO_NAME));
    // if (opts.customThemeName) this.themeIdToName.set('custom', opts.customThemeName);

    this.customThemeStyle = {
      ...DEFAULT_THEME_STYLE,
      ...opts.customTheme,
    };

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

    const themeId = typeof settings.themeId === 'string' ? settings.themeId : DEFAULT_DARK_THEME_ID;

    const useSystemTheme =
      typeof settings.useSystemTheme === 'boolean' ? settings.useSystemTheme : true;

    return new ThemeSettings({
      customThemeName,
      customTheme,
      themeId,
      useSystemTheme,
    });
  }

  toSettings(): Record<string, unknown> {
    return {
      customThemeName: this.getCustomThemeName(),
      customTheme: this.getCustomThemeStyle(),
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
    this._clearTheme();
    const themeId = this.getActualThemeId();
    document.body.classList.add(`${themeId}-theme`);
  }
}
