import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playKeyClick, playBeep, resetAudioContextForTesting } from './soundEffects';

describe('Sound Effects Synthesizer (Web Audio API)', () => {
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGain: any;

  beforeEach(() => {
    resetAudioContextForTesting();
    mockOscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
    };
    mockGain = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    };
    mockAudioContext = {
      currentTime: 0,
      destination: {},
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBuffer: vi.fn().mockReturnValue({ getChannelData: () => new Float32Array(1024) }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: vi.fn().mockReturnValue({
        type: 'highpass',
        frequency: { value: 1000 },
        connect: vi.fn(),
      }),
    };

    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));
    vi.stubGlobal('webkitAudioContext', vi.fn().mockImplementation(() => mockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when enabled is false', () => {
    playKeyClick(false);
    playBeep('success', false);
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
  });

  it('synthesizes key click when enabled is true', () => {
    playKeyClick(true);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('synthesizes beep when enabled is true', () => {
    playBeep('error', true);
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  it('handles suspended AudioContext state gracefully by resuming', () => {
    mockAudioContext.state = 'suspended';
    playKeyClick(true);
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});
