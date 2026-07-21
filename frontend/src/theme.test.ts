import { describe, it, expect, beforeEach } from 'vitest';
import { THEME_PALETTES, loadSettings, saveSettings } from './theme';
import { UISettings } from './types';

describe('Theme Utilities & Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default settings when localStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual({
      theme: 'ubuntu-green',
      crtEffect: true,
      backgroundAnim: 'none',
      sound: false,
      hardwareBorder: false,
    });
  });

  it('saves and loads customized settings cleanly', () => {
    const custom: UISettings = {
      theme: 'cyberpunk',
      crtEffect: false,
      backgroundAnim: 'matrix',
      sound: true,
      hardwareBorder: true,
    };
    saveSettings(custom);
    expect(loadSettings()).toEqual(custom);
  });

  it('contains all 5 theme palettes with required token keys', () => {
    const themes = ['ubuntu-green', 'cyberpunk', 'matrix', 'dracula', 'solarized-amber'] as const;
    themes.forEach((t) => {
      expect(THEME_PALETTES[t]).toBeDefined();
      expect(THEME_PALETTES[t].name).toBeTypeOf('string');
      expect(THEME_PALETTES[t].prompt).toBeTypeOf('string');
      expect(THEME_PALETTES[t].bg).toBeTypeOf('string');
    });
  });
});
