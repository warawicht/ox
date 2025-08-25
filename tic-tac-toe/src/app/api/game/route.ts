import { NextResponse } from 'next/server';
import { initializeBoard } from '@/utils/gameLogic';

// This is a simple in-memory store for games
// In a real application, you would use a database
const games: Map<string, any> = new Map();

export async function POST(request: Request) {
  try {
    const { playerName, sessionId } = await request.json();
    
    if (!playerName || typeof playerName !== 'string') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }
    
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Generate a game ID
    const gameId = Math.random().toString(36).substring(2, 10);
    
    // Create a new game
    const game = {
      id: gameId,
      board: initializeBoard(),
      currentPlayer: 'X',
      players: {
        X: { id: sessionId, name: playerName },
        O: null
      },
      status: 'WAITING_FOR_OPPONENT',
      winner: null,
      createdAt: new Date().toISOString()
    };
    
    // Store the game
    games.set(gameId, game);
    
    // Return the game info
    return NextResponse.json({
      gameId,
      game
    });
  } catch (error) {
    console.error('Game creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      );
    }
    
    const game = games.get(gameId);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Return the game info
    return NextResponse.json({
      game
    });
  } catch (error) {
    console.error('Game retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}