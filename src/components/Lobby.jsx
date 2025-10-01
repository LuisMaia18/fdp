import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import './Lobby.css';

function Lobby() {
  const { state, actions, GAME_STATES } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Gera código da sala (simulado - em um app real seria gerado pelo servidor)
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      actions.setError('Digite seu nome para criar uma sala!');
      return;
    }

    const roomCode = generateRoomCode();
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`
    };

    actions.setRoomCode(roomCode);
    actions.setIsHost(true);
    actions.setCurrentPlayer(player);
    actions.addPlayer(player);
    actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      actions.setError('Digite seu nome para entrar na sala!');
      return;
    }

    if (!joinRoomCode.trim()) {
      actions.setError('Digite o código da sala!');
      return;
    }

    // Simulação de entrada na sala (em um app real verificaria se a sala existe)
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: false,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`
    };

    actions.setRoomCode(joinRoomCode.toUpperCase());
    actions.setIsHost(false);
    actions.setCurrentPlayer(player);
    actions.addPlayer(player);
    actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
  };

  const clearError = () => {
    actions.setError(null);
  };

  useEffect(() => {
    // Limpa erros após 5 segundos
    if (state.error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return (
    <div className="lobby">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <h1 className="game-title">
            <span className="title-main">Foi De Propósito</span>
            <span className="title-subtitle">O jogo mais FDP que existe!</span>
          </h1>
          <p className="game-description">
            Prepare-se para muitas risadas, absurdos e momentos inesquecíveis! 
            Complete as frases da maneira mais escrota possível e conquiste pontos 
            fazendo todo mundo rir!
          </p>
        </div>

        {/* Formulário de Nome */}
        <div className="name-form">
          <h2>Como você quer ser chamado?</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Digite seu nome..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !showJoinForm && handleCreateRoom()}
              maxLength={20}
              className="name-input"
            />
            {playerName && (
              <div className="avatar-preview">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`}
                  alt="Avatar preview"
                  className="avatar"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="action-buttons">
          {!showJoinForm ? (
            <>
              <button 
                className="btn btn-primary btn-large"
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
              >
                🎮 Criar Nova Sala
              </button>
              
              <button 
                className="btn btn-secondary btn-large"
                onClick={() => setShowJoinForm(true)}
                disabled={!playerName.trim()}
              >
                🚪 Entrar em Sala
              </button>
            </>
          ) : (
            <div className="join-form">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Código da sala..."
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                  maxLength={6}
                  className="room-code-input"
                />
              </div>
              
              <div className="join-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={handleJoinRoom}
                  disabled={!joinRoomCode.trim()}
                >
                  Entrar
                </button>
                
                <button 
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinRoomCode('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {state.error}
            <button className="error-close" onClick={clearError}>×</button>
          </div>
        )}

        {/* Regras Resumidas */}
        <div className="rules-summary">
          <h3>Como Jogar (Resumo)</h3>
          <div className="rules-grid">
            <div className="rule-item">
              <span className="rule-number">1</span>
              <p>Cada jogador recebe 10 cartas de resposta</p>
            </div>
            <div className="rule-item">
              <span className="rule-number">2</span>
              <p>O FDP da vez lê uma pergunta</p>
            </div>
            <div className="rule-item">
              <span className="rule-number">3</span>
              <p>Todos escolhem a resposta mais engraçada</p>
            </div>
            <div className="rule-item">
              <span className="rule-number">4</span>
              <p>O FDP escolhe a melhor e dá 1 ponto</p>
            </div>
            <div className="rule-item">
              <span className="rule-number">5</span>
              <p>Primeiro a fazer 5 pontos ganha!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lobby-footer">
          <p className="warning">
            ⚠️ Conteúdo adulto e politicamente incorreto! 
            Apenas para maiores de 18 anos.
          </p>
          <p className="version">
            Versão Web • Baseado no jogo original Foi De Propósito
          </p>
        </div>
      </div>
    </div>
  );
}

export default Lobby;