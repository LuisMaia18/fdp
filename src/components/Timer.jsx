import React from 'react';
import { useGame } from '../contexts/GameContext';
import './Timer.css';

function Timer() {
  const { state } = useGame();
  
  if (state.timeRemaining === null || state.timeRemaining === undefined) {
    return null;
  }

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  const percentage = state.gameConfig.roundTimer > 0 ? 
    (state.timeRemaining / state.gameConfig.roundTimer) * 100 : 100;
  
  const isUrgent = state.timeRemaining <= 30;
  const isCritical = state.timeRemaining <= 10;

  return (
    <div className={`timer ${isUrgent ? 'urgent' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className="timer-text">{formattedTime}</span>
      </div>
    </div>
  );
}

export default Timer;