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
  });

  describe('getNextPlayer', () => {
    it('should switch from X to O', () => {
      expect(getNextPlayer('X')).toBe('O');
    });

    it('should switch from O to X', () => {
      expect(getNextPlayer('O')).toBe('X');
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
  });
});