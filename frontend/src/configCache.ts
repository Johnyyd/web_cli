import { TerminalConfig } from './types';

export const CONFIG_CACHE_KEY = 'terminal_config_v1';
export const CONFIG_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  timestamp: number;
  config: TerminalConfig;
}

export const loadCachedConfig = (): TerminalConfig | null => {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CONFIG_TTL_MS) {
      localStorage.removeItem(CONFIG_CACHE_KEY);
      return null;
    }
    return parsed.config;
  } catch (err) {
    console.error('Failed to load cached config:', err);
    return null;
  }
};

export const saveCachedConfig = (config: TerminalConfig): void => {
  try {
    const data: CachedData = {
      timestamp: Date.now(),
      config,
    };
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save cached config:', err);
  }
};
