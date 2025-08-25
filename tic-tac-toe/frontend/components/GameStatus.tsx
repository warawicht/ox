'use client';

import React from 'react';
import { GameStatus, Player } from '../utils/gameLogic';

interface GameStatusProps {
  status: GameStatus;
  currentPlayer?: Player;
  winner?: Player;
  playerName?: string;
  opponentName?: string;
  isMultiplayer?: boolean;
  isConnected?: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  status,
  currentPlayer,
  winner,
  playerName = 'Player',
  opponentName = 'Opponent',
  isMultiplayer = false,
  isConnected = true,
}) => {
  const getStatusMessage = (): string => {
    switch (status) {
      case 'WAITING_FOR_OPPONENT':
        return 'Waiting for opponent to join...';
      case 'PLAYER_X_TURN':
        return `${currentPlayer === 'X' ? playerName : opponentName}'s turn (X)`;
      case 'PLAYER_O_TURN':
        return `${currentPlayer === 'O' ? playerName : opponentName}'s turn (O)`;
      case 'PLAYER_X_WON':
        return `${winner === currentPlayer ? playerName : opponentName} (X) wins!`;
      case 'PLAYER_O_WON':
        return `${winner === currentPlayer ? playerName : opponentName} (O) wins!`;
      case 'DRAW':
        return "It's a draw!";
      default:
        return '';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'PLAYER_X_WON':
      case 'PLAYER_O_WON':
        return 'text-green-600';
      case 'DRAW':
        return 'text-yellow-600';
      case 'WAITING_FOR_OPPONENT':
        return 'text-blue-600';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-md w-full">
      <div className={`text-xl font-semibold ${getStatusColor()}`}>
        {getStatusMessage()}
      </div>
      
      {isMultiplayer && (
        <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}
    </div>
  );
};

export default GameStatus;