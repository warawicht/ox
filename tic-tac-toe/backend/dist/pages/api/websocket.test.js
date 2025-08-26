"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
// Mock the WebSocket and HTTP server modules
const mockWebSocket = {
    on: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1,
};
const mockWebSocketServer = {
    on: jest.fn(),
};
const mockHttpServer = {
    listen: jest.fn(),
};
jest.mock('ws', () => {
    return {
        Server: jest.fn(() => mockWebSocketServer),
    };
});
jest.mock('http', () => {
    return {
        createServer: jest.fn(() => mockHttpServer),
    };
});
// Mock the URL parsing
jest.mock('url', () => {
    return {
        parse: jest.fn(() => ({
            query: {
                id: 'test-player-id',
                name: 'TestPlayer',
            },
        })),
    };
});
describe('WebSocket Server', () => {
    let websocketModule;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });
    it('sets up WebSocket server correctly', async () => {
        // Import the module after mocks are set up
        websocketModule = await Promise.resolve().then(() => __importStar(require('./websocket')));
        // Check that the WebSocket server was created
        const wsModule = require('ws');
        expect(wsModule.Server).toHaveBeenCalled();
        // Check that the HTTP server was created
        const httpModule = require('http');
        expect(httpModule.createServer).toHaveBeenCalled();
        // Check that the server listens on the correct port
        expect(mockHttpServer.listen).toHaveBeenCalledWith(expect.anything(), // PORT
        expect.any(Function) // Callback function
        );
    });
    it('handles new WebSocket connections', async () => {
        websocketModule = await Promise.resolve().then(() => __importStar(require('./websocket')));
        // Simulate a new connection
        const connectionHandler = mockWebSocketServer.on.mock.calls.find(call => call[0] === 'connection')[1];
        const mockRequest = {
            url: '/?id=test-player-id&name=TestPlayer',
        };
        connectionHandler(mockWebSocket, mockRequest);
        // Check that the connection was stored
        expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
            type: 'CONNECTED',
            payload: {
                playerId: 'test-player-id',
                playerName: 'TestPlayer',
            },
        }));
    });
    it('handles missing player ID', async () => {
        jest.mock('url', () => {
            return {
                parse: jest.fn(() => ({
                    query: {},
                })),
            };
        });
        websocketModule = await Promise.resolve().then(() => __importStar(require('./websocket')));
        // Simulate a new connection without player ID
        const connectionHandler = mockWebSocketServer.on.mock.calls.find(call => call[0] === 'connection')[1];
        const mockRequest = {
            url: '/',
        };
        connectionHandler(mockWebSocket, mockRequest);
        // Check that the connection was closed with an error
        expect(mockWebSocket.close).toHaveBeenCalledWith(4000, 'Player ID is required');
    });
});
