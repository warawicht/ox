import { 
  initializeBoard, 
  checkWinner, 
  isBoardFull, 
  isValidMove, 
  getNextPlayer, 
  calculateGameStatus, 
  makeMove,
  getWinningCombination
} from './gameLogic';

describe('gameLogic', () => {
  describe('initializeBoard', () => {
    it('should create an empty board with 9 null values', () => {
      const board = initializeBoard();
      expect(board).toHaveLength(9);
      expect(board.every(cell => cell === null)).toBe(true);
    });
  });

  describe('checkWinner', () => {
    it('should detect horizontal win', () => {
      const board = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(checkWinner(board)).toBe('X');
    });

    it('should detect vertical win', () => {
      const board = ['O', null, null, 'O', null, null, 'O', null, null];
      expect(checkWinner(board)).toBe('O');
    });

    it('should detect diagonal win', () => {
      const board = ['X', null, null, null, 'X', null, null, null, 'X'];
      expect(checkWinner(board)).toBe('X');
    });

    it('should return null when there is no winner', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', null];
      expect(checkWinner(board)).toBeNull();
    });

    it('should return null for empty board', () => {
      const board = initializeBoard();
      expect(checkWinner(board)).toBeNull();
    });

    it('should handle mixed board with no winner', () => {
      const board = ['X', 'O', 'O', 'O', 'X', 'X', 'X', 'O', 'O'];
      expect(checkWinner(board)).toBeNull();
    });

    it('should detect win in all possible combinations', () => {
      // Test all horizontal wins
      for (let row = 0; row < 3; row++) {
        const board = Array(9).fill(null);
        board[row * 3] = 'X';
        board[row * 3 + 1] = 'X';
        board[row * 3 + 2] = 'X';
        expect(checkWinner(board)).toBe('X');
      }

      // Test all vertical wins
      for (let col = 0; col < 3; col++) {
        const board = Array(9).fill(null);
        board[col] = 'O';
        board[col + 3] = 'O';
        board[col + 6] = 'O';
        expect(checkWinner(board)).toBe('O');
      }

      // Test diagonal wins
      const diagonal1 = [null, null, null, null, null, null, null, null, null];
      diagonal1[0] = 'X';
      diagonal1[4] = 'X';
      diagonal1[8] = 'X';
      expect(checkWinner(diagonal1)).toBe('X');

      const diagonal2 = [null, null, null, null, null, null, null, null, null];
      diagonal2[2] = 'O';
      diagonal2[4] = 'O';
      diagonal2[6] = 'O';
      expect(checkWinner(diagonal2)).toBe('O');
    });
  });

  describe('isBoardFull', () => {
    it('should return true when board is full', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      expect(isBoardFull(board)).toBe(true);
    });

    it('should return false when board is not full', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', null];
      expect(isBoardFull(board)).toBe(false);
    });

    it('should return false for empty board', () => {
      const board = initializeBoard();
      expect(isBoardFull(board)).toBe(false);
    });

    it('should return true for board with all cells filled', () => {
      const board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      expect(isBoardFull(board)).toBe(true);
    });
  });

  describe('isValidMove', () => {
    it('should return true for valid move', () => {
      const board = initializeBoard();
      expect(isValidMove(board, 0)).toBe(true);
    });

    it('should return false for occupied cell', () => {
      const board = ['X', null, null, null, null, null, null, null, null];
      expect(isValidMove(board, 0)).toBe(false);
    });

    it('should return false for invalid index', () => {
      const board = initializeBoard();
      expect(isValidMove(board, -1)).toBe(false);
      expect(isValidMove(board, 9)).toBe(false);
    });

    it('should return false for negative index', () => {
      const board = initializeBoard();
      expect(isValidMove(board, -5)).toBe(false);
    });

    it('should return false for index greater than 8', () => {
      const board = initializeBoard();
      expect(isValidMove(board, 10)).toBe(false);
    });

    it('should return false for non-integer index', () => {
      const board = initializeBoard();
      // @ts-ignore
      expect(isValidMove(board, 1.5)).toBe(false);
    });
  });

  describe('getNextPlayer', () => {
    it('should switch from X to O', () => {
      expect(getNextPlayer('X')).toBe('O');
    });

    it('should switch from O to X', () => {
      expect(getNextPlayer('O')).toBe('X');
    });

    it('should handle null player', () => {
      expect(getNextPlayer(null)).toBe('X');
    });

    it('should handle undefined player', () => {
      // @ts-ignore
      expect(getNextPlayer(undefined)).toBe('X');
    });
  });

  describe('calculateGameStatus', () => {
    it('should return PLAYER_X_WON when X wins', () => {
      const board = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(calculateGameStatus(board, 'O')).toBe('PLAYER_X_WON');
    });

    it('should return PLAYER_O_WON when O wins', () => {
      const board = ['O', null, null, 'O', null, null, 'O', null, null];
      expect(calculateGameStatus(board, 'X')).toBe('PLAYER_O_WON');
    });

    it('should return DRAW when board is full with no winner', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      expect(calculateGameStatus(board, 'X')).toBe('DRAW');
    });

    it('should return PLAYER_X_TURN when it is X\'s turn', () => {
      const board = initializeBoard();
      expect(calculateGameStatus(board, 'X')).toBe('PLAYER_X_TURN');
    });

    it('should return PLAYER_O_TURN when it is O\'s turn', () => {
      const board = initializeBoard();
      expect(calculateGameStatus(board, 'O')).toBe('PLAYER_O_TURN');
    });

    it('should return PLAYER_X_TURN when X can still play', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', null, null];
      expect(calculateGameStatus(board, 'X')).toBe('PLAYER_X_TURN');
    });

    it('should return PLAYER_O_TURN when O can still play', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', null];
      expect(calculateGameStatus(board, 'O')).toBe('PLAYER_O_TURN');
    });

    it('should handle edge case with one move left', () => {
      const board = [null, 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      expect(calculateGameStatus(board, 'X')).toBe('PLAYER_X_TURN');
    });
  });

  describe('makeMove', () => {
    it('should make a valid move', () => {
      const board = initializeBoard();
      const newBoard = makeMove(board, 0, 'X');
      expect(newBoard).not.toBeNull();
      expect(newBoard![0]).toBe('X');
    });

    it('should return null for invalid move', () => {
      const board = ['X', null, null, null, null, null, null, null, null];
      const newBoard = makeMove(board, 0, 'O');
      expect(newBoard).toBeNull();
    });

    it('should return null for negative index', () => {
      const board = initializeBoard();
      const newBoard = makeMove(board, -1, 'X');
      expect(newBoard).toBeNull();
    });

    it('should return null for index greater than 8', () => {
      const board = initializeBoard();
      const newBoard = makeMove(board, 9, 'X');
      expect(newBoard).toBeNull();
    });

    it('should not modify the original board', () => {
      const board = initializeBoard();
      const originalBoard = [...board];
      makeMove(board, 0, 'X');
      expect(board).toEqual(originalBoard);
    });

    it('should handle all valid indices', () => {
      for (let i = 0; i < 9; i++) {
        const board = initializeBoard();
        const newBoard = makeMove(board, i, 'X');
        expect(newBoard).not.toBeNull();
        expect(newBoard![i]).toBe('X');
      }
    });
  });

  describe('getWinningCombination', () => {
    it('should return the winning combination', () => {
      const board = ['X', 'X', 'X', null, null, null, null, null, null];
      expect(getWinningCombination(board)).toEqual([0, 1, 2]);
    });

    it('should return null when there is no winner', () => {
      const board = initializeBoard();
      expect(getWinningCombination(board)).toBeNull();
    });

    it('should return correct combination for vertical win', () => {
      const board = ['O', null, null, 'O', null, null, 'O', null, null];
      expect(getWinningCombination(board)).toEqual([0, 3, 6]);
    });

    it('should return correct combination for diagonal win', () => {
      const board = [null, null, 'X', null, 'X', null, 'X', null, null];
      expect(getWinningCombination(board)).toEqual([2, 4, 6]);
    });

    it('should return correct combination for all possible wins', () => {
      // Test all horizontal wins
      for (let row = 0; row < 3; row++) {
        const board = Array(9).fill(null);
        board[row * 3] = 'X';
        board[row * 3 + 1] = 'X';
        board[row * 3 + 2] = 'X';
        expect(getWinningCombination(board)).toEqual([row * 3, row * 3 + 1, row * 3 + 2]);
      }

      // Test all vertical wins
      for (let col = 0; col < 3; col++) {
        const board = Array(9).fill(null);
        board[col] = 'O';
        board[col + 3] = 'O';
        board[col + 6] = 'O';
        expect(getWinningCombination(board)).toEqual([col, col + 3, col + 6]);
      }

      // Test diagonal wins
      const diagonal1 = [null, null, null, null, null, null, null, null, null];
      diagonal1[0] = 'X';
      diagonal1[4] = 'X';
      diagonal1[8] = 'X';
      expect(getWinningCombination(diagonal1)).toEqual([0, 4, 8]);

      const diagonal2 = [null, null, null, null, null, null, null, null, null];
      diagonal2[2] = 'O';
      diagonal2[4] = 'O';
      diagonal2[6] = 'O';
      expect(getWinningCombination(diagonal2)).toEqual([2, 4, 6]);
    });
  });
});