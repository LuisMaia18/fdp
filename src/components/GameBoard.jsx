import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import PlayerHand from './PlayerHand';
import SubmittedAnswers from './SubmittedAnswers';
import Timer from './Timer';
import Scoreboard from './Scoreboard';
import './GameBoard.css';
import Mascot from './Mascot';

function GameBoard() {
  const { state, actions, GAME_STATES } = useGame();
  const [selectedAnswerCard, setSelectedAnswerCard] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [roundTransitionSeconds, setRoundTransitionSeconds] = useState(0);

  const isCurrentPlayerFDP = state.currentPlayer?.id === state.currentFDP;
  const hasSubmittedAnswer = state.submittedAnswers[state.currentPlayer?.id];
  const allPlayersSubmitted = state.players
    .filter(p => p.id !== state.currentFDP)
    .every(p => state.submittedAnswers[p.id]);

  // Auto-avançar para votação quando todos submeterem
  useEffect(() => {
    // Somente o host controla a transição de fase; clientes aguardam snapshot
    // O host já trata a virada para ROUND_VOTING em GameContext ao detectar todas as respostas
  }, [allPlayersSubmitted, state.gameState, isCurrentPlayerFDP]);

  // Exibe contagem regressiva durante tela de resultados (transição para próxima rodada)
  useEffect(() => {
    if (state.gameState === GAME_STATES.ROUND_RESULTS) {
      const total = state.gameConfig?.resultsDelaySec ?? 3;
      setRoundTransitionSeconds(total);
      const id = setInterval(() => {
        setRoundTransitionSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(id);
    } else {
      setRoundTransitionSeconds(0);
    }
    // Only depends on gameState; total is read fresh inside
  }, [state.gameState]);

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

  // (lint) removed unused getPlayerByCard

  const handleLeaveGame = () => {
    if (window.confirm('Tem certeza que deseja sair do jogo?')) {
      actions.resetGame();
    }
  };

  // Mascot reactions based on game state
  const mascotEmoteClass = state.gameState === GAME_STATES.ROUND_RESULTS
    ? ' emote-celebrate'
    : state.error
    ? ' emote-shake'
    : '';

  return (
    <div className="game-board">
      {/* Header */}
      <div className="game-header">
        <div className="game-info">
          <Mascot variant="inline" size={42} className={`mascot-inline${mascotEmoteClass}`} />
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
                        <div className="submitted-full-sentence">
                          {formatQuestionCard(state.currentQuestionCard, hasSubmittedAnswer)}
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
                order={state.answerOrder}
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
                
                <div className="next-round-info" aria-live="polite">
                  <p className="transition-note">Próxima rodada começando em {roundTransitionSeconds || 1}s...</p>
                  <div className="transition-progress">
                    <div
                      className="transition-bar"
                      style={{ width: `${(((state.gameConfig?.resultsDelaySec ?? 3) - Math.max(roundTransitionSeconds, 0)) / (state.gameConfig?.resultsDelaySec ?? 3)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.gameState === GAME_STATES.GAME_OVER && (
            <div className="game-over-section">
              <div className="game-over expanded-game-over">
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.8rem' }}>🏆 Fim de Jogo!</h2>
                <div className="final-winner expanded-final-winner">
                  <div className="winner-podium expanded-winner-podium">
                    <img 
                      src={state.players.find(p => p.id === state.roundWinner)?.avatar} 
                      alt="Final Winner"
                      className="final-winner-avatar expanded-final-winner-avatar"
                    />
                    <h3 style={{ fontSize: '1.4rem', margin: '0.5rem 0', color: '#d4af37' }}>{state.players.find(p => p.id === state.roundWinner)?.name}</h3>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333', margin: '0.3rem 0' }}>É o grande FDP vencedor!</p>
                    <div className="trophy" style={{ fontSize: '1.8rem', margin: '0.5rem 0' }}>🏆</div>
                    <div className="winner-joke" style={{ fontSize: '0.95rem', color: '#764ba2', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      {getFunnyPhrase(state.players.find(p => p.id === state.roundWinner)?.name)}
                    </div>
                  </div>
                </div>
                <div className="expanded-scoreboard-wrapper">
                  <Scoreboard showFinal={true} />
                </div>
                <div className="game-over-actions expanded-game-over-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => actions.resetGame()}
                    style={{ fontSize: '1rem', padding: '0.8rem 1.5rem' }}
                  >
                    🎮 Jogar Novamente
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.location.reload()}
                    style={{ fontSize: '1rem', padding: '0.8rem 1.5rem' }}
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

  // Função para frase engraçada
  function getFunnyPhrase(name) {
    const phrases = [
      `Parabéns, ${name}! Agora você é oficialmente o FDP supremo!`,
      `${name}, ganhou... mas será que jogou limpo? 🤔`,
      `O resto só assiste enquanto ${name} humilha geral!`,
      `FDP detectado: ${name}. Preparem-se para a revanche!`,
      `Se fosse pra perder, eu nem vinha... né, ${name}?`,
      `A lenda do FDP: ${name}. O chat está em choque!`,
      `O(a) FDP ${name} venceu! Mas será que vai pagar a rodada?`,
      `O(a) FDP ${name} venceu! Pode zoar à vontade!`,
      `O(a) FDP ${name} venceu! O chat exige explicações!`,
      `O(a) FDP ${name} venceu! O VAR está revisando...`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Scroll para topo ao terminar o jogo
  useEffect(() => {
    if (state.gameState === GAME_STATES.GAME_OVER) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.gameState]);

  // Função para frase engraçada
  function getFunnyPhrase(name) {
    const phrases = [
      `Parabéns, ${name}! Agora você é oficialmente o FDP supremo!`,
      `${name}, ganhou... mas será que jogou limpo? 🤔`,
      `O resto só assiste enquanto ${name} humilha geral!`,
      `FDP detectado: ${name}. Preparem-se para a revanche!`,
      `Se fosse pra perder, eu nem vinha... né, ${name}?`,
      `A lenda do FDP: ${name}. O chat está em choque!`,
      `O(a) FDP ${name} venceu! Mas será que vai pagar a rodada?`,
      `O(a) FDP ${name} venceu! Pode zoar à vontade!`,
      `O(a) FDP ${name} venceu! O chat exige explicações!`,
      `O(a) FDP ${name} venceu! O VAR está revisando...`
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

export default GameBoard;