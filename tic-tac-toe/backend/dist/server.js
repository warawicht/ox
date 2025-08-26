"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = require("http");
const url_1 = require("url");
// In-memory storage for games and connections
const games = new Map();
const connections = new Map();
const playerGames = new Map();
// In-memory storage for lobby
const lobbyGames = new Map();
// Track which players are in lobby vs game mode
const playerModes = new Map();
// Create HTTP server
const server = (0, http_1.createServer)();
// Create WebSocket server
const wss = new ws_1.Server({ server });
wss.on('connection', (ws, req) => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        // Parse the URL to get player info
        const url = req.url ? (0, url_1.parse)(req.url, true) : null;
        const playerId = Array.isArray((_a = url === null || url === void 0 ? void 0 : url.query) === null || _a === void 0 ? void 0 : _a.id) ? (_b = url === null || url === void 0 ? void 0 : url.query) === null || _b === void 0 ? void 0 : _b.id[0] : ((_c = url === null || url === void 0 ? void 0 : url.query) === null || _c === void 0 ? void 0 : _c.id) || '';
        const playerName = Array.isArray((_d = url === null || url === void 0 ? void 0 : url.query) === null || _d === void 0 ? void 0 : _d.name) ? (_e = url === null || url === void 0 ? void 0 : url.query) === null || _e === void 0 ? void 0 : _e.name[0] : ((_f = url === null || url === void 0 ? void 0 : url.query) === null || _f === void 0 ? void 0 : _f.name) || 'Anonymous';
        const isInLobby = ((_g = url === null || url === void 0 ? void 0 : url.query) === null || _g === void 0 ? void 0 : _g.lobby) === 'true';
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('Error in WebSocket connection handler:', error);
        ws.close(4001, 'Internal server error');
    }
});
// Handle incoming messages
function handleMessage(playerId, data, playerName) {
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
function handleJoinGame(playerId, payload) {
    var _a, _b;
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
    let playerRole = null;
    let isNewPlayer = false;
    if (((_a = game.players.X) === null || _a === void 0 ? void 0 : _a.id) === playerId) {
        playerRole = 'X';
    }
    else if (((_b = game.players.O) === null || _b === void 0 ? void 0 : _b.id) === playerId) {
        playerRole = 'O';
    }
    else {
        // Player is not in the game, assign them a role
        isNewPlayer = true;
        if (!game.players.X) {
            game.players.X = { id: playerId, name: playerName };
            playerRole = 'X';
            // If this is the first player, keep status as WAITING_FOR_OPPONENT
            if (game.players.O) {
                game.status = 'PLAYER_X_TURN';
            }
        }
        else if (!game.players.O) {
            game.players.O = { id: playerId, name: playerName };
            playerRole = 'O';
            game.status = 'PLAYER_X_TURN';
        }
        else {
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
    // Notify players
    notifyPlayers(gameId, {
        type: 'GAME_UPDATE',
        payload: {
            game: Object.assign(Object.assign({}, game), { players: {
                    X: game.players.X ? { name: game.players.X.name } : null,
                    O: game.players.O ? { name: game.players.O.name } : null,
                } })
        }
    });
    // If both players have joined, start the game
    if (game.players.X && game.players.O) {
        notifyPlayers(gameId, {
            type: 'GAME_START',
            payload: {
                playerRole,
                game: Object.assign(Object.assign({}, game), { players: {
                        X: { name: game.players.X.name },
                        O: { name: game.players.O.name },
                    } })
            }
        });
    }
    else if (!isNewPlayer) {
        // If this is a reconnection, send GAME_START to the reconnecting player
        const ws = connections.get(playerId);
        if (ws) {
            ws.send(JSON.stringify({
                type: 'GAME_START',
                payload: {
                    playerRole,
                    game: Object.assign(Object.assign({}, game), { players: {
                            X: game.players.X ? { name: game.players.X.name } : null,
                            O: game.players.O ? { name: game.players.O.name } : null,
                        } })
                }
            }));
        }
    }
}
// Handle making a move
function handleMakeMove(playerId, payload) {
    var _a, _b;
    const gameId = playerGames.get(playerId);
    if (!gameId)
        return;
    const game = games.get(gameId);
    if (!game)
        return;
    const { index } = payload;
    // Verify it's the player's turn
    const playerXId = (_a = game.players.X) === null || _a === void 0 ? void 0 : _a.id;
    const playerOId = (_b = game.players.O) === null || _b === void 0 ? void 0 : _b.id;
    if ((game.currentPlayer === 'X' && playerId !== playerXId) ||
        (game.currentPlayer === 'O' && playerId !== playerOId)) {
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
    }
    else if (isDraw) {
        game.status = 'DRAW';
    }
    else {
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
function handleCreateGame(playerId, payload, playerName) {
    const { gameName } = payload;
    const gameId = Math.random().toString(36).substring(2, 10);
    // Create a new game in the lobby
    const lobbyGame = {
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
    const game = {
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
                game: Object.assign(Object.assign({}, game), { players: {
                        X: { name: game.players.X.name },
                        O: null,
                    } })
            }
        }));
    }
    // Broadcast lobby update to all lobby clients
    sendLobbyUpdate();
}
// Handle listing games in the lobby
function handleListGames(playerId) {
    // Clean up any stale games in the lobby
    cleanupLobbyGames();
    sendLobbyUpdate(playerId);
}
// Handle joining a game from the lobby
function handleJoinLobbyGame(playerId, payload, playerName) {
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
    // Remove game from lobby if it was there
    if (lobbyGame) {
        lobbyGames.delete(gameId);
    }
    // Notify both players
    notifyPlayers(gameId, {
        type: 'GAME_START',
        payload: {
            playerRole: 'O',
            game: Object.assign(Object.assign({}, game), { players: {
                    X: { name: game.players.X.name },
                    O: { name: game.players.O.name },
                } })
        }
    });
    // Broadcast lobby update to all lobby clients if the game was in the lobby
    if (lobbyGame) {
        sendLobbyUpdate();
    }
}
// Check for winner
function checkWinner(board) {
    const winCombos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
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
function notifyPlayers(gameId, message) {
    var _a, _b;
    const game = games.get(gameId);
    if (!game)
        return;
    const players = [(_a = game.players.X) === null || _a === void 0 ? void 0 : _a.id, (_b = game.players.O) === null || _b === void 0 ? void 0 : _b.id].filter(Boolean);
    players.forEach(playerId => {
        const ws = connections.get(playerId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    });
}
// Send lobby update to all lobby clients
function sendLobbyUpdate(targetPlayerId) {
    // Clean up any stale games in the lobby
    cleanupLobbyGames();
    // Convert lobby games to array and serialize dates as strings
    const lobbyGamesArray = Array.from(lobbyGames.values()).map(game => (Object.assign(Object.assign({}, game), { createdAt: game.createdAt // Already a string, no conversion needed
     })));
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
    }
    else {
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
        var _a;
        // Check if the game still exists in the main games map
        const game = games.get(gameId);
        if (!game) {
            // Game no longer exists, remove from lobby
            console.log(`Removing lobby game ${gameId} - game no longer exists in main games map`);
            lobbyGames.delete(gameId);
            return;
        }
        // Check if the game has both players
        if (game.players.X && game.players.O) {
            // Game is full, remove from lobby
            console.log(`Removing lobby game ${gameId} - game is full`);
            lobbyGames.delete(gameId);
            return;
        }
        // Check if the game creator is still connected
        const creatorId = (_a = game.players.X) === null || _a === void 0 ? void 0 : _a.id;
        if (creatorId && !connections.has(creatorId)) {
            // Creator disconnected, remove game
            console.log(`Removing lobby game ${gameId} - creator disconnected`);
            games.delete(gameId);
            lobbyGames.delete(gameId);
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
function handleDisconnect(playerId, mode) {
    var _a, _b;
    console.log(`Player ${playerId} disconnected from ${mode}`);
    // Remove connection
    connections.delete(playerId);
    // Remove player mode tracking
    playerModes.delete(playerId);
    // Get game ID for this player
    const gameId = playerGames.get(playerId);
    if (!gameId)
        return;
    // Remove player from game
    const game = games.get(gameId);
    if (game) {
        let playerRemoved = false;
        if (((_a = game.players.X) === null || _a === void 0 ? void 0 : _a.id) === playerId) {
            game.players.X = null;
            playerRemoved = true;
            console.log(`Player ${playerId} removed from X position in game ${gameId}`);
        }
        if (((_b = game.players.O) === null || _b === void 0 ? void 0 : _b.id) === playerId) {
            game.players.O = null;
            playerRemoved = true;
            console.log(`Player ${playerId} removed from O position in game ${gameId}`);
        }
        // If a player was removed, reset game status
        if (playerRemoved) {
            game.status = 'WAITING_FOR_OPPONENT';
            game.currentPlayer = 'X';
            game.board = Array(9).fill(null);
            game.winner = null;
            // Notify remaining player
            notifyPlayers(gameId, {
                type: 'PLAYER_DISCONNECTED',
                payload: { playerId }
            });
        }
        // If both players left, check if this is a lobby game
        if (!game.players.X && !game.players.O) {
            // Check if this is a lobby game
            const isLobbyGame = lobbyGames.has(gameId);
            console.log(`Game ${gameId} has no players. Is lobby game: ${isLobbyGame}`);
            // Only remove lobby games if they haven't been started properly
            // A game that has been started should remain in the system even if both players disconnect
            const gameHasStarted = game.status !== 'WAITING_FOR_OPPONENT';
            // If player disconnected from lobby and game hasn't started, remove the game
            // If player disconnected from game, keep the game for potential reconnection
            if (isLobbyGame && !gameHasStarted && mode === 'lobby') {
                // Remove both lobby and main game for lobby games that haven't started
                games.delete(gameId);
                lobbyGames.delete(gameId);
                console.log(`Removed lobby game ${gameId}`);
            }
            else if (isLobbyGame && mode === 'lobby') {
                // For lobby games that have started, just remove from lobby but keep the main game
                lobbyGames.delete(gameId);
                console.log(`Removed lobby game ${gameId} from lobby but kept main game`);
            }
            // If player disconnected from game mode, keep the game for potential reconnection
            // This allows players to rejoin games even after disconnecting
        }
        else if (game.players.X || game.players.O) {
            // If one player is still in the game, check if this is a lobby game
            const isLobbyGame = lobbyGames.has(gameId);
            if (isLobbyGame && mode === 'lobby') {
                // For lobby games where one player is still connected, just remove from lobby but keep the main game
                lobbyGames.delete(gameId);
                console.log(`Removed lobby game ${gameId} from lobby but kept main game`);
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
exports.default = server;
