import React, { useState, useEffect, useRef } from 'react';
import { UISettings, ThemeName } from './types';
import { THEME_PALETTES } from './theme';

interface StatusBarProps {
  username: string;
  hostname: string;
  settings: UISettings;
  onRunCommand: (cmd: string) => void;
  onToggleCRT: () => void;
  onToggleMatrix?: () => void;
  onToggleSound?: () => void;
  onToggleFrame?: () => void;
  onChangeTheme: (theme: ThemeName) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  username,
  hostname,
  settings,
  onRunCommand,
  onToggleCRT,
  onToggleMatrix,
  onToggleSound,
  onToggleFrame,
  onChangeTheme,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cpuLoad, setCpuLoad] = useState<number>(12);
  const [ramUsage, setRamUsage] = useState<number>(1.42);
  const [ping, setPing] = useState<number>(14);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const statsTimer = setInterval(() => {
      // Simulate realistic CPU load fluctuation (between 5% and 48%, with occasional bursts)
      setCpuLoad((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
        let next = prev + delta;
        if (next < 5) next = 5 + Math.floor(Math.random() * 6);
        if (next > 45) next = 36 - Math.floor(Math.random() * 6);
        // Occasional processing spike
        if (Math.random() < 0.15) next += Math.floor(Math.random() * 18);
        return Math.min(Math.max(next, 4), 72);
      });

      // Simulate realistic RAM usage floating around 1.35 - 1.68 GB
      setRamUsage((prev) => {
        const delta = (Math.random() * 0.04 - 0.02); // -0.02 to +0.02
        let next = prev + delta;
        if (next < 1.32) next = 1.36;
        if (next > 1.75) next = 1.68;
        return Number(next.toFixed(2));
      });

      // Simulate realistic 5G latency (11ms - 26ms)
      setPing((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(Math.max(prev + delta, 9), 28);
      });
    }, 1500);

    return () => clearInterval(statsTimer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    };
    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeDropdown]);

  const themes = Object.keys(THEME_PALETTES) as ThemeName[];

  return (
    <header
      className="w-full min-h-[36px] bg-terminal-bg/95 border-b border-terminal-dim/40 flex flex-wrap items-center justify-between px-3 md:px-4 py-1 text-xs font-mono select-none z-50 sticky top-0 shadow-md transition-colors duration-300"
      style={{
        backgroundColor: THEME_PALETTES[settings.theme].bg,
        borderColor: THEME_PALETTES[settings.theme].dim,
        color: THEME_PALETTES[settings.theme].text,
      }}
    >
      {/* Left section: Host & Quick Actions (removed overflow-x-auto to prevent clipping dropdown) */}
      <div className="flex items-center gap-2 md:gap-4 flex-wrap py-0.5">
        <span className="font-bold flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => onRunCommand('clear')}
            className="group w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/90 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-[0_0_4px_rgba(255,95,86,0.6)] hover:shadow-[0_0_8px_rgba(255,95,86,1)] hover:scale-110"
            title="Reset & Clear Terminal [clear]"
            aria-label="Clear terminal"
          >
            <span className="text-[9px] leading-none font-bold text-black/80 opacity-0 group-hover:opacity-100 transition-opacity select-none">×</span>
          </button>
          <button
            onClick={() => onToggleFrame && onToggleFrame()}
            className="group w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/90 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-[0_0_4px_rgba(255,189,46,0.6)] hover:shadow-[0_0_8px_rgba(255,189,46,1)] hover:scale-110"
            title="Toggle Retro Hardware Bezel [Frame: ON/OFF]"
            aria-label="Toggle hardware frame"
          >
            <span className="text-[9px] leading-none font-bold text-black/80 opacity-0 group-hover:opacity-100 transition-opacity select-none">−</span>
          </button>
          <button
            onClick={() => {
              try {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              } catch {
                // Ignore fullscreen errors in test/jsdom environments
              }
            }}
            className="group w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/90 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer mr-1 shadow-[0_0_4px_rgba(39,201,63,0.6)] hover:shadow-[0_0_8px_rgba(39,201,63,1)] hover:scale-110"
            title="Toggle Fullscreen Mode"
            aria-label="Toggle fullscreen mode"
          >
            <span className="text-[9px] leading-none font-bold text-black/80 opacity-0 group-hover:opacity-100 transition-opacity select-none">+</span>
          </button>
          <span style={{ color: THEME_PALETTES[settings.theme].prompt }}>{username}@{hostname}:~</span>
        </span>

        <div className="h-4 w-[1px] bg-terminal-dim/40 mx-1 hidden sm:block" />

        <button
          onClick={() => onRunCommand('guide')}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Interactive walkthrough"
        >
          [?] Guide
        </button>

        <button
          onClick={() => onRunCommand('help')}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Clickable command table"
        >
          [i] Help
        </button>

        <button
          onClick={onToggleCRT}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Toggle CRT scanlines & curvature"
        >
          [*] CRT: {settings.crtEffect ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onToggleMatrix}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Toggle Matrix rain background animation"
        >
          [~] Matrix: {settings.backgroundAnim === 'matrix' ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onToggleSound}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Toggle mechanical keyboard clicks and BIOS beeps"
        >
          [♫] Sound: {settings.sound ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={onToggleFrame}
          className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap"
          title="Toggle retro CRT hardware monitor bezel"
        >
          [🖥️] Frame: {settings.hardwareBorder ? 'ON' : 'OFF'}
        </button>

        {/* Theme Selector Dropdown */}
        <div className="relative inline-block" ref={dropdownRef}>
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            className="px-2 py-0.5 rounded border border-terminal-dim/50 hover:border-terminal-prompt hover:bg-terminal-dim/20 transition-all whitespace-nowrap flex items-center gap-1"
          >
            [#] Theme: {THEME_PALETTES[settings.theme].name.split(' ')[0]}
          </button>

          {showThemeDropdown && (
            <div
              className="absolute left-0 mt-1 w-48 py-1.5 rounded shadow-lg border z-50 flex flex-col gap-1"
              style={{
                backgroundColor: THEME_PALETTES[settings.theme].bg,
                borderColor: THEME_PALETTES[settings.theme].prompt,
              }}
            >
              {themes.map((tName) => (
                <button
                  key={tName}
                  onClick={() => {
                    onChangeTheme(tName);
                    setShowThemeDropdown(false);
                  }}
                  className="text-left px-3 py-1.5 hover:bg-terminal-dim/30 transition-colors flex items-center justify-between"
                  style={{ color: THEME_PALETTES[tName].prompt }}
                >
                  <span>{THEME_PALETTES[tName].name}</span>
                  {settings.theme === tName && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section: System Monitor & Clock */}
      <div className="hidden lg:flex items-center gap-4 whitespace-nowrap text-terminal-text/80">
        <span className="flex items-center gap-1.5" title={`5G Network Latency: ${ping}ms`}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>5G Online <span className="text-[10px] opacity-75">({ping}ms)</span></span>
        </span>
        <span className={`font-mono min-w-[72px] transition-colors duration-300 ${cpuLoad > 40 ? 'text-yellow-400 font-bold' : ''}`} title="Virtual Web CPU Load">
          CPU: {cpuLoad}%
        </span>
        <span className="font-mono min-w-[115px] transition-colors duration-300" title="Memory Allocation">
          RAM: {ramUsage.toFixed(2)}/16 GB
        </span>
        <span className="font-bold ml-1">{timeStr || '12:00:00'}</span>
      </div>
    </header>
  );
};

export default StatusBar;
