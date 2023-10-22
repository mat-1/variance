export interface ThemeStyle {
  background: {
    surface: string;
    surface_transparent: string;
    surface_low: string;
    surface_low_transparent: string;
    surface_extra_low: string;
    surface_extra_low_transparent: string;
    surface_hover: string;
    surface_active: string;
    surface_border: string;

    primary: string;
    primary_hover: string;
    primary_active: string;
    primary_border: string;

    tooltip: string;
    badge: string;
    ping: string;
    ping_hover: string;
    divider: string;
  };

  text_color: {
    surface: {
      high: string;
      normal: string;
      normal_low: string;
      low: string;
    };
    primary: {
      high: string;
      normal: string;
      low: string;
    };
    code: string;
    link: string;
    badge: string;
  };

  system_icons: {
    surface: {
      high: string;
      normal: string;
      low: string;
    };
    primary: {
      normal: string;
    };
  };

  user_colors: [string, string, string, string, string, string, string, string];

  shadow_and_overlay: {
    background_overlay: string;
    background_overlay_low: string;

    box_shadow_popup: string;

    box_shadow_surface_border: string;
    box_shadow_surface_outline: string;

    box_shadow_primary_border: string;
    box_shadow_primary_outline: string;
  };
}

export const LIGHT_THEME: ThemeStyle = {
  background: {
    surface: '#ffffff',
    surface_transparent: '#ffffff00',
    surface_low: '#f6f6f6',
    surface_low_transparent: '#f6f6f600',
    surface_extra_low: '#f6f6f6',
    surface_extra_low_transparent: '#f6f6f600',
    surface_hover: 'rgba(0, 0, 0, 3%)',
    surface_active: 'rgba(0, 0, 0, 5%)',
    surface_border: 'rgba(0, 0, 0, 6%)',

    primary: 'rgb(83, 110, 234)',
    primary_hover: 'rgba(83, 110, 234, 80%)',
    primary_active: 'rgba(83, 110, 234, 70%)',
    primary_border: 'rgba(83, 110, 234, 38%)',

    tooltip: '#353535',
    badge: '#989898',
    ping: 'hsla(137deg, 100%, 68%, 40%)',
    ping_hover: 'hsla(137deg, 100%, 68%, 50%)',
    divider: 'hsla(0, 0%, 0%, 0.1)',
  },

  text_color: {
    surface: {
      high: '#000000',
      normal: 'rgba(0, 0, 0, 78%)',
      normal_low: 'rgba(0, 0, 0, 60%)',
      low: 'rgba(0, 0, 0, 48%)',
    },
    primary: {
      high: '#ffffff',
      normal: 'rgba(255, 255, 255, 68%)',
      low: 'rgba(255, 255, 255, 40%)',
    },
    code: '#e62498',
    link: 'hsl(213deg 76% 56%)',
    badge: 'white',
  },

  system_icons: {
    surface: {
      high: '#272727',
      normal: '#626262',
      low: '#7c7c7c',
    },
    primary: {
      normal: '#ffffff',
    },
  },

  user_colors: [
    'hsl(208, 66%, 53%)',
    'hsl(302, 49%, 45%)',
    'hsl(163, 97%, 36%)',
    'hsl(343, 75%, 61%)',
    'hsl(24, 100%, 59%)',
    'hsl(181, 63%, 47%)',
    'hsl(242, 89%, 65%)',
    'hsl(94, 65%, 50%)',
  ],

  shadow_and_overlay: {
    background_overlay: 'rgba(0, 0, 0, 20%)',
    background_overlay_low: 'rgba(0, 0, 0, 50%)',

    box_shadow_popup: '0 0 16px rgba(0, 0, 0, 10%)',

    box_shadow_surface_border: 'inset 0 0 0 1px var(--bg-surface-border)',
    box_shadow_surface_outline: '0 0 0 2px var(--bg-surface-border)',

    box_shadow_primary_border: 'inset 0 0 0 1px var(--bg-primary-border)',
    box_shadow_primary_outline: '0 0 0 2px var(--bg-primary-border)',
  },
};

