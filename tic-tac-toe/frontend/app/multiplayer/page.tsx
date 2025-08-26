'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GameBoard from '../../components/GameBoard';
import GameControls from '../../components/GameControls';
import GameStatus from '../../components/GameStatus';
import PlayerInfo from '../../components/PlayerInfo';
import { 
  initializeBoard, 
  Board, 
  Player, 
  GameStatus as GameStatusType, 
  getWinningCombination 
} from '../../utils/gameLogic';

export default function MultiplayerGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [status, setStatus] = useState<GameStatusType>('WAITING_FOR_OPPONENT');
  const [winner, setWinner] = useState<Player>(null);
  const [playerName, setPlayerName] = useState('Player');
  const [opponentName, setOpponentName] = useState('Opponent');
  const [isConnected, setIsConnected] = useState(false);
  const [playerWins, setPlayerWins] = useState(0);
  const [playerLosses, setPlayerLosses] = useState(0);
  const [playerDraws, setPlayerDraws] = useState(0);
  const [opponentWins, setOpponentWins] = useState(0);
  const [opponentLosses, setOpponentLosses] = useState(0);
  const [opponentDraws, setOpponentDraws] = useState(0);
  const [winningCombination, setWinningCombination] = useState<number[] | null>(null);
  const [gameId, setGameId] = useState<string>('');
  const [playerRole, setPlayerRole] = useState<Player>(null);
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize game
  useEffect(() => {
    // Get player name from localStorage or use default
    const storedName = localStorage.getItem('playerName') || 'Player';
    setPlayerName(storedName);
    
    // Check if we're joining an existing game from the lobby
    const lobbyGameId = searchParams.get('gameId');
    
    // Generate a random game ID if not provided
    const newGameId = lobbyGameId || Math.random().toString(36).substring(2, 10);
    setGameId(newGameId);
    
    // Generate a random player ID
    const playerId = Math.random().toString(36).substring(2, 10);
    
    // Connect to WebSocket server
    const ws = new WebSocket(`ws://localhost:8080?id=${playerId}&name=${storedName}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      
      // Join the game
      ws.send(JSON.stringify({
        type: 'JOIN_GAME',
        payload: { gameId: newGameId, playerName: storedName }
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [searchParams]);

  // Handle incoming WebSocket messages
  const handleMessage = (data: any) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'GAME_START':
        setPlayerRole(payload.playerRole);
        setStatus(payload.game.status);
        setCurrentPlayer(payload.game.currentPlayer);
        setBoard(payload.game.board);
        // Update player names
        if (payload.game.players.X) {
          if (payload.playerRole === 'X') {
            setPlayerName(payload.game.players.X.name);
          } else {
            setOpponentName(payload.game.players.X.name);
          }
        }
        if (payload.game.players.O) {
          if (payload.playerRole === 'O') {
            setPlayerName(payload.game.players.O.name);
          } else {
            setOpponentName(payload.game.players.O.name);
          }
        }
        break;
        
      case 'GAME_UPDATE':
        // Update player names
        if (payload.game.players.X) {
          setOpponentName(payload.game.players.X.name);
        }
        if (payload.game.players.O) {
          setOpponentName(payload.game.players.O.name);
        }
        break;
        
      case 'MOVE_MADE':
        setBoard(payload.game.board);
        setCurrentPlayer(payload.game.currentPlayer);
        setStatus(payload.game.status);
        setWinner(payload.game.winner);
        
        if (payload.game.winner) {
          setWinningCombination(getWinningCombination(payload.game.board));
          // Update scores
          if (payload.game.winner === playerRole) {
            setPlayerWins(prev => prev + 1);
            setOpponentLosses(prev => prev + 1);
          } else {
            setPlayerLosses(prev => prev + 1);
            setOpponentWins(prev => prev + 1);
          }
        } else if (payload.game.status === 'DRAW') {
          setPlayerDraws(prev => prev + 1);
          setOpponentDraws(prev => prev + 1);
        }
        break;
        
      case 'PLAYER_DISCONNECTED':
        setStatus('WAITING_FOR_OPPONENT');
        break;
        
      case 'ERROR':
        console.error('Server error:', payload.message);
        break;
    }
  };

  // Handle cell click
  const handleCellClick = (index: number) => {
    // Only allow moves when it's the player's turn and connected
    if (!isConnected || status !== `${playerRole === 'X' ? 'PLAYER_X' : 'PLAYER_O'}_TURN`) return;
    
    // Send move to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'MAKE_MOVE',
        payload: { index }
      }));
    }
  };

  // Start a new game
  const handleNewGame = () => {
    // In a real implementation, you would request a new game from the server
    // For now, we'll just reset the local state
    setBoard(initializeBoard());
    setCurrentPlayer('X');
    setStatus('WAITING_FOR_OPPONENT');
    setWinner(null);
    setWinningCombination(null);
    
    // Rejoin the game
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_GAME',
        payload: { gameId, playerName }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tic-Tac-Toe Multiplayer</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info */}
          <div className="space-y-4">
            <PlayerInfo 
              player="X"
              playerName={playerRole === 'X' ? playerName : opponentName}
              wins={playerRole === 'X' ? playerWins : opponentWins}
              losses={playerRole === 'X' ? playerLosses : opponentLosses}
              draws={playerRole === 'X' ? playerDraws : opponentDraws}
              isCurrentPlayer={status === 'PLAYER_X_TURN' && playerRole === 'X'}
            />
            <PlayerInfo 
              player="O"
              playerName={playerRole === 'O' ? playerName : opponentName}
              wins={playerRole === 'O' ? playerWins : opponentWins}
              losses={playerRole === 'O' ? playerLosses : opponentLosses}
              draws={playerRole === 'O' ? playerDraws : opponentDraws}
              isCurrentPlayer={status === 'PLAYER_O_TURN' && playerRole === 'O'}
            />
          </div>

          {/* Game Board and Controls */}
          <div className="flex flex-col items-center space-y-6">
            <GameStatus 
              status={status}
              currentPlayer={currentPlayer}
              winner={winner}
              playerName={playerName}
              opponentName={opponentName}
              isMultiplayer={true}
              isConnected={isConnected}
            />
            
            <GameBoard 
              board={board}
              onCellClick={handleCellClick}
              disabled={!isConnected || status !== `${playerRole === 'X' ? 'PLAYER_X' : 'PLAYER_O'}_TURN`}
              winningCombination={winningCombination}
            />
            
            <GameControls 
              onNewGame={handleNewGame}
              isMultiplayer={true}
            />
          </div>

          {/* Game Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {playerRole === 'X' ? (
                <li>Share the game ID with a friend: <strong>{gameId}</strong></li>
              ) : (
                <li>You've joined game: <strong>{gameId}</strong></li>
              )}
              <li>Take turns placing X and O on the board</li>
              <li>First to get 3 in a row wins</li>
              <li>Rows, columns, and diagonals all count</li>
            </ul>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">Connection Status</h3>
              <p className={isConnected ? "text-green-600" : "text-red-600"}>
                {isConnected ? "Connected to server" : "Connecting to server..."}
              </p>
              {gameId && (
                <p className="mt-2 text-sm text-gray-600">
                  Game ID: <span className="font-mono">{gameId}</span>
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <button 
                onClick={() => router.push('/lobby')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}