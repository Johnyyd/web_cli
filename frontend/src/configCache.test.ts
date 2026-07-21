import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadCachedConfig, saveCachedConfig } from './configCache';
import { TerminalConfig } from './types';

describe('configCache utility', () => {
  const mockConfig: TerminalConfig = {
    username: 'testuser',
    hostname: 'testhost',
    welcomeMessage: 'Welcome',
    userInfo: { name: 'Test', role: 'Dev', bio: 'Bio' },
    skills: [],
    projects: [],
    apiEndpoint: 'http://localhost'
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('returns null when no cache exists', () => {
    expect(loadCachedConfig()).toBeNull();
  });

  it('saves config and loads it within TTL', () => {
    saveCachedConfig(mockConfig);
    expect(loadCachedConfig()).toEqual(mockConfig);
  });

  it('returns null when cache is expired (> 5 minutes)', () => {
    vi.useFakeTimers();
    saveCachedConfig(mockConfig);
    vi.advanceTimersByTime(300_001); // 5 min + 1ms
    expect(loadCachedConfig()).toBeNull();
  });
});
