'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LobbyGame } from '@shared/types/game';

export default function LobbyPage() {
  const router = useRouter();
  const [games, setGames] = useState<LobbyGame[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  const [gameName, setGameName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joinGameId, setJoinGameId] = useState('');
  
  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize lobby
  useEffect(() => {
    // Get player name from localStorage or use default
    const storedName = localStorage.getItem('playerName') || 'Player';
    setPlayerName(storedName);
    
    // Generate a random player ID
    const playerId = Math.random().toString(36).substring(2, 10);
    
    // Connect to WebSocket server for lobby
    const encodedName = encodeURIComponent(storedName || 'Anonymous');
    const wsUrl = `ws://localhost:8080?id=${playerId}&name=${encodedName}&lobby=true`;
    console.log('Attempting to connect to WebSocket:', wsUrl);
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      return;
    }
    
    const onOpen = () => {
      console.log('Connected to lobby WebSocket server');
      setIsConnected(true);
      
      // Request list of games
      try {
        ws.send(JSON.stringify({
          type: 'LIST_GAMES',
          payload: {}
        }));
      } catch (error) {
        console.error('Failed to send LIST_GAMES message:', error);
      }
    };
    
    const onMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    const onClose = (event: CloseEvent) => {
      console.log('Disconnected from lobby WebSocket server', event);
      setIsConnected(false);
    };
    
    const onError = (error: Event) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket URL:', wsUrl);
      console.error('Player name:', storedName);
      console.error('Player ID:', playerId);
      
      // Try to get more detailed error information
      try {
        // @ts-ignore - accessing WebSocket properties that may not be standard
        if (error && typeof error === 'object') {
          console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
      } catch (e) {
        console.error('Could not serialize error details:', e);
      }
      
      setIsConnected(false);
    };
    
    // Set up event listeners
    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', onMessage);
    ws.addEventListener('close', onClose);
    ws.addEventListener('error', onError);
    
    // Cleanup function
    return () => {
      // Remove event listeners
      if (ws) {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('message', onMessage);
        ws.removeEventListener('close', onClose);
        ws.removeEventListener('error', onError);
        
        // Close the connection
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }
    };
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = (data: any) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'LOBBY_UPDATE':
        setGames(payload.games);
        break;
        
      case 'GAME_CREATED':
        // Redirect to game page
        router.push(`/multiplayer?gameId=${payload.gameId}`);
        break;
        
      case 'GAME_START':
        // Redirect to game page as player O
        router.push(`/multiplayer?gameId=${payload.gameId}`);
        break;
        
      case 'ERROR':
        console.error('Server error:', payload.message);
        alert(`Error: ${payload.message}`);
        setIsLoading(false);
        break;
    }
  };

  // Handle creating a new game
  const handleCreateGame = () => {
    if (!gameName.trim()) {
      alert('Please enter a game name');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'CREATE_GAME',
        payload: { gameName: gameName.trim() }
      }));
    }
  };

  // Handle joining a game by ID
  const handleJoinGameById = () => {
    if (!joinGameId.trim()) {
      alert('Please enter a game ID');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_LOBBY_GAME',
        payload: { gameId: joinGameId.trim(), playerName }
      }));
    }
  };

  // Handle joining a game from the list
  const handleJoinGame = (gameId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_LOBBY_GAME',
        payload: { gameId, playerName }
      }));
    }
  };

  // Handle refreshing the game list
  const handleRefresh = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'LIST_GAMES',
        payload: {}
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Game Lobby</h1>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Create Game and Join by ID */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Create New Game</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Enter game name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleCreateGame}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Game'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Join Game by ID</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value)}
                  placeholder="Enter game ID"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleJoinGameById}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Available Games */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Available Games</h2>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            
            <div className="connection-status mb-4">
              <p className={isConnected ? "text-green-600" : "text-red-600"}>
                {isConnected ? "Connected to lobby" : "Connecting to lobby..."}
              </p>
            </div>
            
            {games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No games available. Create a new game or refresh the list.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {games.map((game) => (
                  <div 
                    key={game.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{game.name}</h3>
                        <p className="text-gray-600 text-sm">Created by: {game.createdBy}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {game.playerCount}/{game.maxPlayers}
                      </span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">ID: {game.id}</span>
                      <button
                        onClick={() => handleJoinGame(game.id)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Join Game
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}