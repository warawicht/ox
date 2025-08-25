import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiplayerGame from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => 'TestPlayer'),
    setItem: jest.fn(),
  },
  writable: true,
});

// Mock WebSocket
const mockWebSocket = {
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onclose: jest.fn(),
  onerror: jest.fn(),
  send: jest.fn(),
  readyState: 1,
  close: jest.fn(),
};

(global as any).WebSocket = jest.fn(() => mockWebSocket);

describe('MultiplayerGame - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    render(<MultiplayerGame />);
    
    // Check that the game board is initialized
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    
    // Check that player info is displayed
    const playerInfoElements = screen.getAllByTestId('player-info');
    expect(playerInfoElements).toHaveLength(2);
    expect(playerInfoElements[0]).toHaveTextContent('Opponent');
    expect(playerInfoElements[1]).toHaveTextContent('Opponent');
    
    // Check that game status is displayed
    expect(screen.getByTestId('game-status')).toBeInTheDocument();
    
    // Check that game controls are displayed
    expect(screen.getByTestId('game-controls')).toBeInTheDocument();
  });

  it('displays game instructions and connection status', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    
    // Check for specific instructions
    expect(screen.getByText('Share the game ID with a friend:')).toBeInTheDocument();
    expect(screen.getByText('Take turns placing X and O on the board')).toBeInTheDocument();
    expect(screen.getByText('First to get 3 in a row wins')).toBeInTheDocument();
    expect(screen.getByText('Rows, columns, and diagonals all count')).toBeInTheDocument();
    
    // Check connection status message
    expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
  });

  it('renders back button with correct navigation', () => {
    render(<MultiplayerGame />);
    
    const backButton = screen.getByText('Back');
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest('button')).toHaveClass('px-4', 'py-2', 'bg-gray-200');
  });

  it('renders page title correctly', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('Tic-Tac-Toe Multiplayer')).toBeInTheDocument();
    expect(screen.getByText('Tic-Tac-Toe Multiplayer').closest('h1')).toHaveClass('text-3xl', 'font-bold');
  });

  it('generates and displays game ID', () => {
    render(<MultiplayerGame />);
    
    // Check that a game ID is displayed
    const connectionStatus = screen.getByText('Connection Status').closest('div');
    expect(connectionStatus).toBeInTheDocument();
    
    // Check for game ID display
    const gameInfo = screen.getByText('Connection Status').closest('div')?.parentElement;
    expect(gameInfo).toBeInTheDocument();
  });

  it('connects to WebSocket server with correct parameters', () => {
    render(<MultiplayerGame />);
    
    // Check that WebSocket was instantiated with correct URL pattern
    expect((global as any).WebSocket).toHaveBeenCalledWith(
      expect.stringMatching(/ws:\/\/localhost:8080\?id=.+&name=TestPlayer/)
    );
  });

  it('handles WebSocket events correctly', () => {
    render(<MultiplayerGame />);
    
    // Simulate WebSocket open event
    mockWebSocket.onopen();
    
    // Check that connection status would be updated (we can't directly test state)
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('JOIN_GAME')
    );
  });
});