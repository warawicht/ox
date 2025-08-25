import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameControls from './GameControls';

describe('GameControls', () => {
  const mockOnNewGame = jest.fn();
  const mockOnDifficultyChange = jest.fn();

  beforeEach(() => {
    mockOnNewGame.mockClear();
    mockOnDifficultyChange.mockClear();
  });

  it('renders the New Game button', () => {
    render(
      <GameControls 
        onNewGame={mockOnNewGame} 
      />
    );

    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('calls onNewGame when New Game button is clicked', () => {
    render(
      <GameControls 
        onNewGame={mockOnNewGame} 
      />
    );

    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    expect(mockOnNewGame).toHaveBeenCalledTimes(1);
  });

  it('renders difficulty selector for single player mode', () => {
    render(
      <GameControls 
        onNewGame={mockOnNewGame} 
        difficulty="MEDIUM"
        onDifficultyChange={mockOnDifficultyChange}
        isMultiplayer={false}
      />
    );

    expect(screen.getByText('Difficulty:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('MEDIUM');
  });

  it('does not render difficulty selector for multiplayer mode', () => {
    render(
      <GameControls 
        onNewGame={mockOnNewGame} 
        isMultiplayer={true}
      />
    );

    expect(screen.queryByText('Difficulty:')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('calls onDifficultyChange when difficulty is changed', () => {
    render(
      <GameControls 
        onNewGame={mockOnNewGame} 
        difficulty="MEDIUM"
        onDifficultyChange={mockOnDifficultyChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'HARD' } });
    expect(mockOnDifficultyChange).toHaveBeenCalledWith('HARD');
  });
});