// Game board representation
export type Player = 'X' | 'O' | null;
export type Board = Player[];
export type GameStatus = 
  | 'WAITING_FOR_OPPONENT' 
  | 'PLAYER_X_TURN' 
  | 'PLAYER_O_TURN' 
  | 'PLAYER_X_WON' 
  | 'PLAYER_O_WON' 
  | 'DRAW';

// WebSocket message types
export type WebSocketMessageType = 
  | 'CONNECTED'
  | 'JOIN_GAME'
  | 'GAME_START'
  | 'GAME_UPDATE'
  | 'MOVE_MADE'
  | 'PLAYER_DISCONNECTED'
  | 'ERROR'
  // Lobby message types
  | 'CREATE_GAME'
  | 'LIST_GAMES'
  | 'JOIN_LOBBY_GAME'
  | 'LOBBY_UPDATE'
  | 'GAME_CREATED';

// WebSocket message structure
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

// Game state structure
export interface Game {
  id: string;
  name?: string; // Optional friendly name for the game
  board: Board;
  currentPlayer: Player;
  players: {
    X: { id: string; name: string } | null;
    O: { id: string; name: string } | null;
  };
  status: GameStatus;
  winner: Player | null;
}

// Lobby game model
export interface LobbyGame {
  id: string;
  name: string; // Friendly name for the game
  playerCount: number;
  maxPlayers: number;
  status: 'WAITING_FOR_OPPONENT';
  createdAt: Date;
  createdBy: string; // Player name who created the game
}