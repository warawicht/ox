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

describe('Auth API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth', () => {
    it('creates a new session with valid name', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ name: 'TestUser' }),
      } as unknown as Request;

      const response = await POST(request);

      expect(request.json).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toMatchObject({
        name: 'TestUser',
      });
      expect(data.sessionId).toEqual(expect.any(String));
      expect(data.expiresAt).toEqual(expect.any(String));
      expect(options?.status || 200).toBe(200);
    });

    it('returns error for missing name', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({}),
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

    it('returns error for invalid name type', async () => {
      const request = {
        json: jest.fn().mockResolvedValue({ name: 123 }),
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

  describe('GET /api/auth', () => {
    it('returns session info for valid session ID', async () => {
      // First create a session
      const postRequest = {
        json: jest.fn().mockResolvedValue({ name: 'TestUser' }),
      } as unknown as Request;

      await POST(postRequest);

      // Extract the sessionId from the response
      const postCallArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const postData = postCallArgs[0];
      const sessionId = postData.sessionId;

      // Now test the GET request
      const url = `http://localhost:3000/api/auth?sessionId=${sessionId}`;
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the second call arguments (first was for POST)
      const getCallArgs = (NextResponse.json as jest.Mock).mock.calls[1];
      const data = getCallArgs[0];
      const options = getCallArgs[1];
      
      expect(data).toMatchObject({
        sessionId: sessionId,
        name: 'TestUser',
      });
      expect(options?.status || 200).toBe(200);
    });

    it('returns error for missing session ID', async () => {
      const url = 'http://localhost:3000/api/auth';
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Session ID is required' });
      expect(options?.status || 200).toBe(400);
    });

    it('returns error for invalid session', async () => {
      const url = 'http://localhost:3000/api/auth?sessionId=invalid-session-id';
      const getRequest = {
        url,
      } as unknown as Request;

      const response = await GET(getRequest);

      expect(NextResponse.json).toHaveBeenCalled();
      
      // Get the first call arguments
      const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
      const data = callArgs[0];
      const options = callArgs[1];
      
      expect(data).toEqual({ error: 'Invalid session' });
      expect(options?.status || 200).toBe(401);
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