import { Server } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';


import { Board, Player, GameStatus, Game, LobbyGame } from '../../shared/types/game';

// In-memory storage for games and connections
const games: Map<string, Game> = new Map();
const connections: Map<string, any> = new Map();
const playerGames: Map<string, string> = new Map();

// In-memory storage for lobby
const lobbyGames: Map<string, LobbyGame> = new Map();

// Track which players are in lobby vs game mode
const playerModes: Map<string, 'lobby' | 'game'> = new Map();

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new Server({ server });

wss.on('connection', (ws, req) => {
  try {
    // Parse the URL to get player info
    const url = req.url ? parse(req.url, true) : null;
    const playerId = Array.isArray(url?.query?.id) ? url?.query?.id[0] : url?.query?.id || '';
    const playerName = Array.isArray(url?.query?.name) ? url?.query?.name[0] : url?.query?.name || 'Anonymous';
    const isInLobby = url?.query?.lobby === 'true';
    
    if (!playerId) {
      ws.close(4000, 'Player ID is required');
      return;
    }
    
    // Store the connection
    connections.set(playerId, ws);
    
    // Track player mode (lobby or game)
    playerModes.set(playerId, isInLobby ? 'lobby' : 'game');
    
    console.log(`Player ${playerName} (${playerId}) connected ${isInLobby ? '(lobby)' : '(game)'}`);
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(playerId, data, playerName);
      } catch (error) {
        console.error('Error parsing message:', error);
        ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Invalid message format' } }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      handleDisconnect(playerId, playerModes.get(playerId) || 'game');
    });
    
    // Send connection confirmation
    ws.send(JSON.stringify({ type: 'CONNECTED', payload: { playerId, playerName } }));
    
    // If player is in lobby, send initial lobby state
    if (isInLobby) {
      sendLobbyUpdate();
    }
  } catch (error) {
    console.error('Error in WebSocket connection handler:', error);
    ws.close(4001, 'Internal server error');
  }
});

// Handle incoming messages
function handleMessage(playerId: string, data: any, playerName: string) {
  const { type, payload } = data;
  
  switch (type) {
    case 'JOIN_GAME':
      handleJoinGame(playerId, payload);
      break;
    case 'MAKE_MOVE':
      handleMakeMove(playerId, payload);
      break;
    case 'CREATE_GAME':
      handleCreateGame(playerId, payload, playerName);
      break;
    case 'LIST_GAMES':
      handleListGames(playerId);
      break;
    case 'JOIN_LOBBY_GAME':
      handleJoinLobbyGame(playerId, payload, playerName);
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
  
  // Reset game state if needed (in case of player disconnection)
  // Only reset if both players are missing
  if (!game.players.X && !game.players.O) {
    game.status = 'WAITING_FOR_OPPONENT';
    game.currentPlayer = 'X';
    game.board = Array(9).fill(null);
    game.winner = null;
  }
  
  // Check if player is already in the game
  let playerRole: 'X' | 'O' | null = null;
  let isNewPlayer = false;
  
  if (game.players.X?.id === playerId) {
    playerRole = 'X';
  } else if (game.players.O?.id === playerId) {
    playerRole = 'O';
  } else {
    // Player is not in the game, assign them a role
    isNewPlayer = true;
    
    if (!game.players.X) {
      game.players.X = { id: playerId, name: playerName };
      playerRole = 'X';
      // If this is the first player, keep status as WAITING_FOR_OPPONENT
      if (game.players.O) {
        game.status = 'PLAYER_X_TURN';
      }
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
  }
  
  // Associate player with game (only for new players)
  if (isNewPlayer) {
    playerGames.set(playerId, gameId);
  }
  
  // Update player mode to game
  playerModes.set(playerId, 'game');
  
  // Check if this is a lobby game and update accordingly
  const lobbyGame = lobbyGames.get(gameId);
  if (lobbyGame) {
    // Update player count in lobby game
    lobbyGame.playerCount = (game.players.X ? 1 : 0) + (game.players.O ? 1 : 0);
    
    // If both players have joined, remove from lobby
    if (game.players.X && game.players.O) {
      lobbyGames.delete(gameId);
    }
  }
  
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
        gameId: game.id,
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
    
    // Remove from lobby if it was there
    if (lobbyGame) {
      lobbyGames.delete(gameId);
      sendLobbyUpdate();
    }
  } else if (!isNewPlayer) {
    // If this is a reconnection, send GAME_START to the reconnecting player
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'GAME_START',
        payload: {
          gameId: game.id,
          playerRole,
          game: {
            ...game,
            players: {
              X: game.players.X ? { name: game.players.X.name } : null,
              O: game.players.O ? { name: game.players.O.name } : null,
            }
          }
        }
      }));
    }
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
  
  // If game ended, remove it from lobby if it was there
  if (game.status === 'PLAYER_X_WON' || game.status === 'PLAYER_O_WON' || game.status === 'DRAW') {
    if (lobbyGames.has(gameId)) {
      lobbyGames.delete(gameId);
      sendLobbyUpdate();
    }
  }
}

