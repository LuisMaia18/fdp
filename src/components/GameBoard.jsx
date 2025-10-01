import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerHand from './PlayerHand';
import SubmittedAnswers from './SubmittedAnswers';
import Timer from './Timer';
import Scoreboard from './Scoreboard';
import './GameBoard.css';

function GameBoard() {
  const { state, actions, GAME_STATES } = useGame();
  const [selectedAnswerCard, setSelectedAnswerCard] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);

  const isCurrentPlayerFDP = state.currentPlayer?.id === state.currentFDP;
  const hasSubmittedAnswer = state.submittedAnswers[state.currentPlayer?.id];
  const allPlayersSubmitted = state.players
    .filter(p => p.id !== state.currentFDP)
    .every(p => state.submittedAnswers[p.id]);

  // Auto-avançar para votação quando todos submeterem
  useEffect(() => {
    if (state.gameState === GAME_STATES.PLAYING && allPlayersSubmitted && !isCurrentPlayerFDP) {
      setTimeout(() => {
        actions.setGameState(GAME_STATES.ROUND_VOTING);
        if (state.gameConfig.votingTimer > 0) {
          actions.startTimer(state.gameConfig.votingTimer);
        }
      }, 1000);
    }
  }, [allPlayersSubmitted, state.gameState, isCurrentPlayerFDP]);

  const handleSubmitAnswer = () => {
    if (selectedAnswerCard && !hasSubmittedAnswer) {
      actions.submitAnswer(selectedAnswerCard);
      setSelectedAnswerCard(null);
    }
  };

  const handleSelectWinner = (playerId) => {
    if (isCurrentPlayerFDP && state.gameState === GAME_STATES.ROUND_VOTING) {
      actions.selectWinner(playerId);
    }
  };

  const formatQuestionCard = (question, answer = null) => {
    if (!question) return '';
    
    if (answer) {
      return question.replace('______', `**${answer}**`);
    }
    
    return question;
  };

  const getPlayerByCard = (answerCard) => {
    const playerId = Object.keys(state.submittedAnswers).find(
      id => state.submittedAnswers[id] === answerCard
    );
    return state.players.find(p => p.id === playerId);
  };

  const handleLeaveGame = () => {
    if (window.confirm('Tem certeza que deseja sair do jogo?')) {
      actions.resetGame();
    }
  };

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-header">
        <div className="game-info">
          <h1 className="game-title">Foi De Propósito</h1>
          <div className="round-info">
            <span className="round-text">
              FDP da vez: <strong>{state.players.find(p => p.id === state.currentFDP)?.name}</strong>
            </span>
            {state.gameConfig.roundTimer > 0 && (
              <Timer />
            )}
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="scoreboard-btn"
            onClick={() => setShowScoreboard(!showScoreboard)}
          >
            📊 Placar
          </button>
          <button className="leave-btn" onClick={handleLeaveGame}>
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <div className="modal-overlay" onClick={() => setShowScoreboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Scoreboard />
            <button 
              className="close-modal-btn"
              onClick={() => setShowScoreboard(false)}
            >
              ✕ Fechar
            </button>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="game-main">
        {/* Question Card */}
        <div className="question-section">
          <div className="question-card">
            <div className="card-header">
              <span className="card-type">Carta de Pergunta</span>
              {state.gameState === GAME_STATES.ROUND_VOTING && (
                <span className="voting-indicator">🗳️ Votação</span>
              )}
            </div>
            <div className="question-text">
              {formatQuestionCard(state.currentQuestionCard)}
            </div>
            {isCurrentPlayerFDP && state.gameState === GAME_STATES.ROUND_VOTING && (
              <div className="fdp-instruction">
                👑 Escolha a resposta mais engraçada!
              </div>
            )}
          </div>
        </div>

        {/* Game State Content */}
        <div className="game-content">
          {state.gameState === GAME_STATES.PLAYING && (
            <>
              {isCurrentPlayerFDP ? (
                <div className="fdp-waiting">
                  <div className="waiting-card">
                    <h3>👑 Você é o FDP desta rodada!</h3>
                    <p>Aguarde os outros jogadores escolherem suas respostas...</p>
                    <div className="submission-status">
                      <span className="submitted-count">
                        {Object.keys(state.submittedAnswers).length} / {state.players.length - 1} respostas recebidas
                      </span>
                      <div className="submission-progress">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${(Object.keys(state.submittedAnswers).length / (state.players.length - 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="player-section">
                  {hasSubmittedAnswer ? (
                    <div className="answer-submitted">
                      <div className="submitted-card">
                        <h3>✅ Resposta Enviada!</h3>
                        <p>Aguarde os outros jogadores e a decisão do FDP...</p>
                        <div className="submitted-answer">
                          <strong>Sua resposta:</strong> {hasSubmittedAnswer}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="answer-selection">
                      <h3>Escolha sua resposta:</h3>
                      <PlayerHand 
                        selectedCard={selectedAnswerCard}
                        onCardSelect={setSelectedAnswerCard}
                      />
                      <div className="submit-section">
                        <button 
                          className="submit-answer-btn"
                          onClick={handleSubmitAnswer}
                          disabled={!selectedAnswerCard}
                        >
                          📤 Enviar Resposta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {state.gameState === GAME_STATES.ROUND_VOTING && (
            <div className="voting-section">
              <h3>
                {isCurrentPlayerFDP ? 
                  '👑 Escolha a melhor resposta:' : 
                  '🗳️ Aguarde a escolha do FDP:'
                }
              </h3>
              <SubmittedAnswers 
                question={state.currentQuestionCard}
                answers={state.submittedAnswers}
                onSelectWinner={handleSelectWinner}
                canVote={isCurrentPlayerFDP}
                currentPlayer={state.currentPlayer}
              />
            </div>
          )}

          {state.gameState === GAME_STATES.ROUND_RESULTS && (
            <div className="results-section">
              <div className="round-results">
                <h2>🎉 Resultado da Rodada</h2>
                <div className="winner-announcement">
                  <div className="winner-card">
                    <img 
                      src={state.players.find(p => p.id === state.roundWinner)?.avatar} 
                      alt="Winner"
                      className="winner-avatar"
                    />
                    <div className="winner-info">
                      <h3>{state.players.find(p => p.id === state.roundWinner)?.name}</h3>
                      <p>ganhou esta rodada!</p>
                    </div>
                  </div>
                  
                  <div className="winning-combination">
                    <div className="winning-question">
                      {formatQuestionCard(
                        state.currentQuestionCard, 
                        state.submittedAnswers[state.roundWinner]
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="next-round-info">
                  <p>Próxima rodada começando...</p>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.gameState === GAME_STATES.GAME_OVER && (
            <div className="game-over-section">
              <div className="game-over">
                <h2>🏆 Fim de Jogo!</h2>
                <div className="final-winner">
                  <div className="winner-podium">
                    <img 
                      src={state.players.find(p => p.id === state.roundWinner)?.avatar} 
                      alt="Final Winner"
                      className="final-winner-avatar"
                    />
                    <h3>{state.players.find(p => p.id === state.roundWinner)?.name}</h3>
                    <p>É o grande vencedor!</p>
                    <div className="trophy">🏆</div>
                  </div>
                </div>
                
                <Scoreboard showFinal={true} />
                
                <div className="game-over-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => actions.resetGame()}
                  >
                    🎮 Jogar Novamente
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.location.reload()}
                  >
                    🏠 Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="error-toast">
          <span className="error-icon">⚠️</span>
          {state.error}
          <button className="error-close" onClick={() => actions.setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default GameBoard;