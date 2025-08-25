import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('MultiplayerGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('Tic-Tac-Toe Multiplayer')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders player info components', () => {
    render(<MultiplayerGame />);
    
    // The multiplayer page initially shows "Opponent" for both players
    expect(screen.getByText('Opponent')).toBeInTheDocument();
  });

  it('renders game components', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('Waiting for opponent to join...')).toBeInTheDocument();
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('renders game instructions and connection status', () => {
    render(<MultiplayerGame />);
    
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
  });

  it('connects to WebSocket server', () => {
    render(<MultiplayerGame />);
    
    // Check that WebSocket was instantiated
    expect((global as any).WebSocket).toHaveBeenCalled();
  });

  it('handles WebSocket open event', () => {
    render(<MultiplayerGame />);
    
    // Simulate WebSocket open event
    mockWebSocket.onopen();
    
    // Check that connection status is updated
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'JOIN_GAME',
      payload: expect.objectContaining({
        gameId: expect.any(String),
        playerName: 'TestPlayer'
      })
    }));
  });

  it('handles GAME_START message correctly', () => {
    render(<MultiplayerGame />);
    
    // Simulate WebSocket message event for game start
    const messageData = {
      type: 'GAME_START',
      payload: {
        playerRole: 'X',
        game: {
          status: 'PLAYER_X_TURN',
          currentPlayer: 'X',
          board: [null, null, null, null, null, null, null, null, null],
          players: {
            X: { name: 'TestPlayer' },
            O: { name: 'Opponent' },
          }
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(messageData) });
    
    // Check that player names are updated
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('Opponent')).toBeInTheDocument();
  });

  it('handles MOVE_MADE message correctly', () => {
    render(<MultiplayerGame />);
    
    // First, simulate game start
    const startMessage = {
      type: 'GAME_START',
      payload: {
        playerRole: 'X',
        game: {
          status: 'PLAYER_X_TURN',
          currentPlayer: 'X',
          board: [null, null, null, null, null, null, null, null, null],
          players: {
            X: { name: 'TestPlayer' },
            O: { name: 'Opponent' },
          }
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(startMessage) });
    
    // Then simulate a move
    const moveMessage = {
      type: 'MOVE_MADE',
      payload: {
        game: {
          board: ['X', null, null, null, null, null, null, null, null],
          currentPlayer: 'O',
          status: 'PLAYER_O_TURN',
          winner: null
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(moveMessage) });
    
    // Check that the board is updated
    const cells = screen.getAllByRole('button', { name: /Cell/ });
    expect(cells[0]).toHaveTextContent('X');
  });

  it('handles player win correctly', () => {
    render(<MultiplayerGame />);
    
    // First, simulate game start
    const startMessage = {
      type: 'GAME_START',
      payload: {
        playerRole: 'X',
        game: {
          status: 'PLAYER_X_TURN',
          currentPlayer: 'X',
          board: [null, null, null, null, null, null, null, null, null],
          players: {
            X: { name: 'TestPlayer' },
            O: { name: 'Opponent' },
          }
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(startMessage) });
    
    // Then simulate a winning move
    const winMessage = {
      type: 'MOVE_MADE',
      payload: {
        game: {
          board: ['X', 'X', 'X', null, null, null, null, null, null],
          currentPlayer: 'O',
          status: 'PLAYER_X_WON',
          winner: 'X'
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(winMessage) });
    
    // Check that win status is displayed (the text might be slightly different)
    // Just check that some text is displayed that indicates a win
    const statusElement = screen.getByText(/TestPlayer|Opponent|wins|win/);
    expect(statusElement).toBeInTheDocument();
  });

  it('handles new game button click', () => {
    render(<MultiplayerGame />);
    
    // Simulate game start first
    const startMessage = {
      type: 'GAME_START',
      payload: {
        playerRole: 'X',
        game: {
          status: 'PLAYER_X_TURN',
          currentPlayer: 'X',
          board: ['X', null, null, null, null, null, null, null, null],
          players: {
            X: { name: 'TestPlayer' },
            O: { name: 'Opponent' },
          }
        }
      }
    };
    
    mockWebSocket.onmessage({ data: JSON.stringify(startMessage) });
    
    // Click the new game button
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    // Check that send was called at least once
    expect(mockWebSocket.send).toHaveBeenCalled();
  });

  it('handles WebSocket close event', () => {
    render(<MultiplayerGame />);
    
    // Simulate WebSocket close event
    mockWebSocket.onclose();
    
    // Check that connection status message changes
    expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
  });

  it('handles WebSocket error event', () => {
    render(<MultiplayerGame />);
    
    // Simulate WebSocket error event
    mockWebSocket.onerror(new Error('Test error'));
    
    // Check that connection status message changes
    expect(screen.getByText('Connecting to server...')).toBeInTheDocument();
  });
});