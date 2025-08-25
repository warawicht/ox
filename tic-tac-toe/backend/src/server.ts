import { Server } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { Board, Player, GameStatus, Game } from '@shared/types/game';

// In-memory storage for games and connections
const games: Map<string, Game> = new Map();
const connections: Map<string, WebSocket> = new Map();
const playerGames: Map<string, string> = new Map();

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new Server({ server });

wss.on('connection', (ws, req) => {
  // Parse the URL to get player info
  const url = req.url ? parse(req.url, true) : null;
  const playerId = Array.isArray(url?.query?.id) ? url?.query?.id[0] : url?.query?.id || '';
  const playerName = Array.isArray(url?.query?.name) ? url?.query?.name[0] : url?.query?.name || 'Anonymous';
  
  if (!playerId) {
    ws.close(4000, 'Player ID is required');
    return;
  }
  
  // Store the connection
  connections.set(playerId, ws);
  
  console.log(`Player ${playerName} (${playerId}) connected`);
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(playerId, data);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid message format' } }));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    handleDisconnect(playerId);
  });
  
  // Send connection confirmation
  ws.send(JSON.stringify({ type: 'CONNECTED', payload: { playerId, playerName } }));
});

// Handle incoming messages
function handleMessage(playerId: string, data: any) {
  const { type, payload } = data;
  
  switch (type) {
    case 'JOIN_GAME':
      handleJoinGame(playerId, payload);
      break;
    case 'MAKE_MOVE':
      handleMakeMove(playerId, payload);
      break;
    default:
      const ws = connections.get(playerId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Unknown message type' } }));
      }
  }
}

// Handle player joining a game
function handleJoinGame(playerId: string, payload: any) {
  const { gameId, playerName } = payload;
  let game = games.get(gameId);
  
  // If game doesn't exist, create it
  if (!game) {
    game = {
      id: gameId,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      players: { X: null, O: null },
      status: 'WAITING_FOR_OPPONENT',
      winner: null,
    };
    games.set(gameId, game);
  }
  
  // Assign player to a role (X or O)
  let playerRole: 'X' | 'O' | null = null;
  
  if (!game.players.X) {
    game.players.X = { id: playerId, name: playerName };
    playerRole = 'X';
  } else if (!game.players.O) {
    game.players.O = { id: playerId, name: playerName };
    playerRole = 'O';
    game.status = 'PLAYER_X_TURN';
  } else {
    // Game is full
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Game is full' } }));
    }
    return;
  }
  
  // Associate player with game
  playerGames.set(playerId, gameId);
  
  // Notify players
  notifyPlayers(gameId, {
    type: 'GAME_UPDATE',
    payload: {
      game: {
        ...game,
        players: {
          X: game.players.X ? { name: game.players.X.name } : null,
          O: game.players.O ? { name: game.players.O.name } : null,
        }
      }
    }
  });
  
  // If both players have joined, start the game
  if (game.players.X && game.players.O) {
    notifyPlayers(gameId, {
      type: 'GAME_START',
      payload: {
        playerRole,
        game: {
          ...game,
          players: {
            X: { name: game.players.X.name },
            O: { name: game.players.O.name },
          }
        }
      }
    });
  }
}

// Handle making a move
function handleMakeMove(playerId: string, payload: any) {
  const gameId = playerGames.get(playerId);
  if (!gameId) return;
  
  const game = games.get(gameId);
  if (!game) return;
  
  const { index } = payload;
  
  // Verify it's the player's turn
  const playerXId = game.players.X?.id;
  const playerOId = game.players.O?.id;
  
  if (
    (game.currentPlayer === 'X' && playerId !== playerXId) ||
    (game.currentPlayer === 'O' && playerId !== playerOId)
  ) {
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Not your turn' } }));
    }
    return;
  }
  
  // Verify move is valid
  if (index < 0 || index > 8 || game.board[index] !== null) {
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid move' } }));
    }
    return;
  }
  
  // Make the move
  game.board[index] = game.currentPlayer;
  
  // Check for winner or draw
  const winner = checkWinner(game.board);
  const isDraw = game.board.every(cell => cell !== null) && !winner;
  
  if (winner) {
    game.winner = winner;
    game.status = winner === 'X' ? 'PLAYER_X_WON' : 'PLAYER_O_WON';
  } else if (isDraw) {
    game.status = 'DRAW';
  } else {
    // Switch player
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    game.status = game.currentPlayer === 'X' ? 'PLAYER_X_TURN' : 'PLAYER_O_TURN';
  }
  
  // Notify players of the move
  notifyPlayers(gameId, {
    type: 'MOVE_MADE',
    payload: {
      index,
      player: game.currentPlayer === 'O' ? 'X' : 'O', // The player who just made the move
      game: {
        board: game.board,
        currentPlayer: game.currentPlayer,
        status: game.status,
        winner: game.winner,
      }
    }
  });
}

// Check for winner
function checkWinner(board: Board): Player | null {
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
}

// Notify all players in a game
function notifyPlayers(gameId: string, message: any) {
  const game = games.get(gameId);
  if (!game) return;
  
  const players = [game.players.X?.id, game.players.O?.id].filter(Boolean) as string[];
  
  players.forEach(playerId => {
    const ws = connections.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Handle player disconnection
function handleDisconnect(playerId: string) {
  console.log(`Player ${playerId} disconnected`);
  
  // Remove connection
  connections.delete(playerId);
  
  // Get game ID for this player
  const gameId = playerGames.get(playerId);
  if (!gameId) return;
  
  // Remove player from game
  const game = games.get(gameId);
  if (game) {
    if (game.players.X?.id === playerId) {
      game.players.X = null;
    }
    if (game.players.O?.id === playerId) {
      game.players.O = null;
    }
    
    // Notify remaining player
    notifyPlayers(gameId, {
      type: 'PLAYER_DISCONNECTED',
      payload: { playerId }
    });
    
    // If both players left, remove the game
    if (!game.players.X && !game.players.O) {
      games.delete(gameId);
    }
  }
  
  // Remove player-game association
  playerGames.delete(playerId);
}

// Start the server
const PORT = process.env.WS_PORT || 8081;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

export default server;