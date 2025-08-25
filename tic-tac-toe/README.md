# Tic-Tac-Toe Game

A multiplayer Tic-Tac-Toe game built with Next.js, TypeScript, and WebSocket.

## Project Structure

This project follows a frontend-backend separation architecture:

```
tic-tac-toe/
├── frontend/                # Next.js frontend application
│   ├── app/                 # App Router pages and components
│   ├── components/          # Reusable UI components
│   ├── utils/               # Frontend utilities
│   └── ...                  # Configuration files
├── backend/                 # Standalone WebSocket server
│   ├── src/                 # Backend source code
│   └── ...                  # Configuration files
├── shared/                  # Shared code between frontend and backend
│   └── types/               # Shared TypeScript types
└── ...                      # Root configuration files
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (version 7 or higher, for workspaces support)

### Installation

1. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them separately:
```bash
# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

### Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the applications:
   ```bash
   npm run start
   ```

Or start them separately:
```bash
# Start only frontend
npm run start:frontend

# Start only backend
npm run start:backend
```

## Available Scripts

### Root Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend in development mode
- `npm run dev:backend` - Start only backend in development mode
- `npm run build` - Build the frontend application
- `npm run build:frontend` - Build the frontend application
- `npm run build:backend` - Build the backend application
- `npm run start` - Start both frontend and backend in production mode
- `npm run start:frontend` - Start only frontend in production mode
- `npm run start:backend` - Start only backend in production mode
- `npm run test` - Run tests for both frontend and backend
- `npm run lint` - Run linting for frontend

### Frontend Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run start` - Start frontend production server
- `npm run test` - Run frontend tests
- `npm run test:watch` - Run frontend tests in watch mode
- `npm run test:coverage` - Run frontend tests with coverage report
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm run dev` - Start backend development server
- `npm run build` - Build backend for production
- `npm run start` - Start backend production server
- `npm run test` - Run backend tests
- `npm run test:watch` - Run backend tests in watch mode

## Architecture

### Frontend
The frontend is a Next.js application that uses:
- React for UI components
- Tailwind CSS for styling
- WebSocket client for real-time multiplayer functionality

### Backend
The backend is a standalone WebSocket server that:
- Manages game state and player connections
- Handles game logic and move validation
- Broadcasts game updates to connected players

### Shared Types
Common TypeScript types are shared between frontend and backend to ensure consistency.

## Testing

Run tests for both frontend and backend:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Deployment

### Frontend
The frontend can be deployed to any static hosting service (Vercel, Netlify, etc.) or served by the backend.

### Backend
The backend can be deployed to any Node.js hosting service or containerized with Docker.