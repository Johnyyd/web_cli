import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock getContext for jsdom environment to avoid "Not implemented" console errors during tests
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type: string) => {
    if (type === '2d') {
      return {
        fillRect: vi.fn(),
        fillText: vi.fn(),
        clearRect: vi.fn(),
        fillStyle: '',
        font: '',
      };
    }
    return null;
  });
}
