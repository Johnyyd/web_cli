import { ReactNode } from 'react';

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  url?: string;
  techStack: string[];
}

export interface UserInfo {
  name: string;
  role: string;
  bio: string;
}

export type ThemeName = 'ubuntu-green' | 'cyberpunk' | 'matrix' | 'dracula' | 'solarized-amber' | 'red-alert';

export interface ThemeColors {
  name: string;
  bg: string;
  text: string;
  prompt: string;
  link: string;
  error: string;
  success: string;
  dim: string;
  glow: string;
}

export interface UISettings {
  theme: ThemeName;
  crtEffect: boolean;
  backgroundAnim: 'none' | 'matrix';
  sound: boolean;
  hardwareBorder: boolean;
}

export interface TerminalConfig {
  username: string;
  hostname: string;
  welcomeMessage: string;
  userInfo: UserInfo;
  skills: SkillCategory[];
  projects: ProjectItem[];
  apiEndpoint: string;
  defaultTheme?: ThemeName;
  virtualFiles?: Record<string, string | { content: string; url?: string }>;
}

export interface CommandLog {
  id: string;
  prompt: string;
  command: string;
  output: ReactNode;
  timestamp: Date;
}
