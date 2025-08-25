'use client';

import React from 'react';
import { Board, Player } from '../utils/gameLogic';

interface GameBoardProps {
  board: Board;
  onCellClick: (index: number) => void;
  disabled?: boolean;
  winningCombination?: number[] | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  disabled = false,
  winningCombination = null,
}) => {
  const isWinningCell = (index: number): boolean => {
    return winningCombination ? winningCombination.includes(index) : false;
  };

  const renderCell = (index: number): React.ReactNode => {
    const player = board[index];
    const isWinning = isWinningCell(index);
    
    return (
      <button
        className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-4xl md:text-5xl font-bold border border-gray-300 rounded-lg transition-all duration-200 ${
          isWinning ? 'bg-green-100 border-green-500' : 'bg-white hover:bg-gray-50'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onCellClick(index)}
        disabled={disabled || player !== null}
        aria-label={`Cell ${index + 1}, ${player ? `occupied by ${player}` : 'empty'}`}
      >
        {player === 'X' && (
          <span className="text-blue-600">X</span>
        )}
        {player === 'O' && (
          <span className="text-red-600">O</span>
        )}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 p-4 bg-gray-100 rounded-xl shadow-lg">
      {board.map((_, index) => (
        <div key={index}>
          {renderCell(index)}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;