// Handle creating a game in the lobby
function handleCreateGame(playerId: string, payload: any, playerName: string) {
  const { gameName } = payload;
  const gameId = Math.random().toString(36).substring(2, 10);
  
  // Create a new game in the lobby
  const lobbyGame: LobbyGame = {
    id: gameId,
    name: gameName || `Game ${gameId}`,
    playerCount: 1,
    maxPlayers: 2,
    status: 'WAITING_FOR_OPPONENT',
    createdAt: new Date().toISOString(), // Convert to ISO string for serialization
    createdBy: playerName,
  };
  
  lobbyGames.set(gameId, lobbyGame);
  
  // Also create the actual game
  const game: Game = {
    id: gameId,
    name: gameName || `Game ${gameId}`,
    board: Array(9).fill(null),
    currentPlayer: 'X',
    players: { 
      X: { id: playerId, name: playerName }, 
      O: null 
    },
    status: 'WAITING_FOR_OPPONENT',
    winner: null,
  };
  
  games.set(gameId, game);
  playerGames.set(playerId, gameId);
  
  // Set player mode to lobby for the creator
  playerModes.set(playerId, 'lobby');
  
  // Send confirmation to the creator
  const ws = connections.get(playerId);
  if (ws) {
    ws.send(JSON.stringify({
      type: 'GAME_CREATED',
      payload: {
        gameId,
        playerRole: 'X',
        game: {
          ...game,
          players: {
            X: { name: game.players.X!.name },
            O: null,
          }
        }
      }
    }));
  }
  
  // Broadcast lobby update to all lobby clients
  sendLobbyUpdate();
}

// Handle listing games in the lobby
function handleListGames(playerId: string) {
  // Clean up any stale games in the lobby
  cleanupLobbyGames();
  sendLobbyUpdate(playerId);
}

