import { POST, GET } from './route';
import { NextResponse } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: data,
      status: options?.status || 200,
    })),
  },
}));

describe('Game API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/game', () => {
    it('creates a new game with valid player info', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          playerName: 'TestUser',
          sessionId: 'test-session-id',
        }),
      } as unknown as Request;

      const response = await POST(request);

      expect(request.json).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data.gameId).toEqual(expect.any(String));
      expect(data.game).toMatchObject({
        board: expect.any(Array),
        currentPlayer: 'X',
        players: {
          X: {
            id: 'test-session-id',
            name: 'TestUser',
          },
          O: null,
        },
        status: 'WAITING_FOR_OPPONENT',
        winner: null,
      });
      expect(data.game.id).toEqual(data.gameId);
      expect(data.game.createdAt).toEqual(expect.any(String));
      expect(options?.status || 200).toBe(200);
    });

    it('returns error for missing player name', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          sessionId: 'test-session-id',
        }),
      } as unknown as Request;

      const response = await POST(request);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Player name is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('returns error for invalid player name type', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          playerName: 123,
          sessionId: 'test-session-id',
        }),
      } as unknown as Request;

      const response = await POST(request);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Player name is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('returns error for missing session ID', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          playerName: 'TestUser',
        }),
      } as unknown as Request;

      const response = await POST(request);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Session ID is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('returns error for invalid session ID type', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({
          playerName: 'TestUser',
          sessionId: 123,
        }),
      } as unknown as Request;

      const response = await POST(request);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Session ID is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('handles internal server errors', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Database error')),
      } as unknown as Request;

      const response = await POST(request);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Internal server error' });
      expect(options?.status || 200).toBe(500);
    });
  });

  describe('GET /api/game', () => {
    it('returns game info for valid game ID', async () => {
      // First create a game
      const postRequest = {
        json: jest.fn().mockResolvedValue({
          playerName: 'TestUser',
          sessionId: 'test-session-id',
        }),
      } as unknown as Request;

      await POST(postRequest);

      // Extract the gameId from the response
      const postCallArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const postData = postCallArgs[0];
      const gameId = postData.gameId;

      // Now test the GET request
      const url = `http://localhost:3000/api/game?gameId=${gameId}`;
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the second call arguments (first was for POST)
      const getCallArgs = (NextResponse.json as jest.Mock).mock.calls[1];
      const data = getCallArgs[0];
      const options = getCallArgs[1];
      
      expect(data.game).toMatchObject({
        id: gameId,
        board: expect.any(Array),
        currentPlayer: 'X',
        players: {
          X: {
            id: 'test-session-id',
            name: 'TestUser',
          },
          O: null,
        },
        status: 'WAITING_FOR_OPPONENT',
        winner: null,
      });
      expect(options?.status || 200).toBe(200);
    });

    it('returns error for missing game ID', async () => {
      const url = 'http://localhost:3000/api/game';
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Game ID is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('returns error for invalid game', async () => {
      const url = 'http://localhost:3000/api/game?gameId=invalid-game-id';
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Game not found' });
      expect(options?.status || 200).toBe(404);
    });

    it('handles internal server errors', async () => {
      const getRequest = {
        url: null, // This will cause an error when trying to parse the URL
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Internal server error' });
      expect(options?.status || 200).toBe(500);
    });
  });
});