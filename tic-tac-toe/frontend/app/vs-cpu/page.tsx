'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameBoard from '../../components/GameBoard';
import GameControls from '../../components/GameControls';
import GameStatus from '../../components/GameStatus';
import PlayerInfo from '../../components/PlayerInfo';
import { 
  initializeBoard, 
  Board, 
  Player, 
  GameStatus as GameStatusType, 
  calculateGameStatus, 
  makeMove, 
  getWinningCombination 
} from '../../utils/gameLogic';
import { getAIMove, Difficulty } from '../../utils/aiLogic';

export default function VsCpuGame() {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatusType>('PLAYER_X_TURN');
  const [winner, setWinner] = useState<Player>(null);
  const [playerName, setPlayerName] = useState('Player');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [playerWins, setPlayerWins] = useState(0);
  const [playerLosses, setPlayerLosses] = useState(0);
  const [playerDraws, setPlayerDraws] = useState(0);
  const [cpuWins, setCpuWins] = useState(0);
  const [cpuLosses, setCpuLosses] = useState(0);
  const [cpuDraws, setCpuDraws] = useState(0);
  const [winningCombination, setWinningCombination] = useState<number[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle cell click
  const handleCellClick = (index: number) => {
    // Only allow moves when it's the player's turn and game is active
    if (status !== 'PLAYER_X_TURN' || isProcessing) return;
    
    const newBoard = makeMove(board, index, 'X');
    if (!newBoard) return;
    
    setBoard(newBoard);
    setIsProcessing(true);
    
    // Check for winner or draw
    const newWinner = checkWinner(newBoard);
    const isDraw = newBoard.every(cell => cell !== null) && !newWinner;
    
    if (newWinner) {
      setWinner(newWinner);
      setStatus(newWinner === 'X' ? 'PLAYER_X_WON' : 'PLAYER_O_WON');
      setWinningCombination(getWinningCombination(newBoard));
      
      // Update scores
      if (newWinner === 'X') {
        setPlayerWins(prev => prev + 1);
        setCpuLosses(prev => prev + 1);
      } else {
        setPlayerLosses(prev => prev + 1);
        setCpuWins(prev => prev + 1);
      }
      setIsProcessing(false);
    } else if (isDraw) {
      setStatus('DRAW');
      setPlayerDraws(prev => prev + 1);
      setCpuDraws(prev => prev + 1);
      setIsProcessing(false);
    } else {
      // Switch to CPU player
      setCurrentPlayer('O');
      setStatus('PLAYER_O_TURN');
      
      // Let CPU make a move after a short delay
      setTimeout(() => {
        const cpuMoveIndex = getAIMove(newBoard, 'O', difficulty);
        if (cpuMoveIndex !== null) {
          const cpuBoard = makeMove(newBoard, cpuMoveIndex, 'O');
          if (cpuBoard) {
            setBoard(cpuBoard);
            
            // Check for winner or draw after CPU move
            const cpuWinner = checkWinner(cpuBoard);
            const isCpuDraw = cpuBoard.every(cell => cell !== null) && !cpuWinner;
            
            if (cpuWinner) {
              setWinner(cpuWinner);
              setStatus(cpuWinner === 'X' ? 'PLAYER_X_WON' : 'PLAYER_O_WON');
              setWinningCombination(getWinningCombination(cpuBoard));
              
              // Update scores
              if (cpuWinner === 'X') {
                setPlayerWins(prev => prev + 1);
                setCpuLosses(prev => prev + 1);
              } else {
                setPlayerLosses(prev => prev + 1);
                setCpuWins(prev => prev + 1);
              }
            } else if (isCpuDraw) {
              setStatus('DRAW');
              setPlayerDraws(prev => prev + 1);
              setCpuDraws(prev => prev + 1);
            } else {
              // Switch back to player
              setCurrentPlayer('X');
              setStatus('PLAYER_X_TURN');
            }
          }
        }
        setIsProcessing(false);
      }, 500);
    }
  };

  // Start a new game
  const handleNewGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer('X');
    setStatus('PLAYER_X_TURN');
    setWinner(null);
    setWinningCombination(null);
    setIsProcessing(false);
  };

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  // Check for winner
  const checkWinner = (board: Board): Player => {
    const winCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const combo of winCombos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tic-Tac-Toe vs CPU</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info */}
          <div className="space-y-4">
            <PlayerInfo 
              player="X"
              playerName={playerName}
              wins={playerWins}
              losses={playerLosses}
              draws={playerDraws}
              isCurrentPlayer={status === 'PLAYER_X_TURN' && !isProcessing}
            />
            <PlayerInfo 
              player="O"
              playerName={`CPU (${difficulty})`}
              wins={cpuWins}
              losses={cpuLosses}
              draws={cpuDraws}
              isCurrentPlayer={status === 'PLAYER_O_TURN' && !isProcessing}
            />
          </div>

          {/* Game Board and Controls */}
          <div className="flex flex-col items-center space-y-6">
            <GameStatus 
              status={status}
              currentPlayer={currentPlayer}
              winner={winner}
              playerName={playerName}
              opponentName={`CPU (${difficulty})`}
            />
            
            <GameBoard 
              board={board}
              onCellClick={handleCellClick}
              disabled={status !== 'PLAYER_X_TURN' || isProcessing}
              winningCombination={winningCombination}
            />
            
            <GameControls 
              onNewGame={handleNewGame}
              difficulty={difficulty}
              onDifficultyChange={handleDifficultyChange}
            />
            
            {isProcessing && (
              <div className="text-gray-600 italic">
                CPU is thinking...
              </div>
            )}
          </div>

          {/* Game Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>You play as X, CPU plays as O</li>
              <li>Take turns placing your marks on the board</li>
              <li>First to get 3 in a row wins</li>
              <li>Adjust difficulty level as needed</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Difficulty Levels</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li><span className="font-semibold">Easy:</span> CPU makes random moves</li>
                <li><span className="font-semibold">Medium:</span> CPU blocks your wins and tries to win</li>
                <li><span className="font-semibold">Hard:</span> CPU uses optimal strategy (unbeatable)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}