"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWinningCombination = exports.makeMove = exports.calculateGameStatus = exports.getNextPlayer = exports.isValidMove = exports.isBoardFull = exports.checkWinner = exports.initializeBoard = void 0;
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
const initializeBoard = () => Array(9).fill(null);
exports.initializeBoard = initializeBoard;
// Check for a winner
const checkWinner = (board) => {
    for (const combination of WIN_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
};
exports.checkWinner = checkWinner;
// Check if the board is full (draw condition)
const isBoardFull = (board) => {
    return board.every(cell => cell !== null);
};
exports.isBoardFull = isBoardFull;
// Check if a move is valid
const isValidMove = (board, index) => {
    return index >= 0 && index < 9 && board[index] === null;
};
exports.isValidMove = isValidMove;
// Get the next player
const getNextPlayer = (currentPlayer) => {
    return currentPlayer === 'X' ? 'O' : 'X';
};
exports.getNextPlayer = getNextPlayer;
// Calculate game status
const calculateGameStatus = (board, currentPlayer) => {
    const winner = (0, exports.checkWinner)(board);
    if (winner === 'X')
        return 'PLAYER_X_WON';
    if (winner === 'O')
        return 'PLAYER_O_WON';
    if ((0, exports.isBoardFull)(board))
        return 'DRAW';
    return currentPlayer === 'X' ? 'PLAYER_X_TURN' : 'PLAYER_O_TURN';
};
exports.calculateGameStatus = calculateGameStatus;
// Make a move on the board
const makeMove = (board, index, player) => {
    if (!(0, exports.isValidMove)(board, index)) {
        return null;
    }
    const newBoard = [...board];
    newBoard[index] = player;
    return newBoard;
};
exports.makeMove = makeMove;
// Get the winning combination if there is one
const getWinningCombination = (board) => {
    for (const combination of WIN_COMBINATIONS) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return combination;
        }
    }
    return null;
};
exports.getWinningCombination = getWinningCombination;
