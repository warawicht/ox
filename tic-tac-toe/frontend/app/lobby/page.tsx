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
    const ws = new WebSocket(`ws://localhost:8080?id=${playerId}&name=${storedName}&lobby=true`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Connected to lobby WebSocket server');
      setIsConnected(true);
      
      // Request list of games
      ws.send(JSON.stringify({
        type: 'LIST_GAMES',
        payload: {}
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
      console.log('Disconnected from lobby WebSocket server');
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

  // Handle joining a game
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

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Create New Game</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name (optional)"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="mt-4">
                    <button
                      onClick={() => handleJoinGame(game.id)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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
  );
}