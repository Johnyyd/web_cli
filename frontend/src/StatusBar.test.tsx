import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatusBar from './StatusBar';
import { UISettings } from './types';

describe('StatusBar Component', () => {
  const mockSettings: UISettings = {
    theme: 'ubuntu-green',
    crtEffect: true,
    backgroundAnim: 'none',
    sound: false,
    hardwareBorder: false,
  };

  it('renders host info, clock, and action buttons', () => {
    const onRun = vi.fn();
    const onToggleCRT = vi.fn();
    const onChangeTheme = vi.fn();

    render(
      <StatusBar
        username="testuser"
        hostname="testhost"
        settings={mockSettings}
        onRunCommand={onRun}
        onToggleCRT={onToggleCRT}
        onChangeTheme={onChangeTheme}
      />
    );

    expect(screen.getByText(/testuser@testhost:~/)).toBeInTheDocument();
    expect(screen.getByText(/Guide/i)).toBeInTheDocument();
    expect(screen.getByText(/CRT: ON/i)).toBeInTheDocument();
  });

  it('triggers callbacks when buttons are clicked', () => {
    const onRun = vi.fn();
    const onToggleCRT = vi.fn();
    const onChangeTheme = vi.fn();

    render(
      <StatusBar
        username="testuser"
        hostname="testhost"
        settings={mockSettings}
        onRunCommand={onRun}
        onToggleCRT={onToggleCRT}
        onChangeTheme={onChangeTheme}
      />
    );

    fireEvent.click(screen.getByText(/Guide/i));
    expect(onRun).toHaveBeenCalledWith('guide');

    fireEvent.click(screen.getByText(/CRT: ON/i));
    expect(onToggleCRT).toHaveBeenCalledTimes(1);
  });

  it('renders Matrix toggle button and calls onToggleMatrix when clicked', () => {
    const onRun = vi.fn();
    const onToggleCRT = vi.fn();
    const onToggleMatrix = vi.fn();
    const onChangeTheme = vi.fn();

    render(
      <StatusBar
        username="testuser"
        hostname="testhost"
        settings={{ ...mockSettings, backgroundAnim: 'matrix' }}
        onRunCommand={onRun}
        onToggleCRT={onToggleCRT}
        onToggleMatrix={onToggleMatrix}
        onChangeTheme={onChangeTheme}
      />
    );

    const matrixBtn = screen.getByText(/Matrix: ON/i);
    expect(matrixBtn).toBeInTheDocument();

    fireEvent.click(matrixBtn);
    expect(onToggleMatrix).toHaveBeenCalledTimes(1);
  });

  it('renders Sound and Frame toggle buttons and calls callbacks when clicked', () => {
    const onToggleSound = vi.fn();
    const onToggleFrame = vi.fn();

    render(
      <StatusBar
        username="testuser"
        hostname="testhost"
        settings={{ ...mockSettings, sound: true, hardwareBorder: false }}
        onRunCommand={vi.fn()}
        onToggleCRT={vi.fn()}
        onToggleSound={onToggleSound}
        onToggleFrame={onToggleFrame}
        onChangeTheme={vi.fn()}
      />
    );

    const soundBtn = screen.getByText(/Sound: ON/i);
    const frameBtn = screen.getByText(/Frame: OFF/i);
    expect(soundBtn).toBeInTheDocument();
    expect(frameBtn).toBeInTheDocument();

    fireEvent.click(soundBtn);
    expect(onToggleSound).toHaveBeenCalledTimes(1);

    fireEvent.click(frameBtn);
    expect(onToggleFrame).toHaveBeenCalledTimes(1);
  });

  it('renders interactive traffic light window buttons and triggers correct actions', () => {
    const onRun = vi.fn();
    const onToggleFrame = vi.fn();

    render(
      <StatusBar
        username="testuser"
        hostname="testhost"
        settings={mockSettings}
        onRunCommand={onRun}
        onToggleCRT={vi.fn()}
        onToggleFrame={onToggleFrame}
        onChangeTheme={vi.fn()}
      />
    );

    const clearBtn = screen.getByTitle('Reset & Clear Terminal [clear]');
    const frameToggleBtn = screen.getByTitle('Toggle Retro Hardware Bezel [Frame: ON/OFF]');
    const fullscreenBtn = screen.getByTitle('Toggle Fullscreen Mode');

    expect(clearBtn).toBeInTheDocument();
    expect(frameToggleBtn).toBeInTheDocument();
    expect(fullscreenBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onRun).toHaveBeenCalledWith('clear');

    fireEvent.click(frameToggleBtn);
    expect(onToggleFrame).toHaveBeenCalledTimes(1);

    fireEvent.click(fullscreenBtn);
  });
});