// Handle joining a game from the lobby
function handleJoinLobbyGame(playerId: string, payload: any, playerName: string) {
  const { gameId } = payload;
  
  console.log(`Player ${playerId} attempting to join lobby game ${gameId}`);
  
  // Check if the game exists in the lobby
  const lobbyGame = lobbyGames.get(gameId);
  console.log(`Lobby game found: ${!!lobbyGame}`);
  
  // Check if the game exists in the main games map
  const game = games.get(gameId);
  console.log(`Main game found: ${!!game}`);
  
  // If game doesn't exist at all, send error
  if (!game) {
    console.log(`Game ${gameId} not found in main games map`);
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Game not found' } }));
    }
    return;
  }
  
  // Reset game state if needed (in case of player disconnection)
  if (!game.players.X && !game.players.O) {
    game.status = 'WAITING_FOR_OPPONENT';
    game.currentPlayer = 'X';
    game.board = Array(9).fill(null);
    game.winner = null;
  }
  
  // Check if the game is still available (has an open slot for player O)
  if (game.players.O) {
    console.log(`Game ${gameId} is full`);
    const ws = connections.get(playerId);
    if (ws) {
      ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Game is no longer available' } }));
    }
    // Remove from lobby if it was there
    if (lobbyGame) {
      lobbyGames.delete(gameId);
      sendLobbyUpdate();
    }
    return;
  }
  
  // Assign player to O role
  game.players.O = { id: playerId, name: playerName };
  game.status = 'PLAYER_X_TURN';
  playerGames.set(playerId, gameId);
  
  // Update player mode to game
  playerModes.set(playerId, 'game');
  
  // Update lobby game player count if it exists
  if (lobbyGame) {
    lobbyGame.playerCount = 2;
  }
  
  // Notify both players
  notifyPlayers(gameId, {
    type: 'GAME_START',
    payload: {
      gameId: game.id,
      playerRole: 'O',
      game: {
        ...game,
        players: {
          X: { name: game.players.X!.name },
          O: { name: game.players.O.name },
        }
      }
    }
  });
  
  // Remove game from lobby now that both players have joined
  if (lobbyGame) {
    lobbyGames.delete(gameId);
    sendLobbyUpdate();
  }
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

