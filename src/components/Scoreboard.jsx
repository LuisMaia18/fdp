import React from 'react';
import { useGame } from '../contexts/GameContext';
import './Scoreboard.css';

function Scoreboard({ showFinal = false }) {
  const { state } = useGame();
  
  // Ordena jogadores por pontuação (maior para menor)
  const sortedPlayers = [...state.players].sort((a, b) => {
    return (state.scores[b.id] || 0) - (state.scores[a.id] || 0);
  });

  const getPositionEmoji = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}º`;
    }
  };

  const getPositionClass = (index) => {
    switch (index) {
      case 0: return 'first-place';
      case 1: return 'second-place';
      case 2: return 'third-place';
      default: return '';
    }
  };

  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <h2>
          {showFinal ? '🏆 Placar Final' : '📊 Placar Atual'}
        </h2>
        <p className="winning-score">
          {showFinal ? 
            'Parabéns ao vencedor!' : 
            `Primeiro a fazer ${state.gameConfig.winningScore} pontos vence!`
          }
        </p>
      </div>
      
      <div className="players-ranking">
        {sortedPlayers.map((player, index) => {
          const score = state.scores[player.id] || 0;
          const isWinner = showFinal && index === 0;
          const isCurrentFDP = player.id === state.currentFDP;
          const isCurrentPlayer = player.id === state.currentPlayer?.id;
          
          return (
            <div 
              key={player.id}
              className={`player-rank ${getPositionClass(index)} ${isWinner ? 'winner' : ''} ${isCurrentFDP ? 'current-fdp' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
            >
              <div className="rank-position">
                {getPositionEmoji(index)}
              </div>
              
              <div className="player-info">
                <div className="player-avatar">
                  <img src={player.avatar} alt={player.name} />
                  {isCurrentFDP && <span className="fdp-crown">👑</span>}
                  {player.isBot && <span className="bot-badge">🤖</span>}
                </div>
                
                <div className="player-details">
                  <div className="player-name">
                    {player.name}
                    {isCurrentPlayer && <span className="you-badge">Você</span>}
                  </div>
                  <div className="player-status">
                    {isCurrentFDP ? 'FDP da vez' : player.isBot ? 'Bot' : 'Jogador'}
                  </div>
                </div>
              </div>
              
              <div className="player-score">
                <div className="score-number">{score}</div>
                <div className="score-label">
                  {score === 1 ? 'ponto' : 'pontos'}
                </div>
              </div>
              
              <div className="score-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${(score / state.gameConfig.winningScore) * 100}%` 
                    }}
                  />
                </div>
                <div className="progress-text">
                  {score}/{state.gameConfig.winningScore}
                </div>
              </div>
              
              {isWinner && (
                <div className="winner-effects">
                  <span className="trophy">🏆</span>
                  <span className="confetti">🎉</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!showFinal && state.gameHistory.length > 0 && (
        <div className="recent-rounds">
          <h3>🕐 Últimas Rodadas</h3>
          <div className="rounds-list">
            {state.gameHistory.slice(-3).reverse().map((round, index) => {
              const winner = state.players.find(p => p.id === round.winner);
              return (
                <div key={index} className="round-item">
                  <div className="round-winner">
                    <img src={winner?.avatar} alt={winner?.name} />
                    <span>{winner?.name}</span>
                  </div>
                  <div className="round-answer">
                    "{round.answers[round.winner]}"
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {showFinal && (
        <div className="game-stats">
          <h3>📈 Estatísticas do Jogo</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{state.gameHistory.length}</span>
              <span className="stat-label">Rodadas Jogadas</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{state.players.length}</span>
              <span className="stat-label">Jogadores</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.max(...Object.values(state.scores))}
              </span>
              <span className="stat-label">Maior Pontuação</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {state.usedQuestionCards.length}
              </span>
              <span className="stat-label">Perguntas Usadas</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scoreboard;