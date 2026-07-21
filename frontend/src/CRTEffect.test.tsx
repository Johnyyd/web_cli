import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CRTEffect from './CRTEffect';

describe('CRTEffect Component', () => {
  it('renders overlay when enabled is true', () => {
    const { container } = render(<CRTEffect enabled={true} />);
    const overlay = container.querySelector('[data-testid="crt-effect"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('does not render overlay when enabled is false', () => {
    const { container } = render(<CRTEffect enabled={false} />);
    const overlay = container.querySelector('[data-testid="crt-effect"]');
    expect(overlay).not.toBeInTheDocument();
  });
});
