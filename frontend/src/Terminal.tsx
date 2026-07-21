import React, { useState, useEffect, useRef } from 'react';
import { TerminalConfig, CommandLog, UISettings, ThemeName } from './types';
import { THEME_PALETTES, loadSettings, saveSettings } from './theme';
import { loadCachedConfig, saveCachedConfig } from './configCache';
import StatusBar from './StatusBar';
import CRTEffect from './CRTEffect';
import MatrixRain from './MatrixRain';
import HardwareBorder from './HardwareBorder';
import GlitchEffect from './GlitchEffect';
import { playKeyClick, playBeep } from './soundEffects';

const STATIC_COMMANDS = ['help', 'guide', 'neofetch', 'system', 'whoami', 'projects', 'skills', 'theme', 'matrix', 'crt', 'clear', 'leave-message', 'mail', 'ls', 'cat', 'open', 'cd', 'sudo', 'hack', 'exit'];

const Terminal: React.FC = () => {
  const [config, setConfig] = useState<TerminalConfig | null>(() => loadCachedConfig());
  const [settings, setSettings] = useState<UISettings>(() => loadSettings());
  const [history, setHistory] = useState<CommandLog[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [input, setInput] = useState<string>('');
  const [loadingConfig, setLoadingConfig] = useState<boolean>(() => loadCachedConfig() === null);
  const [isRoot, setIsRoot] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);

  const triggerGlitch = () => {
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 600);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const updateSettings = (newSettings: UISettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Load config on startup (stale-while-revalidate if cached, or initial fetch if not)
  useEffect(() => {
    const cached = loadCachedConfig();
    if (cached) {
      if (cached.defaultTheme && THEME_PALETTES[cached.defaultTheme]) {
        const loaded = loadSettings();
        if (!localStorage.getItem('terminal_settings_v1')) {
          updateSettings({ ...loaded, theme: cached.defaultTheme });
        }
      }
      setHistory([
        {
          id: 'welcome-msg',
          prompt: '',
          command: '',
          output: (
            <div className="mb-2 text-terminal-prompt font-bold" style={{ color: THEME_PALETTES[settings.theme]?.prompt }}>
              {cached.welcomeMessage}
            </div>
          ),
          timestamp: new Date(),
        },
      ]);
    }

    fetch('/terminal.config.json')
      .then((res) => res.json())
      .then((data: TerminalConfig) => {
        saveCachedConfig(data);
        if (!cached) {
          setConfig(data);
          if (data.defaultTheme && THEME_PALETTES[data.defaultTheme]) {
            const loaded = loadSettings();
            if (!localStorage.getItem('terminal_settings_v1')) {
              updateSettings({ ...loaded, theme: data.defaultTheme });
            }
          }
          setHistory([
            {
              id: 'welcome-msg',
              prompt: '',
              command: '',
              output: (
                <div className="mb-2 text-terminal-prompt font-bold" style={{ color: THEME_PALETTES[settings.theme]?.prompt }}>
                  {data.welcomeMessage}
                </div>
              ),
              timestamp: new Date(),
            },
          ]);
          setLoadingConfig(false);
        } else {
          setConfig(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load configuration:', err);
        setLoadingConfig(false);
      });
  }, []);

  // Auto-focus hidden input on click and on load
  const focusInput = () => {
    inputRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    focusInput();
  }, [loadingConfig]);

  // Auto-scroll to bottom only when new history items arrive
  useEffect(() => {
    try {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {
      // jsdom environment does not implement scrollIntoView
    }
  }, [history]);

  // Handle Dynamic Command Execution (leave-message / mail)
  const handleDynamicCommand = async (
    cmdName: string,
    argsString: string,
    currentPrompt: string,
    rawCmd: string
  ) => {
    if (!config) return;

    let senderName = `Guest (${config.username})`;
    let messageContent = '';

    if (cmdName === 'mail') {
      const mailRegex = /^\s*-s\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s+(?:"([^"]+)"|'([^']+)'|(.+))\s*$/;
      const match = argsString.match(mailRegex);
      if (match) {
        senderName = match[1] || match[2] || match[3] || senderName;
        messageContent = match[4] || match[5] || match[6] || '';
      } else {
        messageContent = argsString.replace(/["']/g, '').trim();
      }
    } else if (cmdName === 'leave-message') {
      const nameFlagRegex = /^\s*-n\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s+(.+)$/;
      const match = argsString.match(nameFlagRegex);
      if (match) {
        senderName = match[1] || match[2] || match[3] || senderName;
        messageContent = match[4].replace(/^["']|["']$/g, '').trim();
      } else {
        messageContent = argsString.replace(/^["']|["']$/g, '').trim();
      }
    }

    if (!messageContent) {
      const errorLog: CommandLog = {
        id: Math.random().toString(36).substring(2, 9),
        prompt: currentPrompt,
        command: rawCmd,
        output: (
          <div style={{ color: THEME_PALETTES[settings.theme].error }}>
            [ERROR] Message content cannot be empty. Usage: `{cmdName} {cmdName === 'mail' ? '-s "Name" "Message"' : '[-n "Name"] <message>'}`
          </div>
        ),
        timestamp: new Date(),
      };
      setHistory((prev) => [...prev, errorLog]);
      return;
    }

    const logId = Math.random().toString(36).substring(2, 9);
    const pendingLog: CommandLog = {
      id: logId,
      prompt: currentPrompt,
      command: rawCmd,
      output: (
        <div className="animate-pulse" style={{ color: THEME_PALETTES[settings.theme].link }}>
          [SENDING] Delivering message to server ({config.apiEndpoint})...
        </div>
      ),
      timestamp: new Date(),
    };
    setHistory((prev) => [...prev, pendingLog]);

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: senderName,
          content: messageContent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      setHistory((prev) =>
        prev.map((item) =>
          item.id === logId
            ? {
                ...item,
                output: (
                  <div style={{ color: THEME_PALETTES[settings.theme].success }}>
                    [SUCCESS] {resData.message || 'Message safely stored!'}
                  </div>
                ),
              }
            : item
        )
      );
    } catch (err: any) {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === logId
            ? {
                ...item,
                output: (
                  <div style={{ color: THEME_PALETTES[settings.theme].error }}>
                    [ERROR] Failed to send message: {err.message || 'Network error'}
                  </div>
                ),
              }
            : item
        )
      );
    }
  };

  // Handle Command Submission
  const processCommand = (rawCommand: string) => {
    if (!config) return;
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const promptStr = isRoot ? `root@${config.hostname}:#` : `${config.username}@${config.hostname}:~$`;
    const parts = trimmed.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const argsString = trimmed.slice(cmdName.length).trim();

    if (cmdName === 'clear') {
      setHistory([]);
      return;
    }

    if (cmdName === 'leave-message' || cmdName === 'mail') {
      handleDynamicCommand(cmdName, argsString, promptStr, trimmed);
      return;
    }

    let outputNode: React.ReactNode = null;
    const currentTheme = THEME_PALETTES[settings.theme];

    switch (cmdName) {
      case 'help':
        outputNode = (
          <div className="space-y-1 my-1">
            <div className="font-bold" style={{ color: currentTheme.prompt }}>Available Commands:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-2">
              <div>
                <button onClick={() => processCommand('help')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>help</button> : Show this help message
              </div>
              <div>
                <button onClick={() => processCommand('guide')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>guide</button> : Interactive system walkthrough
              </div>
              <div>
                <button onClick={() => processCommand('neofetch')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>neofetch / system</button> : Display system specifications & OS logo
              </div>
              <div>
                <button onClick={() => processCommand('whoami')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>whoami</button> : Display personal profile & bio
              </div>
              <div>
                <button onClick={() => processCommand('projects')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>projects</button> : List featured open-source projects
              </div>
              <div>
                <button onClick={() => processCommand('skills')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>skills</button> : Display technical expertise breakdown
              </div>
              <div>
                <button onClick={() => processCommand('theme')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>theme [name]</button> : Switch color palette (e.g. cyberpunk)
              </div>
              <div>
                <button onClick={() => processCommand('matrix on')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>matrix [on|off]</button> : Toggle Matrix rain animation
              </div>
              <div>
                <button onClick={() => processCommand('crt on')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>crt [on|off]</button> : Toggle retro CRT scanlines & curvature
              </div>
              <div>
                <button onClick={() => processCommand('ls')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>ls / cat &lt;file&gt;</button> : Explore virtual filesystem
              </div>
              <div>
                <button onClick={() => processCommand('sudo su')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>sudo su / hack</button> : Elevate privileges to Hacker Mode
              </div>
              <div>
                <button onClick={() => processCommand('clear')} className="font-semibold hover:underline text-left" style={{ color: currentTheme.link }}>clear</button> : Clear terminal output screen
              </div>
              <div>
                <span className="font-semibold" style={{ color: currentTheme.link }}>leave-message &lt;msg&gt;</span> : Send feedback to database
              </div>
              <div>
                <span className="font-semibold" style={{ color: currentTheme.link }}>mail -s &lt;name&gt; &lt;msg&gt;</span> : Send structured mail
              </div>
            </div>
          </div>
        );
        playBeep('success', settings.sound);
        break;

      case 'guide':
        outputNode = (
          <div
            className="my-2 p-3 rounded space-y-3 pl-4 border"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.dim,
            }}
          >
            <div className="font-bold text-base" style={{ color: currentTheme.prompt }}>
              Interactive System Walkthrough
            </div>
            <p className="text-sm opacity-90">
              Follow these interactive steps to explore Alex Developer's profile and terminal features:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border" style={{ borderColor: currentTheme.dim }}>
                <span><strong>Step 1: Discover Developer Profile</strong> — View background and bio</span>
                <button
                  onClick={() => processCommand('whoami')}
                  className="mt-1 sm:mt-0 px-3 py-1 rounded transition-all font-semibold border"
                  style={{ color: currentTheme.prompt, borderColor: currentTheme.prompt }}
                >
                  Run whoami
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border" style={{ borderColor: currentTheme.dim }}>
                <span><strong>Step 2: Explore Projects</strong> — Check open-source portfolios</span>
                <button
                  onClick={() => processCommand('projects')}
                  className="mt-1 sm:mt-0 px-3 py-1 rounded transition-all font-semibold border"
                  style={{ color: currentTheme.prompt, borderColor: currentTheme.prompt }}
                >
                  Run projects
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border" style={{ borderColor: currentTheme.dim }}>
                <span><strong>Step 3: Check Technical Skills</strong> — Review languages and tools</span>
                <button
                  onClick={() => processCommand('skills')}
                  className="mt-1 sm:mt-0 px-3 py-1 rounded transition-all font-semibold border"
                  style={{ color: currentTheme.prompt, borderColor: currentTheme.prompt }}
                >
                  Run skills
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded border" style={{ borderColor: currentTheme.dim }}>
                <span><strong>Step 4: Customize Aesthetics</strong> — Try Matrix Rain animation</span>
                <button
                  onClick={() => processCommand('matrix on')}
                  className="mt-1 sm:mt-0 px-3 py-1 rounded transition-all font-semibold border"
                  style={{ color: currentTheme.prompt, borderColor: currentTheme.prompt }}
                >
                  Run matrix on
                </button>
              </div>
            </div>
          </div>
        );
        playBeep('success', settings.sound);
        break;

      case 'neofetch':
      case 'system':
        outputNode = (
          <div className="my-2 p-3 border rounded flex flex-col md:flex-row items-center md:items-start gap-4 font-mono text-xs sm:text-sm" style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.dim }}>
            <pre className="font-bold leading-none select-none text-center md:text-left" style={{ color: currentTheme.prompt }}>
{`            .-/+oossssoo+/-.
        \`:+ssssssssssssssssss+:\`
      -+ssssssssssssssssssyyssss+-
    .ossssssssssssssssssdMMMNysssso.
   /ssssssssssshdmmNNmmyNMMMMhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
 /sssssssshNMMMyhhyyyyhmNMMMNhssssss/
.ssssssssdMMMNhsssssssssshNMMMdssssss.
+sssshhhyNMMNyssssssssssssyNMMMysssss+
ossyNMMMNyMMhsssssssssssssshmmmhssssso
ossyNMMMNyMMhsssssssssssssshmmmhssssso
+sssshhhyNMMNyssssssssssssyNMMMysssss+
.ssssssssdMMMNhsssssssssshNMMMdssssss.
 /sssssssshNMMMyhhyyyyhdNMMMNhssssss/
  +ssssssssshmydMMMMMMMNddddyssssssss+
   /ssssssssssshdmmNNmmyNMMMMhssssss/
    .ossssssssssssssssssdMMMNysssso.
      -+ssssssssssssssssssyyssss+-
        \`:+ssssssssssssssssss+:\`
            .-/+oossssoo+/-.`}
            </pre>
            <div className="space-y-1 w-full overflow-x-auto">
              <div className="font-bold border-b pb-1 mb-2" style={{ color: currentTheme.prompt, borderColor: currentTheme.dim }}>
                {config.username}@{config.hostname}
              </div>
              <div><strong style={{ color: currentTheme.link }}>OS:</strong> Ubuntu 24.04 LTS x86_64</div>
              <div><strong style={{ color: currentTheme.link }}>Host:</strong> Interactive Terminal Web v1.0.0</div>
              <div><strong style={{ color: currentTheme.link }}>Kernel:</strong> Linux 6.8.0-31-generic (WebAssembly)</div>
              <div><strong style={{ color: currentTheme.link }}>Uptime:</strong> 99.9% Online</div>
              <div><strong style={{ color: currentTheme.link }}>Packages:</strong> 42 (npm), 18 (pip)</div>
              <div><strong style={{ color: currentTheme.link }}>Shell:</strong> WebShell 1.0 (React/TypeScript)</div>
              <div><strong style={{ color: currentTheme.link }}>Resolution:</strong> 1920x1080 (Responsive CRT)</div>
              <div><strong style={{ color: currentTheme.link }}>Theme:</strong> {THEME_PALETTES[settings.theme]?.name || settings.theme}</div>
              <div><strong style={{ color: currentTheme.link }}>Terminal:</strong> Linux Virtual Terminal</div>
              <div><strong style={{ color: currentTheme.link }}>CPU:</strong> Virtual Web Threads (8) @ 3.60GHz</div>
              <div><strong style={{ color: currentTheme.link }}>Memory:</strong> 1420MiB / 16384MiB</div>
              <div className="pt-3 flex flex-col gap-0.5 select-none">
                <div className="flex">
                  <span className="w-5 h-4 inline-block bg-[#333333]"></span>
                  <span className="w-5 h-4 inline-block bg-[#cc0000]"></span>
                  <span className="w-5 h-4 inline-block bg-[#4e9a06]"></span>
                  <span className="w-5 h-4 inline-block bg-[#c4a000]"></span>
                  <span className="w-5 h-4 inline-block bg-[#3465a4]"></span>
                  <span className="w-5 h-4 inline-block bg-[#75507b]"></span>
                  <span className="w-5 h-4 inline-block bg-[#06989a]"></span>
                  <span className="w-5 h-4 inline-block bg-[#d3d7cf]"></span>
                </div>
                <div className="flex">
                  <span className="w-5 h-4 inline-block bg-[#555753]"></span>
                  <span className="w-5 h-4 inline-block bg-[#ef2929]"></span>
                  <span className="w-5 h-4 inline-block bg-[#8ae234]"></span>
                  <span className="w-5 h-4 inline-block bg-[#fce94f]"></span>
                  <span className="w-5 h-4 inline-block bg-[#729fcf]"></span>
                  <span className="w-5 h-4 inline-block bg-[#ad7fa8]"></span>
                  <span className="w-5 h-4 inline-block bg-[#34e2e2]"></span>
                  <span className="w-5 h-4 inline-block bg-[#eeeeec]"></span>
                </div>
              </div>
            </div>
          </div>
        );
        playBeep('success', settings.sound);
        break;

      case 'whoami':
        outputNode = (
          <div
            className="my-2 p-3 border rounded space-y-1 pl-4"
            style={{
              backgroundColor: currentTheme.bg,
              borderColor: currentTheme.dim,
            }}
          >
            <div className="text-lg font-bold" style={{ color: currentTheme.prompt }}>{config.userInfo.name}</div>
            <div className="font-medium" style={{ color: currentTheme.link }}>{config.userInfo.role}</div>
            <p className="mt-2 leading-relaxed opacity-95">{config.userInfo.bio}</p>
          </div>
        );
        playBeep('success', settings.sound);
        break;

      case 'projects':
        outputNode = (
          <div className="my-2 space-y-3 pl-2">
            <div className="font-bold" style={{ color: currentTheme.prompt }}>Featured Projects:</div>
            <div className="space-y-3">
              {config.projects.map((proj, idx) => (
                <div key={idx} className="border-l-2 pl-3 py-1" style={{ borderColor: currentTheme.prompt }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base">{proj.name}</span>
                    {proj.url && (
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-sm"
                        style={{ color: currentTheme.link }}
                      >
                        [{proj.url}]
                      </a>
                    )}
                  </div>
                  <p className="opacity-90 text-sm mt-1">{proj.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {proj.techStack.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-1.5 py-0.5 text-xs rounded border"
                        style={{ color: currentTheme.prompt, borderColor: currentTheme.dim }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case 'skills':
        outputNode = (
          <div className="my-2 space-y-3 pl-2">
            <div className="font-bold" style={{ color: currentTheme.prompt }}>Technical Expertise:</div>
            <div className="space-y-2">
              {config.skills.map((cat, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                  <span className="font-semibold min-w-[180px]" style={{ color: currentTheme.link }}>[{cat.category}]:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, iIdx) => (
                      <span key={iIdx} className="font-mono">
                        {item}{iIdx < cat.items.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;

      case 'theme': {
        const themeName = parts[1]?.toLowerCase() as ThemeName;
        if (themeName && THEME_PALETTES[themeName]) {
          updateSettings({ ...settings, theme: themeName });
          triggerGlitch();
          playBeep('success', settings.sound);
          outputNode = (
            <div style={{ color: THEME_PALETTES[themeName].success }}>
              Switched theme to {THEME_PALETTES[themeName].name}.
            </div>
          );
        } else {
          playBeep('error', settings.sound);
          outputNode = (
            <div className="space-y-1 my-1 pl-2">
              <div className="font-bold" style={{ color: currentTheme.prompt }}>Available Themes:</div>
              {Object.keys(THEME_PALETTES).map((tKey) => (
                <div key={tKey}>
                  <button
                    onClick={() => processCommand(`theme ${tKey}`)}
                    className="hover:underline font-semibold"
                    style={{ color: currentTheme.link }}
                  >
                    {tKey}
                  </button> : {THEME_PALETTES[tKey as ThemeName].name} {settings.theme === tKey ? '(active)' : ''}
                </div>
              ))}
              <div className="text-xs mt-2" style={{ color: currentTheme.dim }}>Usage: `theme &lt;theme-name&gt;`</div>
            </div>
          );
        }
        break;
      }

      case 'matrix': {
        const mode = parts[1]?.toLowerCase();
        if (mode === 'on' || mode === 'true' || mode === 'matrix') {
          updateSettings({ ...settings, backgroundAnim: 'matrix' });
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.success }}>Matrix Rain background animation: ON</div>;
        } else if (mode === 'off' || mode === 'false' || mode === 'none') {
          updateSettings({ ...settings, backgroundAnim: 'none' });
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.success }}>Matrix Rain background animation: OFF</div>;
        } else {
          playBeep('error', settings.sound);
          outputNode = (
            <div>
              Matrix Rain status: <span className="font-bold" style={{ color: currentTheme.prompt }}>{settings.backgroundAnim === 'matrix' ? 'ON' : 'OFF'}</span>. Usage: `matrix on` or `matrix off`
            </div>
          );
        }
        break;
      }

      case 'crt': {
        const mode = parts[1]?.toLowerCase();
        if (mode === 'on' || mode === 'true') {
          updateSettings({ ...settings, crtEffect: true });
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.success }}>CRT Scanlines & Curvature effect: ON</div>;
        } else if (mode === 'off' || mode === 'false') {
          updateSettings({ ...settings, crtEffect: false });
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.success }}>CRT Scanlines & Curvature effect: OFF</div>;
        } else {
          playBeep('error', settings.sound);
          outputNode = (
            <div>
              CRT Effect status: <span className="font-bold" style={{ color: currentTheme.prompt }}>{settings.crtEffect ? 'ON' : 'OFF'}</span>. Usage: `crt on` or `crt off`
            </div>
          );
        }
        break;
      }

      case 'sudo':
      case 'hack': {
        if (cmdName === 'hack' || argsString.startsWith('su') || !argsString || argsString === 'hack') {
          setIsRoot(true);
          updateSettings({ ...settings, theme: 'red-alert' });
          triggerGlitch();
          playBeep('success', settings.sound);
          outputNode = (
            <div style={{ color: THEME_PALETTES['red-alert'].prompt }}>
              Root access granted. System privileges elevated to UID 0. Welcome to Hacker Mode! Type `exit` to return.
            </div>
          );
        } else {
          playBeep('error', settings.sound);
          outputNode = (
            <div style={{ color: currentTheme.error }}>
              sudo: {argsString}: command not found
            </div>
          );
        }
        break;
      }

      case 'exit': {
        if (isRoot) {
          setIsRoot(false);
          const targetTheme = config.defaultTheme && THEME_PALETTES[config.defaultTheme] ? config.defaultTheme : 'ubuntu-green';
          updateSettings({ ...settings, theme: targetTheme });
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.success }}>Logged out from root session. Returned to normal privileges.</div>;
        } else {
          playBeep('success', settings.sound);
          outputNode = <div style={{ color: currentTheme.dim }}>Session closed. Refresh page to reopen terminal.</div>;
        }
        break;
      }

      case 'ls': {
        playBeep('success', settings.sound);
        const files = Object.keys(config.virtualFiles || {});
        if (files.length === 0) {
          outputNode = <div style={{ color: currentTheme.dim }}>No virtual files found in home directory (~).</div>;
        } else {
          outputNode = (
            <div className="space-y-1 my-1 pl-2">
              <div className="font-bold" style={{ color: currentTheme.prompt }}>Directory Listing (~):</div>
              <div className="flex flex-wrap gap-4">
                {files.map((fileName) => (
                  <button
                    key={fileName}
                    onClick={() => processCommand(`cat ${fileName}`)}
                    className="hover:underline font-semibold"
                    style={{ color: currentTheme.link }}
                  >
                    {fileName}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        break;
      }

      case 'cat': {
        if (!argsString) {
          playBeep('error', settings.sound);
          outputNode = <div style={{ color: currentTheme.error }}>Usage: `cat &lt;filename&gt;`</div>;
        } else {
          const fileEntry = config.virtualFiles?.[argsString];
          if (fileEntry) {
            playBeep('success', settings.sound);
            const fileContent = typeof fileEntry === 'string' ? fileEntry : fileEntry.content;
            const fileUrl = typeof fileEntry === 'object' ? fileEntry.url : undefined;
            outputNode = (
              <div className="my-1 p-3 rounded border font-mono text-sm whitespace-pre-wrap" style={{ backgroundColor: currentTheme.bg, borderColor: currentTheme.dim, color: currentTheme.text }}>
                {fileContent}
                {fileUrl && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: currentTheme.dim }}>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold" style={{ color: currentTheme.link }}>
                      [Open external link: {fileUrl}]
                    </a>
                  </div>
                )}
              </div>
            );
          } else {
            playBeep('error', settings.sound);
            outputNode = <div style={{ color: currentTheme.error }}>cat: {argsString}: No such file or directory</div>;
          }
        }
        break;
      }

      case 'open': {
        if (!argsString) {
          playBeep('error', settings.sound);
          outputNode = <div style={{ color: currentTheme.error }}>Usage: `open &lt;filename&gt;`</div>;
        } else {
          const fileEntry = config.virtualFiles?.[argsString];
          if (fileEntry) {
            playBeep('success', settings.sound);
            const fileUrl = typeof fileEntry === 'object' ? fileEntry.url : undefined;
            if (fileUrl) {
              window.open(fileUrl, '_blank');
              outputNode = <div style={{ color: currentTheme.success }}>Opening {argsString} ({fileUrl}) in new tab...</div>;
            } else {
              processCommand(`cat ${argsString}`);
              return;
            }
          } else {
            playBeep('error', settings.sound);
            outputNode = <div style={{ color: currentTheme.error }}>open: {argsString}: No such file or directory</div>;
          }
        }
        break;
      }

      case 'cd': {
        playBeep('success', settings.sound);
        outputNode = <div style={{ color: currentTheme.success }}>Current directory: ~ (virtual root)</div>;
        break;
      }

      default:
        playBeep('error', settings.sound);
        outputNode = (
          <div style={{ color: currentTheme.error }}>
            Command not found: `{cmdName}`. Type `help` to see available commands.
          </div>
        );
        break;
    }

    const newLog: CommandLog = {
      id: Math.random().toString(36).substring(2, 9),
      prompt: promptStr,
      command: trimmed,
      output: outputNode,
      timestamp: new Date(),
    };

    setHistory((prev) => [...prev, newLog]);
  };

  const allCommandsAndFiles = [
    ...STATIC_COMMANDS,
    ...(config?.virtualFiles ? Object.keys(config.virtualFiles) : []),
  ];

  // Autocomplete computation for ghost text
  const currentTrimmed = input.trim().toLowerCase();
  const inputParts = currentTrimmed.split(/\s+/);
  let ghostText = '';
  if (inputParts.length > 1 && (inputParts[0] === 'cat' || inputParts[0] === 'open')) {
    const filePrefix = inputParts.slice(1).join(' ');
    const matchedFile = Object.keys(config?.virtualFiles || {}).find((f) => f.toLowerCase().startsWith(filePrefix) && f.toLowerCase() !== filePrefix);
    if (matchedFile) {
      ghostText = matchedFile.slice(filePrefix.length);
    }
  } else {
    const matchedCommand = currentTrimmed
      ? allCommandsAndFiles.find((cmd) => cmd.toLowerCase().startsWith(currentTrimmed) && cmd.toLowerCase() !== currentTrimmed)
      : undefined;
    if (matchedCommand && input.length <= matchedCommand.length) {
      ghostText = matchedCommand.slice(input.trim().length);
    }
  }

  // Handle Keyboard Navigation (Up/Down/Tab/Enter/RightArrow)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx =
        historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
      if (e.key === 'Tab') {
        e.preventDefault();
      }
      const currentVal = input.trim().toLowerCase();
      if (!currentVal) return;
      const parts = currentVal.split(/\s+/);
      if (parts.length > 1 && (parts[0] === 'cat' || parts[0] === 'open')) {
        const filePrefix = parts.slice(1).join(' ');
        const fileMatches = Object.keys(config?.virtualFiles || {}).filter((f) => f.toLowerCase().startsWith(filePrefix));
        if (fileMatches.length === 1) {
          if (e.key === 'Tab' || fileMatches[0].toLowerCase() !== filePrefix) {
            setInput(`${parts[0]} ${fileMatches[0]}`);
            playKeyClick(settings.sound);
          }
        } else if (fileMatches.length > 1 && e.key === 'Tab') {
          let prefix = fileMatches[0];
          for (let i = 1; i < fileMatches.length; i++) {
            while (!fileMatches[i].toLowerCase().startsWith(prefix.toLowerCase()) && prefix.length > 0) {
              prefix = prefix.slice(0, -1);
            }
          }
          if (prefix.length > filePrefix.length) {
            setInput(`${parts[0]} ${prefix}`);
            playKeyClick(settings.sound);
          }
        }
      } else {
        const matches = allCommandsAndFiles.filter((cmd) => cmd.toLowerCase().startsWith(currentVal));
        if (matches.length === 1) {
          if (e.key === 'Tab' || matches[0].toLowerCase() !== currentVal) {
            setInput(matches[0]);
            playKeyClick(settings.sound);
          }
        } else if (matches.length > 1 && e.key === 'Tab') {
          let prefix = matches[0];
          for (let i = 1; i < matches.length; i++) {
            while (!matches[i].toLowerCase().startsWith(prefix.toLowerCase()) && prefix.length > 0) {
              prefix = prefix.slice(0, -1);
            }
          }
          if (prefix.length > currentVal.length) {
            setInput(prefix.toLowerCase());
            playKeyClick(settings.sound);
          }
        }
      }
    }
  };

  if (loadingConfig || !config) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-text flex items-center justify-center font-mono">
        <span className="animate-pulse">Loading Terminal Configuration...</span>
      </div>
    );
  }

  const promptStr = isRoot ? `root@${config.hostname}:#` : `${config.username}@${config.hostname}:~$`;
  const currentTheme = THEME_PALETTES[settings.theme];

  return (
    <HardwareBorder enabled={settings.hardwareBorder}>
      <div
        onClick={focusInput}
        className={`${
          settings.hardwareBorder
            ? 'w-full h-full overflow-y-auto overflow-x-hidden'
            : 'min-h-screen w-full overflow-x-hidden'
        } font-mono cursor-text flex flex-col relative transition-colors duration-300`}
        style={{
          backgroundColor: currentTheme.bg,
          color: currentTheme.text,
        }}
      >
        <CRTEffect enabled={settings.crtEffect} />
        <MatrixRain enabled={settings.backgroundAnim === 'matrix'} color={currentTheme.prompt} />
        <GlitchEffect active={glitchActive} />
        <StatusBar
          username={config.username}
          hostname={config.hostname}
          settings={settings}
          onRunCommand={processCommand}
          onToggleCRT={() => updateSettings({ ...settings, crtEffect: !settings.crtEffect })}
          onToggleMatrix={() => updateSettings({ ...settings, backgroundAnim: settings.backgroundAnim === 'matrix' ? 'none' : 'matrix' })}
          onToggleSound={() => updateSettings({ ...settings, sound: !settings.sound })}
          onToggleFrame={() => updateSettings({ ...settings, hardwareBorder: !settings.hardwareBorder })}
          onChangeTheme={(t) => {
            updateSettings({ ...settings, theme: t });
            triggerGlitch();
          }}
        />

        {/* Rendered Command History & Outputs */}
        <div className="flex-1 space-y-3 p-4 md:p-6 z-10">
          {history.map((log) => (
            <div key={log.id} className="space-y-1">
              {log.prompt && log.command && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold" style={{ color: currentTheme.prompt }}>{log.prompt}</span>
                  <span>{log.command}</span>
                </div>
              )}
              <div>{log.output}</div>
            </div>
          ))}

          {/* Active Command Line Input */}
          <div className="flex flex-wrap items-center gap-2 pt-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                playKeyClick(settings.sound);
              }}
              onKeyDown={handleKeyDown}
              className="opacity-0 absolute bottom-0 left-0 w-full h-full -z-10 pointer-events-none"
              aria-label="Terminal input"
              autoFocus
            />
            <span className="font-bold whitespace-nowrap" style={{ color: currentTheme.prompt }}>{promptStr}</span>
            <div className="flex items-center">
              <span className="whitespace-pre">{input}</span>
              {ghostText && (
                <span className="opacity-40 select-none whitespace-pre" style={{ color: currentTheme.dim }}>{ghostText}</span>
              )}
              <span className="w-2.5 h-5 ml-0.5 animate-blink inline-block" style={{ backgroundColor: currentTheme.prompt }} />
            </div>
          </div>
        </div>

        <div ref={bottomRef} />
      </div>
    </HardwareBorder>
  );
};

export default Terminal;
