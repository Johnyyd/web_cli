import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Terminal from './Terminal';

const mockConfig = {
  username: 'testuser',
  hostname: 'testhost',
  welcomeMessage: 'Welcome to Test Terminal',
  defaultTheme: 'ubuntu-green',
  userInfo: {
    name: 'Test Name',
    role: 'Test Role',
    bio: 'Test Bio',
  },
  skills: [
    { category: 'TestCat', items: ['TestSkill'] },
  ],
  projects: [
    { name: 'TestProject', description: 'TestDesc', techStack: ['React'] },
  ],
  apiEndpoint: '/api/messages',
  virtualFiles: {
    'secret.txt': 'SECRET_FLAG_123',
  },
};

beforeEach(() => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/terminal.config.json') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig),
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  });
});

describe('Terminal Component Enhanced Features', () => {
  it('loads config and renders welcome message and top status bar', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });
    expect(screen.getByText('testuser@testhost:~')).toBeInTheDocument();
  });

  it('executes guide command and shows interactive walkthrough steps', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'guide' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText(/Interactive System Walkthrough/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Discover Developer Profile/i)).toBeInTheDocument();
  });

  it('executes theme command and changes active theme setting', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'theme cyberpunk' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText(/Switched theme to/i)).toBeInTheDocument();
    expect(screen.getByText(/Cyberpunk Neon/i)).toBeInTheDocument();
  });

  it('allows clicking commands in help table to execute them directly', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    // Run help
    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Click 'whoami' button in help output
    const whoamiBtn = screen.getByRole('button', { name: 'whoami' });
    fireEvent.click(whoamiBtn);

    expect(screen.getByText('Test Name')).toBeInTheDocument();
    expect(screen.getByText('Test Role')).toBeInTheDocument();
  });

  it('displays ghost text autocomplete suggestion when typing a prefix', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'wh' } });

    // Ghost text for 'oami' should be shown
    expect(screen.getByText('oami')).toBeInTheDocument();
  });

  it('executes neofetch command and displays ASCII logo and system information', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'neofetch' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('OS:')).toBeInTheDocument();
    expect(screen.getByText(/Ubuntu 24.04 LTS/i)).toBeInTheDocument();
    expect(screen.getByText('Host:')).toBeInTheDocument();
  });

  it('executes ls and cat commands on virtual filesystem', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('secret.txt')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'cat secret.txt' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('SECRET_FLAG_123')).toBeInTheDocument();
  });

  it('autocompletes input when Tab key is pressed', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'pr' } });
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });

    expect(input.value).toBe('projects');
  });

  it('executes sudo su command to enter root mode with red alert theme', async () => {
    render(<Terminal />);
    await waitFor(() => {
      expect(screen.getByText('Welcome to Test Terminal')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Terminal input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sudo su' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Root access granted/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/root@testhost:#/)).toBeInTheDocument();
  });
});
