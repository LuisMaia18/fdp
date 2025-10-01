import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameBoard from './components/GameBoard';
import './App.css';

function GameRouter() {
  const { state, GAME_STATES } = useGame();

  switch (state.gameState) {
    case GAME_STATES.LOBBY:
      return <Lobby />;
    
    case GAME_STATES.WAITING_FOR_PLAYERS:
      return <WaitingRoom />;
    
    case GAME_STATES.PLAYING:
    case GAME_STATES.ROUND_VOTING:
    case GAME_STATES.ROUND_RESULTS:
    case GAME_STATES.GAME_OVER:
      return <GameBoard />;
    
    default:
      return <Lobby />;
  }
}

function App() {
  return (
    <GameProvider>
      <div className="app">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
