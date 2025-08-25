import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VsCpuGame from './page';
import * as gameLogic from '../../utils/gameLogic';
import * as aiLogic from '@/utils/aiLogic';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  },
  writable: true,
});

describe('VsCpuGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the page title', () => {
    render(<VsCpuGame />);
    
    expect(screen.getByText('Tic-Tac-Toe vs CPU')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<VsCpuGame />);
    
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders player info components with correct names', () => {
    render(<VsCpuGame />);
    
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('CPU (MEDIUM)')).toBeInTheDocument();
  });

  it('renders game components', () => {
    render(<VsCpuGame />);
    
    expect(screen.getByText(/Player's turn \(X\)/)).toBeInTheDocument();
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('renders game instructions', () => {
    render(<VsCpuGame />);
    
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Levels')).toBeInTheDocument();
  });

  it('handles player move correctly', () => {
    // Mock game logic functions
    const makeMoveSpy = jest.spyOn(gameLogic, 'makeMove').mockImplementation((board, index, player) => {
      const newBoard = [...board];
      newBoard[index] = player;
      return newBoard;
    });
    
    const checkWinnerSpy = jest.spyOn(gameLogic, 'checkWinner').mockReturnValue(null);
    const isBoardFullSpy = jest.spyOn(gameLogic, 'isBoardFull').mockReturnValue(false);
    
    // Mock AI move to return a specific index
    const getAIMoveSpy = jest.spyOn(aiLogic, 'getAIMove').mockReturnValue(4);
    
    render(<VsCpuGame />);
    
    // Find a cell and click it
    const cells = screen.getAllByRole('button', { name: /Cell/ });
    fireEvent.click(cells[0]); // Click first cell
    
    // Verify that makeMove was called with correct parameters
    expect(makeMoveSpy).toHaveBeenCalledWith(expect.any(Array), 0, 'X');
    
    // Fast-forward timers to allow CPU move
    jest.advanceTimersByTime(500);
    
    // Verify that AI move was requested
    expect(getAIMoveSpy).toHaveBeenCalled();
    
    // Restore mocks
    makeMoveSpy.mockRestore();
    checkWinnerSpy.mockRestore();
    isBoardFullSpy.mockRestore();
    getAIMoveSpy.mockRestore();
  });

  it('handles player win correctly', () => {
    // Mock game logic functions
    const makeMoveSpy = jest.spyOn(gameLogic, 'makeMove').mockImplementation((board, index, player) => {
      const newBoard = [...board];
      newBoard[index] = player;
      return newBoard;
    });
    
    // Mock checkWinner to return 'X' after first move
    const checkWinnerSpy = jest.spyOn(gameLogic, 'checkWinner')
      .mockImplementationOnce(() => null)  // First call (player move)
      .mockImplementationOnce(() => 'X');   // Second call (after player move)
    
    const isBoardFullSpy = jest.spyOn(gameLogic, 'isBoardFull').mockReturnValue(false);
    const getWinningCombinationSpy = jest.spyOn(gameLogic, 'getWinningCombination').mockReturnValue([0, 1, 2]);
    
    // Mock AI move
    const getAIMoveSpy = jest.spyOn(aiLogic, 'getAIMove').mockReturnValue(4);
    
    render(<VsCpuGame />);
    
    // Find a cell and click it
    const cells = screen.getAllByRole('button', { name: /Cell/ });
    fireEvent.click(cells[0]); // Click first cell
    
    // Fast-forward timers to allow CPU move
    jest.advanceTimersByTime(500);
    
    // Check that win status is displayed
    expect(screen.getByText(/Player \(X\) wins!/)).toBeInTheDocument();
    
    // Restore mocks
    makeMoveSpy.mockRestore();
    checkWinnerSpy.mockRestore();
    isBoardFullSpy.mockRestore();
    getWinningCombinationSpy.mockRestore();
    getAIMoveSpy.mockRestore();
  });

  it('handles new game button click', () => {
    render(<VsCpuGame />);
    
    // Click the new game button
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    // Verify that the board is reset (all cells should be empty)
    const cells = screen.getAllByRole('button', { name: /Cell/ });
    expect(cells).toHaveLength(9);
    // All cells should be empty initially
    cells.forEach(cell => {
      expect(cell).not.toHaveTextContent('X');
      expect(cell).not.toHaveTextContent('O');
    });
  });

  it('handles difficulty change', () => {
    render(<VsCpuGame />);
    
    // Find and change difficulty selector
    const difficultySelect = screen.getByLabelText('Difficulty:');
    fireEvent.change(difficultySelect, { target: { value: 'HARD' } });
    
    // The difficulty should be updated in the CPU player name
    expect(screen.getByText('CPU (HARD)')).toBeInTheDocument();
  });

  it('handles draw game correctly', () => {
    // Mock game logic functions to simulate a draw
    const makeMoveSpy = jest.spyOn(gameLogic, 'makeMove').mockImplementation((board, index, player) => {
      const newBoard = [...board];
      newBoard[index] = player;
      return newBoard;
    });
    
    const checkWinnerSpy = jest.spyOn(gameLogic, 'checkWinner').mockReturnValue(null);
    const isBoardFullSpy = jest.spyOn(gameLogic, 'isBoardFull')
      .mockImplementationOnce(() => false)  // First call (player move)
      .mockImplementationOnce(() => true);   // Second call (after CPU move)
    
    // Mock AI move
    const getAIMoveSpy = jest.spyOn(aiLogic, 'getAIMove').mockReturnValue(4);
    
    render(<VsCpuGame />);
    
    // Find a cell and click it
    const cells = screen.getAllByRole('button', { name: /Cell/ });
    fireEvent.click(cells[0]); // Click first cell
    
    // Fast-forward timers to allow CPU move
    jest.advanceTimersByTime(500);
    
    // Check that draw status is displayed
    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
    
    // Restore mocks
    makeMoveSpy.mockRestore();
    checkWinnerSpy.mockRestore();
    isBoardFullSpy.mockRestore();
    getAIMoveSpy.mockRestore();
  });
});