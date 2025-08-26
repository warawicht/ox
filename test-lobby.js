const WebSocket = require('ws');

// Generate a random player ID and name
const playerId = Math.random().toString(36).substring(2, 10);
const playerName = 'LobbyTestPlayer';

// Connect to WebSocket server for lobby
const wsUrl = `ws://localhost:8080?id=${playerId}&name=${encodeURIComponent(playerName)}&lobby=true`;
console.log('Attempting to connect to WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('Connected to lobby WebSocket server');
  
  // Create a new game
  const gameName = 'Test Game ' + Math.random().toString(36).substring(2, 6);
  console.log('Creating game with name:', gameName);
  
  ws.send(JSON.stringify({
    type: 'CREATE_GAME',
    payload: { gameName }
  }));
});

ws.on('message', function incoming(data) {
  console.log('Received:', data.toString());
  
  const message = JSON.parse(data.toString());
  
  if (message.type === 'GAME_CREATED') {
    console.log('Game created successfully with ID:', message.payload.gameId);
    ws.close();
  } else if (message.type === 'ERROR') {
    console.error('Server error:', message.payload.message);
    ws.close();
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('Disconnected from WebSocket server');
});