import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
  },
  writable: true,
});

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page title and description', () => {
    render(<Home />);
    
    expect(screen.getByText('Tic-Tac-Toe')).toBeInTheDocument();
    expect(screen.getByText('Choose your game mode')).toBeInTheDocument();
  });

  it('renders the player name input with default value', () => {
    render(<Home />);
    
    const input = screen.getByLabelText('Your Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Player');
  });

  it('allows player name to be changed', () => {
    render(<Home />);
    
    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'New Player' } });
    expect(input).toHaveValue('New Player');
  });

  it('renders the multiplayer game mode option', () => {
    render(<Home />);
    
    const multiplayerLink = screen.getByText('Multiplayer');
    expect(multiplayerLink).toBeInTheDocument();
    expect(multiplayerLink.closest('a')).toHaveAttribute('href', '/multiplayer');
  });

  it('renders the vs CPU game mode option', () => {
    render(<Home />);
    
    const vsCpuLink = screen.getByText('vs CPU');
    expect(vsCpuLink).toBeInTheDocument();
    expect(vsCpuLink.closest('a')).toHaveAttribute('href', '/vs-cpu');
  });

  it('displays welcome message with player name', () => {
    render(<Home />);
    
    expect(screen.getByText('Welcome, Player!')).toBeInTheDocument();
  });

  it('updates welcome message when player name changes', () => {
    render(<Home />);
    
    const input = screen.getByLabelText('Your Name');
    fireEvent.change(input, { target: { value: 'Alice' } });
    
    expect(screen.getByText('Welcome, Alice!')).toBeInTheDocument();
  });

  it('has proper styling for game mode cards', () => {
    render(<Home />);
    
    const multiplayerCard = screen.getByText('Multiplayer').closest('a');
    const vsCpuCard = screen.getByText('vs CPU').closest('a');
    
    expect(multiplayerCard).toHaveClass('rounded-xl', 'shadow-lg');
    expect(vsCpuCard).toHaveClass('rounded-xl', 'shadow-lg');
  });

  it('has proper styling for player name input', () => {
    render(<Home />);
    
    const input = screen.getByLabelText('Your Name');
    expect(input).toHaveClass('px-4', 'py-2', 'border', 'rounded-lg');
  });

  it('has proper styling for main container', () => {
    render(<Home />);
    
    const main = screen.getByText('Tic-Tac-Toe').closest('main');
    expect(main).toHaveClass('flex', 'flex-col', 'items-center');
  });
});