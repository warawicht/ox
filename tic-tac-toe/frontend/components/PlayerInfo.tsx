'use client';

import React from 'react';
import { Player } from '../utils/gameLogic';

interface PlayerInfoProps {
  player: Player;
  playerName: string;
  wins: number;
  losses: number;
  draws: number;
  isCurrentPlayer?: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  playerName,
  wins,
  losses,
  draws,
  isCurrentPlayer = false,
}) => {
  return (
    <div className={`flex flex-col items-center p-4 rounded-lg border-2 ${
      isCurrentPlayer ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
    } shadow-md`}>
      <div className="text-lg font-semibold">
        {playerName} {player && `(${player})`}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <div>Wins: {wins}</div>
        <div>Losses: {losses}</div>
        <div>Draws: {draws}</div>
      </div>
    </div>
  );
};

export default PlayerInfo;