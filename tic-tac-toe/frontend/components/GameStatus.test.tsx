import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameStatus from './GameStatus';

describe('GameStatus', () => {
  it('displays waiting for opponent message', () => {
    render(
      <GameStatus 
        status="WAITING_FOR_OPPONENT"
        isMultiplayer={true}
      />
    );

    expect(screen.getByText('Waiting for opponent to join...')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('displays player X turn message', () => {
    render(
      <GameStatus 
        status="PLAYER_X_TURN"
        currentPlayer="X"
        playerName="Alice"
        opponentName="Bob"
      />
    );

    expect(screen.getByText("Alice's turn (X)")).toBeInTheDocument();
  });

  it('displays player O turn message', () => {
    render(
      <GameStatus 
        status="PLAYER_O_TURN"
        currentPlayer="O"
        playerName="Alice"
        opponentName="Bob"
      />
    );

    expect(screen.getByText("Alice's turn (O)")).toBeInTheDocument();
  });

  it('displays player X win message', () => {
    render(
      <GameStatus 
        status="PLAYER_X_WON"
        winner="X"
        currentPlayer="X"
        playerName="Alice"
        opponentName="Bob"
      />
    );

    expect(screen.getByText("Alice (X) wins!")).toBeInTheDocument();
  });

  it('displays player O win message', () => {
    render(
      <GameStatus 
        status="PLAYER_O_WON"
        winner="O"
        currentPlayer="O"
        playerName="Alice"
        opponentName="Bob"
      />
    );

    expect(screen.getByText("Alice (O) wins!")).toBeInTheDocument();
  });

  it('displays draw message', () => {
    render(
      <GameStatus 
        status="DRAW"
      />
    );

    expect(screen.getByText("It's a draw!")).toBeInTheDocument();
  });

  it('displays disconnected status for multiplayer', () => {
    render(
      <GameStatus 
        status="PLAYER_X_TURN"
        currentPlayer="X"
        isMultiplayer={true}
        isConnected={false}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('does not display connection status for single player', () => {
    render(
      <GameStatus 
        status="PLAYER_X_TURN"
        currentPlayer="X"
        isMultiplayer={false}
      />
    );

    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
  });
});