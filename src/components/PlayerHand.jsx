import React from 'react';
import { useGame } from '../contexts/GameContext';
import './PlayerHand.css';

function PlayerHand({ selectedCard, onCardSelect }) {
  const { state } = useGame();
  
  const playerHand = state.playerHands[state.currentPlayer?.id] || [];

  const handleCardClick = (card) => {
    if (selectedCard === card) {
      onCardSelect(null); // Deseleciona se já estava selecionada
    } else {
      onCardSelect(card);
    }
  };

  if (playerHand.length === 0) {
    return (
      <div className="player-hand">
        <div className="no-cards">
          <p>Carregando suas cartas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-hand">
      <div className="hand-header">
        <h3>Suas Cartas ({playerHand.length})</h3>
        <p>Clique em uma carta para selecioná-la</p>
      </div>
      
      <div className="cards-container">
        <div className="cards-grid">
          {playerHand.map((card, index) => (
            <div
              key={`${card}-${index}`}
              className={`answer-card ${selectedCard === card ? 'selected' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="card-content">
                <div className="card-text">{card}</div>
                {selectedCard === card && (
                  <div className="selection-indicator">
                    <span className="check-icon">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedCard && (
        <div className="selected-card-preview">
          <h4>Carta Selecionada:</h4>
          <div className="preview-card">
            {selectedCard}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerHand;