const WebSocket = require('ws');

console.log('Testing simple game creation and joining...');

// Step 1: Connect to lobby and create a game
const playerId1 = Math.random().toString(36).substring(2, 10);
const playerName1 = 'Player1';
const wsUrl1 = `ws://localhost:8080?id=${playerId1}&name=${encodeURIComponent(playerName1)}&lobby=true`;

console.log('Player 1 connecting to lobby:', wsUrl1);

const ws1 = new WebSocket(wsUrl1);

ws1.on('open', function open() {
  console.log('Player 1 connected to lobby');
  
  // Create a new game
  const gameName = 'Test Game ' + Math.random().toString(36).substring(2, 6);
  console.log('Player 1 creating game with name:', gameName);
  
  ws1.send(JSON.stringify({
    type: 'CREATE_GAME',
    payload: { gameName }
  }));
});

let gameId = null;

ws1.on('message', function incoming(data) {
  const message = JSON.parse(data.toString());
  console.log('Player 1 received:', message.type);
  
  if (message.type === 'GAME_CREATED') {
    gameId = message.payload.gameId;
    console.log('Game created successfully with ID:', gameId);
    ws1.close();
    
    // Connect second player directly to join the game
    setTimeout(() => {
      const playerId2 = Math.random().toString(36).substring(2, 10);
      const playerName2 = 'Player2';
      const wsUrl2 = `ws://localhost:8080?id=${playerId2}&name=${encodeURIComponent(playerName2)}&lobby=true`;
      
      console.log('Player 2 connecting to lobby:', wsUrl2);
      
      const ws2 = new WebSocket(wsUrl2);
      
      ws2.on('open', function open() {
        console.log('Player 2 connected to lobby');
        
        // Join the created game
        console.log('Player 2 joining game:', gameId);
        
        ws2.send(JSON.stringify({
          type: 'JOIN_LOBBY_GAME',
          payload: { gameId, playerName: playerName2 }
        }));
      });
      
      ws2.on('message', function incoming(data) {
        const message = JSON.parse(data.toString());
        console.log('Player 2 received:', message.type);
        
        if (message.type === 'GAME_START') {
          console.log('Game started successfully for Player 2!');
          console.log('Player 2 role:', message.payload.playerRole);
          ws2.close();
        } else if (message.type === 'ERROR') {
          console.error('Player 2 error:', message.payload.message);
          ws2.close();
        }
      });
      
      ws2.on('error', function error(err) {
        console.error('Player 2 WebSocket error:', err);
      });
      
      ws2.on('close', function close() {
        console.log('Player 2 disconnected from WebSocket server');
      });
    }, 1000);
  } else if (message.type === 'ERROR') {
    console.error('Player 1 error:', message.payload.message);
  }
});

ws1.on('error', function error(err) {
  console.error('Player 1 WebSocket error:', err);
});