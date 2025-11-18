
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

  // Debug logging
  useEffect(() => {
    console.log('GameBoard Debug:', {
      currentPlayer: state.currentPlayer?.name,
      currentFDP: state.players.find(p => p.id === state.currentFDP)?.name,
      currentFDPId: state.currentFDP,
      isCurrentPlayerFDP,
      gameState: state.gameState,
      selectedAnswerCard,
      hasSubmittedAnswer,
      shouldShowButton: state.gameState === GAME_STATES.PLAYING && !isCurrentPlayerFDP,
      allPlayers: state.players.map(p => ({ id: p.id, name: p.name }))
    });
    
    // Verificação de integridade
    if (state.gameState === GAME_STATES.PLAYING && !state.currentFDP) {
      console.error('ERRO CRÍTICO: Jogo em andamento mas nenhum FDP definido!');
    }
  }, [state.currentPlayer, state.currentFDP, state.gameState, GAME_STATES.PLAYING, isCurrentPlayerFDP, state.players, selectedAnswerCard, hasSubmittedAnswer]);

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
    // Inclui dependências para evitar warning do lint
  }, [state.gameState, GAME_STATES.ROUND_RESULTS, state.gameConfig?.resultsDelaySec]);

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
          <Mascot variant="inline" className={"mascot-inline" + mascotEmoteClass} />
          <span className="game-title">Foi De Propósito</span>
          {/* Timer integrado na navbar */}
          <div style={{ marginLeft: '20px' }}>
            <Timer />
          </div>
        </div>
        <div className="header-actions">
          <button className="scoreboard-btn btn btn-secondary" onClick={() => setShowScoreboard(true)}>
            <span role="img" aria-label="Placar">📊</span> Placar
          </button>
          <button className="leave-btn btn btn-ghost" onClick={handleLeaveGame}>
            <span role="img" aria-label="Sair">🚪</span> Sair
          </button>
        </div>
      </div>

      {/* Question Section - Only show when game is not over */}
      {state.gameState !== GAME_STATES.GAME_OVER && (
        <div className="question-section">
          <div className="question-card">
            <div className="card-header">
              <span className="card-type">Carta de Pergunta</span>
              {/* FDP Indicator */}
              <div className="fdp-indicator">
                {(() => {
                  const fdpPlayer = state.players.find(p => p.id === state.currentFDP);
                  if (!fdpPlayer) {
                    return <span style={{color: 'red'}}>⚠️ ERRO: Nenhum FDP definido!</span>;
                  }
                  return (
                    <>
                      👑 FDP: {fdpPlayer.name}
                      {isCurrentPlayerFDP && <span className="you-badge"> (VOCÊ!)</span>}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="question-text">
              {formatQuestionCard(state.currentQuestionCard)}
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="game-main">
        {state.gameState === GAME_STATES.PLAYING && !isCurrentPlayerFDP && (
          <PlayerHand
            selectedCard={selectedAnswerCard}
            onCardSelect={setSelectedAnswerCard}
          />
        )}
        {state.gameState === GAME_STATES.PLAYING && isCurrentPlayerFDP && (
          <div className="fdp-waiting-section">
            <div className="fdp-instructions">
              <h2>👑 Você é o FDP desta rodada!</h2>
              <p>Aguarde os outros jogadores enviarem suas respostas...</p>
              <div className="fdp-status">
                <div className="responses-counter">
                  <span>{Object.keys(state.submittedAnswers).length}</span>
                  <span>/{state.players.filter(p => p.id !== state.currentFDP).length}</span>
                  <span> respostas recebidas</span>
                </div>
                {Object.keys(state.submittedAnswers).length < state.players.filter(p => p.id !== state.currentFDP).length && (
                  <div className="waiting-animation">
                    <span className="waiting-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <p>Aguardando respostas...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {state.gameState === GAME_STATES.PLAYING && !isCurrentPlayerFDP && (
          <button
            className={`btn btn-primary submit-answer-btn ${selectedAnswerCard ? 'has-selection' : ''} ${hasSubmittedAnswer ? 'submitted' : ''}`}
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswerCard || hasSubmittedAnswer}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: '9997',
              backgroundColor: selectedAnswerCard ? '#28a745' : '#6c757d',
              border: 'none',
              padding: '15px 30px',
              fontSize: '1.2rem',
              fontWeight: '700',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
              color: 'white'
            }}
          >
            {hasSubmittedAnswer ? (
              <>
                <span>✓</span> Resposta enviada!
              </>
            ) : selectedAnswerCard ? (
              <>
                <span>📤</span> Enviar resposta
              </>
            ) : (
              'Selecione uma carta'
            )}
          </button>
        )}
        {state.gameState === GAME_STATES.ROUND_VOTING && (
          <SubmittedAnswers
            question={state.currentQuestionCard}
            answers={state.submittedAnswers}
            onSelectWinner={handleSelectWinner}
            canVote={isCurrentPlayerFDP}
            currentPlayer={state.currentPlayer}
            order={state.answerOrder}
          />
        )}
        {state.gameState === GAME_STATES.ROUND_RESULTS && (
          <div className="round-results-section">
            {/* Celebration Header */}
            <div className="celebration-header">
              <div className="confetti-animation"></div>
              <div className="trophy-bounce">
                <span className="celebration-trophy">🏆</span>
              </div>
              <h1 className="celebration-title">Rodada Finalizada!</h1>
              <div className="celebration-subtitle">E o vencedor é...</div>
            </div>

            {/* Winner Spotlight */}
            <div className="winner-spotlight">
              <div className="winner-avatar-container">
                <div className="winner-avatar">
                  <div className="avatar-initials">
                    {state.roundWinner && state.players.find(p => p.id === state.roundWinner)?.name?.slice(0,2).toUpperCase() || '??'}
                  </div>
                  <div className="winner-crown">👑</div>
                </div>
                <div className="winner-glow"></div>
              </div>
              
              <div className="winner-info">
                <h2 className="winner-name">
                  {state.roundWinner && state.players.find(p => p.id === state.roundWinner)?.name || 'Anônimo'}
                </h2>
                <div className="winner-title">🎭 FDP da Rodada</div>
              </div>
            </div>

            {/* Winning Answer Showcase */}
            <div className="winning-answer-showcase">
              <div className="question-display">
                <h3>🎯 Pergunta da Rodada:</h3>
                <div className="question-card-display">
                  {state.currentQuestionCard}
                </div>
              </div>
              
              <div className="answer-spotlight">
                <h3>✨ Resposta Vencedora:</h3>
                <div className="winning-answer-card">
                  <div className="answer-content">
                    "{state.submittedAnswers[state.roundWinner] || 'Resposta não encontrada'}"
                  </div>
                  <div className="answer-sparkles">
                    <span>✨</span>
                    <span>🎉</span>
                    <span>⭐</span>
                  </div>
                </div>
              </div>

              <div className="complete-sentence-display">
                <h4>📝 Frase Completa:</h4>
                <div className="complete-sentence">
                  {formatQuestionCard(state.currentQuestionCard, state.submittedAnswers[state.roundWinner])}
                </div>
              </div>
            </div>

            {/* Next Round Countdown */}
            <div className="next-round-countdown">
              <div className="countdown-container">
                <div className="countdown-circle">
                  <div className="countdown-number">{roundTransitionSeconds}</div>
                </div>
                <div className="countdown-text">
                  <span className="next-round-label">Próxima rodada em</span>
                  <span className="countdown-subtitle">Prepare-se! 🚀</span>
                </div>
              </div>
            </div>

            {/* Scoreboard Preview */}
            <div className="mini-scoreboard">
              <h3>🏆 Placar Atual</h3>
              <div className="mini-scores">
                {state.players
                  .sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0))
                  .slice(0, 3)
                  .map((player, index) => (
                    <div key={player.id} className={`mini-score-item rank-${index + 1}`}>
                      <span className="rank-emoji">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className="player-name">{player.name}</span>
                      <span className="player-score">{state.scores[player.id] || 0}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        {state.gameState === GAME_STATES.GAME_OVER && (
          <div className="game-over-section expanded-game-over">
            <div className="expanded-final-winner">
              <div className="expanded-winner-podium">
                <span className="trophy" role="img" aria-label="Troféu">🏆</span>
                <div className="expanded-final-winner-avatar">
                  <span className="winner-initials">
                    {state.players.find(p => p.id === state.roundWinner)?.name?.slice(0,2).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="winner-joke">
                <strong>{state.players.find(p => p.id === state.roundWinner)?.name}</strong>
                <br />
                É o grande FDP vencedor!
              </div>
            </div>
            
            <div className="expanded-content-grid">
              <div className="expanded-left-column">
                <div className="expanded-scoreboard-wrapper">
                  <Scoreboard showFinal={true} />
                </div>
              </div>
              
              <div className="expanded-right-column">
                <div className="expanded-stats-wrapper">
                  <Scoreboard showFinal={true} showStatsOnly={true} />
                </div>
              </div>
            </div>
            
            <div className="expanded-game-over-actions">
              <button className="btn btn-primary" onClick={handleLeaveGame}>
                Voltar ao Lobby
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal-btn" onClick={() => setShowScoreboard(false)}>&times;</button>
            <Scoreboard />
          </div>
        </div>
      )}
    </div>
  );
}

export default GameBoard;