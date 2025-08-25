import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerInfo from './PlayerInfo';

describe('PlayerInfo', () => {
  it('renders player information correctly', () => {
    render(
      <PlayerInfo 
        player="X"
        playerName="Alice"
        wins={3}
        losses={2}
        draws={1}
      />
    );

    expect(screen.getByText('Alice (X)')).toBeInTheDocument();
    expect(screen.getByText('Wins: 3')).toBeInTheDocument();
    expect(screen.getByText('Losses: 2')).toBeInTheDocument();
    expect(screen.getByText('Draws: 1')).toBeInTheDocument();
  });

  it('renders player information without player symbol', () => {
    render(
      <PlayerInfo 
        player={null}
        playerName="Alice"
        wins={0}
        losses={0}
        draws={0}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Alice (X)')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice (O)')).not.toBeInTheDocument();
  });

  it('applies current player styling', () => {
    render(
      <PlayerInfo 
        player="X"
        playerName="Alice"
        wins={2}
        losses={1}
        draws={0}
        isCurrentPlayer={true}
      />
    );

    // Get the outer div element
    const playerInfo = screen.getByText('Alice (X)').parentElement;
    expect(playerInfo).toHaveClass('border-blue-500');
    expect(playerInfo).toHaveClass('bg-blue-50');
  });

  it('applies non-current player styling', () => {
    render(
      <PlayerInfo 
        player="O"
        playerName="Bob"
        wins={1}
        losses={2}
        draws={1}
        isCurrentPlayer={false}
      />
    );

    // Get the outer div element
    const playerInfo = screen.getByText('Bob (O)').parentElement;
    expect(playerInfo).toHaveClass('border-gray-200');
    expect(playerInfo).toHaveClass('bg-white');
  });
});