import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameBoard from './GameBoard';
import { initializeBoard } from '../utils/gameLogic';

describe('GameBoard', () => {
  const mockOnCellClick = jest.fn();

  beforeEach(() => {
    mockOnCellClick.mockClear();
  });

  it('renders an empty board correctly', () => {
    const board = initializeBoard();
    render(
      <GameBoard 
        board={board} 
        onCellClick={mockOnCellClick} 
      />
    );

    // Check that all 9 cells are rendered
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(9);

    // Check that all cells are empty
    cells.forEach(cell => {
      expect(cell).toHaveTextContent('');
    });
  });

  it('renders player moves correctly', () => {
    const board = ['X', 'O', null, null, 'X', null, null, null, 'O'];
    render(
      <GameBoard 
        board={board} 
        onCellClick={mockOnCellClick} 
      />
    );

    const cells = screen.getAllByRole('button');
    expect(cells[0]).toHaveTextContent('X');
    expect(cells[1]).toHaveTextContent('O');
    expect(cells[4]).toHaveTextContent('X');
    expect(cells[8]).toHaveTextContent('O');
    expect(cells[2]).toHaveTextContent('');
  });

  it('calls onCellClick when a cell is clicked', () => {
    const board = initializeBoard();
    render(
      <GameBoard 
        board={board} 
        onCellClick={mockOnCellClick} 
      />
    );

    const cells = screen.getAllByRole('button');
    fireEvent.click(cells[0]);
    expect(mockOnCellClick).toHaveBeenCalledWith(0);
  });

  it('does not call onCellClick when disabled', () => {
    const board = initializeBoard();
    render(
      <GameBoard 
        board={board} 
        onCellClick={mockOnCellClick} 
        disabled={true}
      />
    );

    const cells = screen.getAllByRole('button');
    fireEvent.click(cells[0]);
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('highlights winning cells', () => {
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    const winningCombination = [0, 1, 2];
    render(
      <GameBoard 
        board={board} 
        onCellClick={mockOnCellClick} 
        winningCombination={winningCombination}
      />
    );

    const winningCells = [0, 1, 2];
    winningCells.forEach(index => {
      const cell = screen.getAllByRole('button')[index];
      expect(cell).toHaveClass('bg-green-100');
    });
  });
});