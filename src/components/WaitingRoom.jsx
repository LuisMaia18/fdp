import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import './WaitingRoom.css';
import Mascot from './Mascot';

function WaitingRoom() {
  const { state, actions, GAME_STATES } = useGame();
  const [gameConfig, setGameConfig] = useState(state.gameConfig);
  const [showConfig, setShowConfig] = useState(false);
  // Preferência local do host para ocultar o código para si também
  const [hideForMe, setHideForMe] = useState(false);
  
  // ⚠️ CORREÇÃO AUTOMÁTICA: Se não há jogadores mas há um currentPlayer host, adicione-o
  useEffect(() => {
    if (state.players.length === 0 && state.currentPlayer && state.isHost) {
      actions.addPlayer(state.currentPlayer);
    }
  }, [state.players.length, state.currentPlayer, state.isHost, actions]);
  
  // Quando o host ativa/desativa o Stream Mode, por padrão ocultamos/mostramos para ele também
  useEffect(() => {
    if (state.isHost) {
      setHideForMe(!!state.streamMode);
    }
  }, [state.streamMode, state.isHost]);

  const handleStartGame = () => {
    if (state.players.length < state.gameConfig.minPlayers) {
      actions.setError(`Mínimo de ${state.gameConfig.minPlayers} jogadores necessários!`);
      return;
    }
    
    actions.startGame();
  };

  const handleLeaveRoom = () => {
    actions.resetGame();
  };

  const handleConfigChange = (key, value) => {
    const newConfig = { ...gameConfig, [key]: value };
    setGameConfig(newConfig);
  };

  const handleSaveConfig = () => {
    actions.setGameConfig(gameConfig);
    setShowConfig(false);
    actions.setError(null);
  };

  const copyRoomCode = () => {
    if (!state.isHost) return; // somente host pode copiar
    navigator.clipboard.writeText(state.roomCode).then(() => {
      // Simulação de feedback visual
      const button = document.querySelector('.copy-button');
      button.textContent = '✓ Copiado!';
      setTimeout(() => {
        button.textContent = '📋 Copiar';
      }, 2000);
    });
  };

  // Simulação de adicionar bot para teste (removeria em produção)
  const addTestBot = () => {
    if (!state.isHost) {
      actions.setError('Somente o host pode adicionar bots.');
      return;
    }
    const botNames = ['Bot Malandro', 'Bot Escroto', 'Bot Safado', 'Bot Debochado', 'Bot Inconveniente'];
    const availableNames = botNames.filter(name => 
      !state.players.some(p => p.name === name)
    );
    
    if (availableNames.length > 0 && state.players.length < state.gameConfig.maxPlayers) {
      const botName = availableNames[0];
      const bot = {
        id: `bot_${Date.now()}`,
        name: botName,
        isHost: false,
        isBot: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(botName)}&background=random&color=fff`
      };
      actions.addPlayer(bot);
    }
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room-container">
        {/* Header */}
        <div className="room-header">
          <div className="room-title-wrap">
            <Mascot variant="inline" size={42} className="mascot-inline" />
            <h1 className="room-title">Sala de Espera</h1>
          </div>
          <div className="room-info">
            <div className="room-code-display">
              <span className="room-code-label">Código da Sala:</span>
              <span 
                className={`room-code ${state.streamMode && (!state.isHost || hideForMe) ? 'blurred' : ''}`}
                title={state.streamMode 
                  ? (state.isHost 
                    ? (hideForMe 
                      ? 'Stream Mode ativo: código oculto para você e para os outros jogadores' 
                      : 'Stream Mode ativo: código visível para você e oculto para os outros') 
                    : 'Stream Mode: código oculto pelo host') 
                  : 'Código da sala'}
              >
                {state.roomCode}
              </span>
              {state.isHost ? (
                <button className="copy-button" onClick={copyRoomCode} disabled={!state.roomCode}>
                  📋 Copiar
                </button>
              ) : (
                <button className="copy-button" disabled title="Somente o host pode copiar">📋 Copiar</button>
              )}
              {state.isHost && (
                <button 
                  className="toggle-stream-btn"
                  onClick={() => actions.setStreamMode(!state.streamMode)}
                  title={state.streamMode ? 'Desativar Stream Mode (mostrar código)' : 'Ativar Stream Mode (ocultar código)'}
                  aria-pressed={state.streamMode}
                >
                  {state.streamMode ? '🙈' : '👁️'}
                </button>
              )}
              {state.isHost && state.streamMode && (
                <button 
                  className="toggle-stream-btn"
                  onClick={() => setHideForMe(!hideForMe)}
                  title={hideForMe ? 'Mostrar código para mim' : 'Ocultar código para mim também'}
                  aria-pressed={hideForMe}
                >
                  {hideForMe ? '👁️‍🗨️' : '🙊'}
                </button>
              )}
            </div>
            <div className="player-count">
              {state.players.length}/{state.gameConfig.maxPlayers} jogadores
            </div>
          </div>
          
          {/* Stream Mode Badge - Apenas UMA instância */}
          {state.streamMode && (
            <div
              className="stream-mode-badge"
              title={state.isHost
                ? 'Stream Mode ativo: o código está visível para você e oculto para os demais jogadores.'
                : 'Stream Mode ativo: o host ocultou o código da sala.'}
              aria-label="Stream Mode ativo"
            >
              <span className="badge-icon" aria-hidden>🙈</span>
              {state.isHost ? 'Stream Mode ativo' : 'Código oculto pelo host'}
            </div>
          )}
        </div>

        {/* Players Grid */}
        <div className="players-section">
          <h2>Jogadores na Sala</h2>
          <div className="players-grid">
            {state.players.map((player) => (
              <div 
                key={player.id} 
                className={`player-card ${player.isHost ? 'host' : ''} ${player.id === state.currentPlayer?.id ? 'current' : ''}`}
              >
                <div className="player-avatar">
                  <img src={player.avatar} alt={player.name} />
                  {player.isHost && <span className="host-crown">👑</span>}
                  {player.isBot && <span className="bot-badge">🤖</span>}
                </div>
                <div className="player-info">
                  <div className="player-name">{player.name}</div>
                  <div className="player-status">
                    {player.isHost ? 'Host' : player.isBot ? 'Bot' : 'Jogador'}
                  </div>
                </div>
                {state.isHost && !player.isHost && (
                  <button 
                    className="remove-player-btn"
                    onClick={() => actions.removePlayer(player.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: state.gameConfig.maxPlayers - state.players.length }, (_, i) => (
              <div key={`empty-${i}`} className="player-card empty">
                <div className="empty-slot">
                  <span className="empty-icon">👤</span>
                  <span className="empty-text">Aguardando...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Actions + Config + Rules */}
        <div className="sidebar">
          {/* Action Buttons */}
          <div className="action-buttons">
            {state.isHost ? (
              <>
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleStartGame}
                  disabled={state.players.length < state.gameConfig.minPlayers}
                >
                  🎮 Iniciar Jogo ({state.players.length}/{state.gameConfig.minPlayers} min)
                </button>
                
                {/* Botão para adicionar bot (apenas para testes) */}
                {import.meta.env.DEV && state.players.length < state.gameConfig.maxPlayers && (
                  <button 
                    className="btn btn-secondary"
                    onClick={addTestBot}
                  >
                    🤖 Adicionar Bot (Teste)
                  </button>
                )}
              </>
            ) : (
              <div className="waiting-message">
                <span className="waiting-icon">⏳</span>
                Aguardando o host iniciar o jogo...
              </div>
            )}
            
            <button 
              className="btn btn-ghost"
              onClick={handleLeaveRoom}
            >
              🚪 Sair da Sala
            </button>

            {/* Game Configuration */}
            {state.isHost && (
              <div className="config-section">
                <button 
                  className="config-toggle-btn"
                  onClick={() => setShowConfig(!showConfig)}
                >
                  ⚙️ Configurações do Jogo
                </button>
                
                {showConfig && (
                  <div className="config-panel">
                    <div className="config-grid">
                      <div className="config-item">
                        <label>Cartas por Jogador:</label>
                        <select 
                          value={gameConfig.cardsPerPlayer}
                          onChange={(e) => handleConfigChange('cardsPerPlayer', parseInt(e.target.value))}
                        >
                          <option value={7}>7 cartas (Difícil)</option>
                          <option value={10}>10 cartas (Normal)</option>
                          <option value={12}>12 cartas (Fácil)</option>
                        </select>
                      </div>
                      
                      <div className="config-item">
                        <label>Pontos para Vencer:</label>
                        <select 
                          value={gameConfig.winningScore}
                          onChange={(e) => handleConfigChange('winningScore', parseInt(e.target.value))}
                        >
                          <option value={3}>3 pontos (Rápido)</option>
                          <option value={5}>5 pontos (Normal)</option>
                          <option value={7}>7 pontos (Longo)</option>
                        </select>
                      </div>
                      
                      <div className="config-item">
                        <label>Tempo por Rodada:</label>
                        <select 
                          value={gameConfig.roundTimer}
                          onChange={(e) => handleConfigChange('roundTimer', parseInt(e.target.value))}
                        >
                          <option value={60}>1 minuto</option>
                          <option value={120}>2 minutos</option>
                          <option value={180}>3 minutos</option>
                          <option value={0}>Sem limite</option>
                        </select>
                      </div>
                      
                      <div className="config-item">
                        <label>Máximo de Jogadores:</label>
                        <select 
                          value={gameConfig.maxPlayers}
                          onChange={(e) => handleConfigChange('maxPlayers', parseInt(e.target.value))}
                        >
                          <option value={4}>4 jogadores</option>
                          <option value={6}>6 jogadores</option>
                          <option value={8}>8 jogadores</option>
                          <option value={10}>10 jogadores</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="config-buttons">
                      <button className="btn btn-primary" onClick={handleSaveConfig}>
                        Salvar Configurações
                      </button>
                      <button className="btn btn-ghost" onClick={() => setShowConfig(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game Rules */}
          <div className="rules-section">
            <h3>Regras Rápidas</h3>
            <div className="rules-list">
              <p>• Cada jogador recebe {gameConfig.cardsPerPlayer} cartas de resposta</p>
              <p>• O FDP da vez lê uma pergunta preta</p>
              <p>• Todos os outros jogadores escolhem uma carta branca</p>
              <p>• O FDP escolhe a resposta mais engraçada/absurda</p>
              <p>• Primeiro a fazer {gameConfig.winningScore} pontos vence!</p>
              <p>• Conteúdo adulto - jogadores devem ter +18 anos</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {state.error}
            <button className="error-close" onClick={() => actions.setError(null)}>×</button>
          </div>
        )}

        {/* Kicked Modal */}
        {state.kickedMessage && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="kicked-title">
            <div className="modal-card">
              <h3 id="kicked-title" className="modal-title">Você foi removido</h3>
              <p className="modal-text">{state.kickedMessage}</p>
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    actions.setKickedMessage(null);
                    // Volta para a tela inicial (Lobby)
                    actions.setGameState(GAME_STATES.LOBBY);
                    // Limpa sala/estado local para evitar re-entrada automática
                    actions.resetGame();
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;