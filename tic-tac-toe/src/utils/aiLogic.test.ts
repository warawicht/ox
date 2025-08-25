import { getAIMove, Difficulty } from './aiLogic';
import { initializeBoard, makeMove } from './gameLogic';

describe('aiLogic', () => {
  describe('getAIMove', () => {
    it('should return a valid move index', () => {
      const board = initializeBoard();
      const move = getAIMove(board, 'O', 'EASY');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });

    it('should return null when board is full', () => {
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      const move = getAIMove(board, 'O', 'EASY');
      expect(move).toBeNull();
    });

    it('should block opponent\'s winning move on medium difficulty', () => {
      // Set up a board where X has two in a row and O needs to block
      const board = ['X', 'X', null, null, null, null, null, null, null];
      const move = getAIMove(board, 'O', 'MEDIUM');
      // O should block X by placing at index 2
      expect(move).toBe(2);
    });

    it('should take winning move on medium difficulty', () => {
      // Set up a board where O has two in a row and can win
      const board = ['O', 'O', null, null, null, null, null, null, null];
      const move = getAIMove(board, 'O', 'MEDIUM');
      // O should win by placing at index 2
      expect(move).toBe(2);
    });

    it('should make a valid move on hard difficulty', () => {
      const board = initializeBoard();
      const move = getAIMove(board, 'O', 'HARD');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });
  });
});