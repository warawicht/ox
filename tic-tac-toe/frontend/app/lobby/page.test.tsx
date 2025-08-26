import { render, screen } from '@testing-library/react';
import LobbyPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onclose: jest.fn(),
  onerror: jest.fn(),
})) as any;

describe('LobbyPage', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'TestPlayer'),
        setItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders the lobby page with correct elements', () => {
    render(<LobbyPage />);
    
    // Check if the main heading is rendered
    expect(screen.getByText('Game Lobby')).toBeInTheDocument();
    
    // Check if the create game section is rendered
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
    
    // Check if the available games section is rendered
    expect(screen.getByText('Available Games')).toBeInTheDocument();
    
    // Check if the refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('shows connection status', () => {
    render(<LobbyPage />);
    
    // Initially should show connecting message
    expect(screen.getByText('Connecting to lobby...')).toBeInTheDocument();
  });
});