export const CLASSIC_THEME: ThemeStyle = {
  background: {
    surface: 'hsl(208, 8%, 20%)',
    surface_transparent: 'hsla(208, 8%, 20%, 0)',
    surface_low: 'hsl(208, 8%, 16%)',
    surface_low_transparent: 'hsla(208, 8%, 16%, 0)',
    surface_extra_low: 'hsl(208, 8%, 14%)',
    surface_extra_low_transparent: 'hsla(208, 8%, 14%, 0)',
    surface_hover: 'rgba(255, 255, 255, 3%)',
    surface_active: 'rgba(255, 255, 255, 5%)',
    surface_border: 'rgba(0, 0, 0, 20%)',

    primary: 'rgb(42, 98, 166)',
    primary_hover: 'rgba(42, 98, 166, 80%)',
    primary_active: 'rgba(42, 98, 166, 70%)',
    primary_border: 'rgba(42, 98, 166, 38%)',

    tooltip: '#000',
    badge: 'hsl(0, 0%, 75%)',
    ping: 'hsla(137deg, 100%, 38%, 40%)',
    ping_hover: 'hsla(137deg, 100%, 38%, 50%)',
    divider: 'hsla(0, 0%, 100%, 0.1)',
  },

  text_color: {
    surface: {
      high: 'rgba(255, 255, 255, 98%)',
      normal: 'rgba(255, 255, 255, 94%)',
      normal_low: 'rgba(255, 255, 255, 60%)',
      low: 'rgba(255, 255, 255, 58%)',
    },
    primary: {
      high: '#ffffff',
      normal: 'rgba(255, 255, 255, 0.68)',
      low: 'rgba(255, 255, 255, 0.4)',
    },
    code: '#e565b1',
    link: 'hsl(213deg 94% 73%)',
    badge: 'black',
  },

  system_icons: {
    surface: {
      high: 'rgb(255, 255, 255)',
      normal: 'rgba(255, 255, 255, 84%)',
      low: 'rgba(255, 255, 255, 64%)',
    },
    primary: {
      normal: '#ffffff',
    },
  },

  user_colors: [
    'hsl(208, 100%, 58%)',
    'hsl(301, 80%, 70%)',
    'hsl(163, 93%, 41%)',
    'hsl(343, 91%, 66%)',
    'hsl(24, 90%, 67%)',
    'hsl(181, 90%, 50%)',
    'hsl(243, 100%, 74%)',
    'hsl(94, 66%, 50%)',
  ],

  shadow_and_overlay: {
    background_overlay: 'rgba(0, 0, 0, 60%)',
    background_overlay_low: 'rgba(0, 0, 0, 80%)',

    box_shadow_popup: '0 0 16px rgba(0, 0, 0, 25%)',

    box_shadow_surface_border: 'inset 0 0 0 1px var(--bg-surface-border)',
    box_shadow_surface_outline: '0 0 0 2px var(--bg-surface-border)',

    box_shadow_primary_border: 'inset 0 0 0 1px var(--bg-primary-border)',
    box_shadow_primary_outline: '0 0 0 2px var(--bg-primary-border)',
  },
};

export const AYU_THEME: ThemeStyle = {
  ...CLASSIC_THEME,
  background: {
    ...CLASSIC_THEME.background,
    surface: '#0b0e14',
    surface_transparent: '#0b0e14',
    surface_low: '#0f131a',
    surface_low_transparent: '#0f131a',
    surface_extra_low: '#11151c',
    surface_extra_low_transparent: '#11151c',

    badge: '#c4c1ab',
  },

  text_color: {
    ...CLASSIC_THEME.text_color,
    surface: {
      high: 'rgb(255, 251, 222)',
      normal: 'rgba(255, 251, 222, 94%)',
      normal_low: 'rgba(255, 251, 222, 60%)',
      low: 'rgba(255, 251, 222, 58%)',
    },
  },
  system_icons: {
    ...CLASSIC_THEME.system_icons,
    surface: {
      high: 'rgb(255, 251, 222)',
      normal: 'rgba(255, 251, 222, 84%)',
      low: 'rgba(255, 251, 222, 64%)',
    },
  },
};

export const BUTTER_THEME: ThemeStyle = {
  ...CLASSIC_THEME,
  background: {
    ...CLASSIC_THEME.background,
    surface: 'hsl(64, 6%, 14%)',
    surface_transparent: 'hsla(64, 6%, 14%, 0)',
    surface_low: 'hsl(64, 6%, 10%)',
    surface_low_transparent: 'hsla(64, 6%, 10%, 0)',
    surface_extra_low: 'hsl(64, 6%, 8%)',
    surface_extra_low_transparent: 'hsla(64, 6%, 8%, 0)',

    badge: '#c4c1ab',
  },
  text_color: {
    ...CLASSIC_THEME.text_color,
    surface: {
      high: 'rgba(255, 251, 222, 94%)',
      normal: 'rgba(255, 251, 222, 94%)',
      normal_low: 'rgba(255, 251, 222, 60%)',
      low: 'rgba(255, 251, 222, 58%)',
    },
  },
  system_icons: {
    ...CLASSIC_THEME.system_icons,
    surface: {
      high: 'rgb(255, 251, 222)',
      normal: 'rgba(255, 251, 222, 84%)',
      low: 'rgba(255, 251, 222, 64%)',
    },
  },
};

export const SILVER_THEME: ThemeStyle = {
  ...LIGHT_THEME,
  background: {
    ...LIGHT_THEME.background,
    surface: 'hsl(0, 0%, 95%)',
    surface_transparent: 'hsla(0, 0%, 95%, 0)',
    surface_low: 'hsl(0, 0%, 91%)',
    surface_low_transparent: 'hsla(0, 0%, 91%, 0)',
    surface_extra_low: 'hsl(0, 0%, 91%)',
    surface_extra_low_transparent: 'hsla(0, 0%, 91%, 0)',
  },
};
