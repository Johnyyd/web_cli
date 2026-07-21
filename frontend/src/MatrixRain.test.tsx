import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MatrixRain from './MatrixRain';

describe('MatrixRain Component', () => {
  let cancelRafSpy: any;

  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders canvas when enabled is true and cleans up raf on unmount', () => {
    const { container, unmount } = render(<MatrixRain enabled={true} color="#00ff66" />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pointer-events-none');
    expect(canvas).toHaveClass('opacity-40');

    unmount();
    expect(cancelRafSpy).toHaveBeenCalled();
  });

  it('returns null when enabled is false', () => {
    const { container } = render(<MatrixRain enabled={false} color="#00ff66" />);
    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });
});
