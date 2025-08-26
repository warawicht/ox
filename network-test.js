// Simple network test to check connectivity between frontend and backend
const http = require('http');

console.log('Testing connectivity to backend server on port 8080...');

// Test HTTP connection
const options = {
  hostname: 'localhost',
  port: 8080,
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('HTTP connection test result:');
  console.log('  Status Code:', res.statusCode);
  console.log('  Headers:', res.headers);
  
  res.on('data', (chunk) => {
    console.log('  Body:', chunk.toString());
  });
  
  res.on('end', () => {
    console.log('  Request completed');
  });
});

req.on('error', (e) => {
  console.error('HTTP connection error:', e.message);
});

req.on('timeout', () => {
  console.error('HTTP connection timeout');
  req.destroy();
});

req.end();

// Test WebSocket connection
const WebSocket = require('ws');

const playerId = Math.random().toString(36).substring(2, 10);
const playerName = 'NetworkTest';
const wsUrl = `ws://localhost:8080?id=${playerId}&name=${encodeURIComponent(playerName)}&lobby=true`;

console.log('Testing WebSocket connection to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('WebSocket connection established successfully');
  ws.close();
});

ws.on('error', (error) => {
  console.error('WebSocket connection error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});