// Send lobby update to all lobby clients
function sendLobbyUpdate(targetPlayerId?: string) {
  // Clean up any stale games in the lobby
  cleanupLobbyGames();
  
  // Convert lobby games to array and serialize dates as strings
  const lobbyGamesArray = Array.from(lobbyGames.values()).map(game => ({
    ...game,
    createdAt: game.createdAt // Already a string, no conversion needed
  }));
  
  const message = {
    type: 'LOBBY_UPDATE',
    payload: {
      games: lobbyGamesArray
    }
  };
  
  if (targetPlayerId) {
    // Send to specific player
    const ws = connections.get(targetPlayerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  } else {
    // Send to all connected clients
    connections.forEach((ws, playerId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Clean up stale games from the lobby
function cleanupLobbyGames() {
  const now = new Date();
  const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  lobbyGames.forEach((lobbyGame, gameId) => {
    // Check if the game still exists in the main games map
    const game = games.get(gameId);
    if (!game) {
      // Game no longer exists, remove from lobby
      console.log(`Removing lobby game ${gameId} - game no longer exists in main games map`);
      lobbyGames.delete(gameId);
      return;
    }
    
    // Check if the game is full based on playerCount or player slots
    if (lobbyGame.playerCount >= lobbyGame.maxPlayers || (game.players.X && game.players.O)) {
      // Game is full, remove from lobby
      console.log(`Removing lobby game ${gameId} - game is full`);
      lobbyGames.delete(gameId);
      return;
    }
    
    // Check if the game creator is still connected to the lobby
    const creatorId = game.players.X?.id;
    if (creatorId && !connections.has(creatorId) && playerModes.get(creatorId) !== 'lobby') {
      // Creator disconnected from lobby, but check if there are other players in the game
      if (!game.players.O) {
        // No other players in the game, check if the game has started
        const gameHasStarted = game.status !== 'WAITING_FOR_OPPONENT';
        if (!gameHasStarted) {
          // Game hasn't started and no players, remove it completely
          console.log(`Removing lobby game ${gameId} - creator disconnected from lobby and no other players`);
          games.delete(gameId);
          lobbyGames.delete(gameId);
        } else {
          // Game has started, keep main game but remove from lobby
          console.log(`Removing lobby game ${gameId} from lobby but keeping main game - creator disconnected`);
          lobbyGames.delete(gameId);
        }
      } else {
        // Other players are in the game, keep it available in lobby
        console.log(`Keeping lobby game ${gameId} available - creator disconnected but other players present`);
      }
      return;
    }
    
    // Check if the game is older than 10 minutes
    const gameAge = now.getTime() - new Date(lobbyGame.createdAt).getTime();
    if (gameAge > tenMinutes) {
      // Game is too old, remove it
      console.log(`Removing lobby game ${gameId} - game is too old`);
      games.delete(gameId);
      lobbyGames.delete(gameId);
    }
  });
}

// Handle player disconnection
function handleDisconnect(playerId: string, mode: 'lobby' | 'game') {
  console.log(`Player ${playerId} disconnected from ${mode}`);
  
  // Remove connection
  connections.delete(playerId);
  
  // Remove player mode tracking
  playerModes.delete(playerId);
  
  // Get game ID for this player
  const gameId = playerGames.get(playerId);
  if (!gameId) return;
  
  // Remove player from game
  const game = games.get(gameId);
  if (game) {
    let playerRemoved = false;
    let wasCreator = false;
    const isLobbyGame = lobbyGames.has(gameId);
    
    if (game.players.X?.id === playerId) {
      game.players.X = null;
      playerRemoved = true;
      wasCreator = true;
      console.log(`Player ${playerId} removed from X position in game ${gameId}`);
    }
    if (game.players.O?.id === playerId) {
      game.players.O = null;
      playerRemoved = true;
      console.log(`Player ${playerId} removed from O position in game ${gameId}`);
    }
    
    // If a player was removed, reset game status
    if (playerRemoved) {
      // Only reset the game if it's not in progress and not a lobby game that should remain available
      const gameInProgress = game.status !== 'WAITING_FOR_OPPONENT' && 
                             game.status !== 'PLAYER_X_TURN' && 
                             game.status !== 'PLAYER_O_TURN';
      
      // Don't reset lobby games that are waiting for players
      if (!isLobbyGame || gameInProgress) {
        game.status = 'WAITING_FOR_OPPONENT';
        game.currentPlayer = 'X';
        game.board = Array(9).fill(null);
        game.winner = null;
      }
      
      // Notify remaining player
      notifyPlayers(gameId, {
        type: 'PLAYER_DISCONNECTED',
        payload: { playerId }
      });
    }
    
    // Handle lobby game cleanup
    if (isLobbyGame) {
      const lobbyGame = lobbyGames.get(gameId);
      if (lobbyGame) {
        // If creator disconnected from lobby but game still exists, keep it in lobby
        // Only remove from lobby if:
        // 1. Both players have left the game entirely
        // 2. Game is full (both positions filled)
        // 3. Creator disconnected and there are no other players
        
        if (!game.players.X && !game.players.O) {
          // No players left in game
          console.log(`Game ${gameId} has no players. Is lobby game: ${isLobbyGame}`);
          
          // Remove from lobby but keep main game for potential reconnection
          lobbyGames.delete(gameId);
          console.log(`Removed lobby game ${gameId} from lobby but kept main game`);
        } else if (game.players.X && game.players.O) {
          // Both players have joined, remove from lobby
          lobbyGames.delete(gameId);
          console.log(`Removed lobby game ${gameId} from lobby because both players have joined`);
        } else if (wasCreator && mode === 'lobby' && !game.players.O) {
          // Creator disconnected from lobby and no other players
          // Keep game available for reconnection but update lobby game player count
          lobbyGame.playerCount = game.players.X ? 1 : 0;
          console.log(`Creator disconnected from lobby, keeping game available`);
        } else {
          // Update player count in lobby game
          const playerCount = (game.players.X ? 1 : 0) + (game.players.O ? 1 : 0);
          lobbyGame.playerCount = playerCount;
          console.log(`Updated lobby game ${gameId} player count to ${playerCount}`);
        }
      }
    }
  }
  
  // Remove player-game association
  playerGames.delete(playerId);
  
  // Broadcast lobby update to all lobby clients
  sendLobbyUpdate();
}

// Start the server
const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

export default server;