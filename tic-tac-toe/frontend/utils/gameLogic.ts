import { Board, Player, GameStatus } from '@shared/types/game';

// Win combinations
const WIN_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal from top-left
  [2, 4, 6], // Diagonal from top-right
];

// Initialize an empty board
export const initializeBoard = (): Board => Array(9).fill(null);

// Check for a winner
export const checkWinner = (board: Board): Player => {
  for (const combination of WIN_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
};

// Check if the board is full (draw condition)
export const isBoardFull = (board: Board): boolean => {
  return board.every(cell => cell !== null);
};

// Check if a move is valid
export const isValidMove = (board: Board, index: number): boolean => {
  return index >= 0 && index < 9 && board[index] === null;
};

// Get the next player
export const getNextPlayer = (currentPlayer: Player): Player => {
  return currentPlayer === 'X' ? 'O' : 'X';
};

// Calculate game status
export const calculateGameStatus = (
  board: Board,
  currentPlayer: Player
): GameStatus => {
  const winner = checkWinner(board);
  
  if (winner === 'X') return 'PLAYER_X_WON';
  if (winner === 'O') return 'PLAYER_O_WON';
  if (isBoardFull(board)) return 'DRAW';
  
  return currentPlayer === 'X' ? 'PLAYER_X_TURN' : 'PLAYER_O_TURN';
};

// Make a move on the board
export const makeMove = (
  board: Board,
  index: number,
  player: Player
): Board | null => {
  if (!isValidMove(board, index)) {
    return null;
  }
  
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
};

// Get the winning combination if there is one
export const getWinningCombination = (board: Board): number[] | null => {
  for (const combination of WIN_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combination;
    }
  }
  return null;
};