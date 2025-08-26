const WebSocket = require('ws');

// Generate a random player ID and name
const playerId = Math.random().toString(36).substring(2, 10);
const playerName = 'TestPlayer';

// Connect to WebSocket server for lobby
const wsUrl = `ws://localhost:8080?id=${playerId}&name=${encodeURIComponent(playerName)}&lobby=true`;
console.log('Attempting to connect to WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('Connected to lobby WebSocket server');
  
  // Request list of games
  ws.send(JSON.stringify({
    type: 'LIST_GAMES',
    payload: {}
  }));
});

ws.on('message', function incoming(data) {
  console.log('Received:', data.toString());
  
  const message = JSON.parse(data.toString());
  if (message.type === 'LOBBY_UPDATE') {
    console.log('Lobby update received with', message.payload.games.length, 'games');
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('Disconnected from WebSocket server');
});