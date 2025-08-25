import { Board, Player, isValidMove, checkWinner } from './gameLogic';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Get a random valid move
const getRandomMove = (board: Board): number | null => {
  const emptyIndices = board
    .map((cell, index) => (cell === null ? index : null))
    .filter(index => index !== null) as number[];
    
  if (emptyIndices.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[randomIndex];
};

// Get a winning move if available, or block opponent's winning move
const getWinningOrBlockingMove = (board: Board, player: Player): number | null => {
  // Check for winning move
  for (let i = 0; i < 9; i++) {
    if (isValidMove(board, i)) {
      const newBoard = [...board];
      newBoard[i] = player;
      if (checkWinner(newBoard) === player) {
        return i;
      }
    }
  }
  
  // Check for blocking move
  const opponent = player === 'X' ? 'O' : 'X';
  for (let i = 0; i < 9; i++) {
    if (isValidMove(board, i)) {
      const newBoard = [...board];
      newBoard[i] = opponent;
      if (checkWinner(newBoard) === opponent) {
        return i;
      }
    }
  }
  
  return null;
};

// Minimax algorithm with alpha-beta pruning for hard difficulty
const minimax = (
  board: Board,
  depth: number,
  isMaximizing: boolean,
  player: Player,
  alpha: number,
  beta: number
): { score: number; index: number | null } => {
  const opponent = player === 'X' ? 'O' : 'X';
  const winner = checkWinner(board);
  
  // Terminal states
  if (winner === player) {
    return { score: 10 - depth, index: null };
  }
  if (winner === opponent) {
    return { score: depth - 10, index: null };
  }
  if (board.every(cell => cell !== null)) {
    return { score: 0, index: null };
  }
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestIndex: number | null = null;
    
    for (let i = 0; i < 9; i++) {
      if (isValidMove(board, i)) {
        const newBoard = [...board];
        newBoard[i] = player;
        const result = minimax(newBoard, depth + 1, false, player, alpha, beta);
        
        if (result.score > bestScore) {
          bestScore = result.score;
          bestIndex = i;
        }
        
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) {
          break;
        }
      }
    }
    
    return { score: bestScore, index: bestIndex };
  } else {
    let bestScore = Infinity;
    let bestIndex: number | null = null;
    
    for (let i = 0; i < 9; i++) {
      if (isValidMove(board, i)) {
        const newBoard = [...board];
        newBoard[i] = opponent;
        const result = minimax(newBoard, depth + 1, true, player, alpha, beta);
        
        if (result.score < bestScore) {
          bestScore = result.score;
          bestIndex = i;
        }
        
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) {
          break;
        }
      }
    }
    
    return { score: bestScore, index: bestIndex };
  }
};

// Get the best move based on difficulty level
export const getAIMove = (
  board: Board,
  player: Player,
  difficulty: Difficulty
): number | null => {
  switch (difficulty) {
    case 'EASY':
      // Make a random valid move
      return getRandomMove(board);
      
    case 'MEDIUM':
      // Try to win or block, otherwise make random move
      const winningOrBlockingMove = getWinningOrBlockingMove(board, player);
      if (winningOrBlockingMove !== null) {
        return winningOrBlockingMove;
      }
      return getRandomMove(board);
      
    case 'HARD':
      // Use minimax algorithm for optimal play
      const result = minimax(board, 0, true, player, -Infinity, Infinity);
      return result.index;
      
    default:
      return getRandomMove(board);
  }
};