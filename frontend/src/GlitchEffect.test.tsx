import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GlitchEffect from './GlitchEffect';

describe('GlitchEffect Component', () => {
  it('renders glitch overlay when active is true', () => {
    const { container } = render(<GlitchEffect active={true} />);
    const overlay = container.querySelector('[data-testid="glitch-effect"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('does not render overlay when active is false', () => {
    const { container } = render(<GlitchEffect active={false} />);
    const overlay = container.querySelector('[data-testid="glitch-effect"]');
    expect(overlay).not.toBeInTheDocument();
  });
});
