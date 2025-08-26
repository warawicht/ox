'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [playerName, setPlayerName] = useState('Player');

  // Save player name to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <main className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Tic-Tac-Toe</h1>
          <p className="text-lg text-gray-600">Choose your game mode</p>
        </div>

        <div className="w-full">
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Link 
            href="/lobby" 
            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Game Lobby</h2>
            <p className="text-gray-600 text-center">Find and join games or create your own</p>
          </Link>

          <Link 
            href="/multiplayer" 
            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Direct Connect</h2>
            <p className="text-gray-600 text-center">Play with a friend using a game ID</p>
          </Link>

          <Link 
            href="/vs-cpu" 
            className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">vs CPU</h2>
            <p className="text-gray-600 text-center">Play against the computer</p>
          </Link>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>Welcome, {playerName}!</p>
        </div>
      </main>
    </div>
  );
}