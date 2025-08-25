'use client';

import React from 'react';
import { Difficulty } from '@/utils/aiLogic';

interface GameControlsProps {
  onNewGame: () => void;
  difficulty?: Difficulty;
  onDifficultyChange?: (difficulty: Difficulty) => void;
  isMultiplayer?: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  difficulty = 'MEDIUM',
  onDifficultyChange,
  isMultiplayer = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      <button
        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={onNewGame}
      >
        New Game
      </button>
      
      {!isMultiplayer && onDifficultyChange && (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <label htmlFor="difficulty" className="text-gray-700 font-medium">
            Difficulty:
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default GameControls;