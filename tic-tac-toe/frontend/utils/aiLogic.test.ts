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

    it('should make a random move on easy difficulty', () => {
      const board = initializeBoard();
      const move = getAIMove(board, 'O', 'EASY');
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });

    it('should block opponent\'s winning move on hard difficulty', () => {
      // Set up a board where X has two in a row and O needs to block
      const board = ['X', 'X', null, null, null, null, null, null, null];
      const move = getAIMove(board, 'O', 'HARD');
      // O should block X by placing at index 2
      expect(move).toBe(2);
    });

    it('should take winning move on hard difficulty', () => {
      // Set up a board where O has two in a row and can win
      const board = ['O', 'O', null, null, null, null, null, null, null];
      const move = getAIMove(board, 'O', 'HARD');
      // O should win by placing at index 2
      expect(move).toBe(2);
    });

    it('should handle default difficulty case', () => {
      // Mock the getAIMove function to test default case
      jest.resetModules();
      jest.mock('./gameLogic', () => ({
        isValidMove: jest.fn(() => true),
        checkWinner: jest.fn(() => null),
      }));
      
      const aiLogic = require('./aiLogic');
      const board = initializeBoard();
      const move = aiLogic.getAIMove(board, 'O', 'INVALID' as Difficulty);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });

    it('should return null when no valid moves are available', () => {
      // Create a board with only one empty cell
      const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', null];
      const move = getAIMove(board, 'O', 'EASY');
      expect(move).toBe(8); // Should be the only available cell
      
      // Create a full board
      const fullBoard = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
      const noMove = getAIMove(fullBoard, 'O', 'EASY');
      expect(noMove).toBeNull();
    });

    it('should prioritize winning over blocking on medium difficulty', () => {
      // Set up a board where O can win or block X
      // O can win at position 6, X can win at position 8
      const board = ['O', 'X', 'X', 'O', 'X', null, null, null, null];
      const move = getAIMove(board, 'O', 'MEDIUM');
      // O should prioritize winning at position 6
      expect(move).toBe(6);
    });

    it('should use optimal strategy on hard difficulty', () => {
      // Test a common scenario where the center is available
      const board = initializeBoard();
      const move = getAIMove(board, 'O', 'HARD');
      // On an empty board, the center (position 4) is often the optimal first move
      expect(move).toBe(4);
    });

    it('should handle corner case scenarios correctly', () => {
      // Test when only corners are available
      const board = [null, 'X', null, 'X', 'O', 'X', null, 'X', null];
      const move = getAIMove(board, 'O', 'EASY');
      // Should return one of the corner positions (0, 2, 6, 8)
      expect([0, 2, 6, 8]).toContain(move);
    });
  });
});