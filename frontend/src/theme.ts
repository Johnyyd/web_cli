import { ThemeName, ThemeColors, UISettings } from './types';

export const THEME_PALETTES: Record<ThemeName, ThemeColors> = {
  'ubuntu-green': {
    name: 'Ubuntu Green (Default)',
    bg: '#0c0c0c',
    text: '#e0e0e0',
    prompt: '#00ff66',
    link: '#33ccff',
    error: '#ff3333',
    success: '#00ff66',
    dim: '#555555',
    glow: 'rgba(0, 255, 102, 0.3)',
  },
  'cyberpunk': {
    name: 'Cyberpunk Neon',
    bg: '#0d0221',
    text: '#00f0ff',
    prompt: '#ff007f',
    link: '#39ff14',
    error: '#ff003c',
    success: '#00ffcc',
    dim: '#4a2e65',
    glow: 'rgba(255, 0, 127, 0.4)',
  },
  'matrix': {
    name: 'Matrix Hacker',
    bg: '#000000',
    text: '#00cc00',
    prompt: '#00ff00',
    link: '#70ff70',
    error: '#ff3333',
    success: '#00ff00',
    dim: '#004400',
    glow: 'rgba(0, 255, 0, 0.4)',
  },
  'dracula': {
    name: 'Dracula Dark',
    bg: '#282a36',
    text: '#f8f8f2',
    prompt: '#50fa7b',
    link: '#8be9fd',
    error: '#ff5555',
    success: '#50fa7b',
    dim: '#6272a4',
    glow: 'rgba(80, 250, 123, 0.3)',
  },
  'solarized-amber': {
    name: 'Solarized Amber',
    bg: '#073642',
    text: '#839496',
    prompt: '#b58900',
    link: '#268bd2',
    error: '#dc322f',
    success: '#859900',
    dim: '#586e75',
    glow: 'rgba(181, 137, 0, 0.3)',
  },
  'red-alert': {
    name: 'Red Alert (Root Mode)',
    bg: '#1a0000',
    text: '#ff9999',
    prompt: '#ff3333',
    link: '#ff6666',
    error: '#ff0000',
    success: '#ff4444',
    dim: '#661111',
    glow: 'rgba(255, 51, 51, 0.4)',
  },
};

const SETTINGS_KEY = 'terminal_settings_v1';

export const loadSettings = (): UISettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.theme === 'string' && THEME_PALETTES[parsed.theme as ThemeName]) {
        return {
          theme: parsed.theme as ThemeName,
          crtEffect: typeof parsed.crtEffect === 'boolean' ? parsed.crtEffect : true,
          backgroundAnim: parsed.backgroundAnim === 'matrix' ? 'matrix' : 'none',
          sound: typeof parsed.sound === 'boolean' ? parsed.sound : false,
          hardwareBorder: typeof parsed.hardwareBorder === 'boolean' ? parsed.hardwareBorder : false,
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse stored settings:', err);
  }
  return {
    theme: 'ubuntu-green',
    crtEffect: true,
    backgroundAnim: 'none',
    sound: false,
    hardwareBorder: false,
  };
};

export const saveSettings = (settings: UISettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
};
