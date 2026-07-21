import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HardwareBorder from './HardwareBorder';

describe('HardwareBorder Component', () => {
  it('renders bezel border and child content when enabled is true', () => {
    const { container } = render(
      <HardwareBorder enabled={true}>
        <div data-testid="child-content">Terminal Display</div>
      </HardwareBorder>
    );
    const border = container.querySelector('[data-testid="hardware-border"]');
    expect(border).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders only child content without bezel border when enabled is false', () => {
    const { container } = render(
      <HardwareBorder enabled={false}>
        <div data-testid="child-content">Terminal Display</div>
      </HardwareBorder>
    );
    const border = container.querySelector('[data-testid="hardware-border"]');
    expect(border).not.toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
