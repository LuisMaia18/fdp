import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import PublicRooms from './PublicRooms';
import './Lobby.css';
import Mascot from './Mascot';

function Lobby() {
  const { state, actions, GAME_STATES } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'public'
  const [showPublicRooms, setShowPublicRooms] = useState(false);

  const clearError = useCallback(() => {
    actions.setError(null);
  }, [actions]);

  useEffect(() => {
    // Limpa erros após 5 segundos
    if (state.error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, clearError]);

  // Se estiver mostrando salas públicas, renderiza o componente específico
  if (showPublicRooms) {
    return (
      <PublicRooms
        onJoinRoom={(roomId, roomName) => handleJoinPublicRoom(roomId, roomName)}
        onBack={() => setShowPublicRooms(false)}
      />
    );
  }

  // Gera código da sala (simulado - em um app real seria gerado pelo servidor)
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = (isPublic = false) => {
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
    
    // Configurar estado de host e sala
    actions.setIsHost(true);
    actions.setCurrentPlayer(player);
    actions.setRoomCode(roomCode);
    
    // Adicionar o player host
    actions.addPlayer(player);
    
    // Mudar para sala de espera
    actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
    
    // TODO: Implementar lógica para sala pública vs privada
    if (isPublic) {
      console.log('Criando sala pública:', roomCode);
    }
  };

  const handleJoinPublicRoom = (roomId, roomName) => {
    if (!playerName.trim()) {
      actions.setError('Digite seu nome primeiro!');
      setShowPublicRooms(false);
      return;
    }

    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: false,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`
    };

    actions.setIsHost(false);
    actions.setCurrentPlayer(player);
    actions.addPlayer(player);
    actions.setRoomCode(roomId);
    actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
    
    console.log(`Entrando na sala pública: ${roomName} (${roomId})`);
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

  actions.setIsHost(false);
  actions.setCurrentPlayer(player);
  actions.addPlayer(player);
  actions.setRoomCode(joinRoomCode.toUpperCase());
  actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <Mascot variant="hero" size={120} speech="Bora jogar?" className="mascot-hero" />
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
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
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

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            🎮 Criar Sala
          </button>
          <button 
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            🚪 Entrar por Código
          </button>
          <button 
            className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            🌍 Salas Públicas
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'create' && (
            <div className="create-room-tab">
              <h3>🎮 Criar Nova Sala</h3>
              <p>Crie uma sala e convide seus amigos!</p>
              
              <div className="room-options">
                <button 
                  className="btn btn-primary btn-large"
                  onClick={() => handleCreateRoom(false)}
                  disabled={!playerName.trim()}
                >
                  🔒 Criar Sala Privada
                </button>
                
                <button 
                  className="btn btn-secondary btn-large"
                  onClick={() => handleCreateRoom(true)}
                  disabled={!playerName.trim()}
                >
                  🌍 Criar Sala Pública
                </button>
              </div>
              
              <div className="room-info info-section">
                <p>
                  <strong>Sala Privada:</strong> Apenas quem tem o código pode entrar<br/>
                  <strong>Sala Pública:</strong> Aparece na lista para todos jogarem
                </p>
              </div>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="join-room-tab">
              <h3>🚪 Entrar em Sala Privada</h3>
              <p className="text-info">Digite o código da sala que você recebeu:</p>
              
              <div className="join-form">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Código da sala (ex: ABC123)"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    maxLength={6}
                    className="room-code-input"
                  />
                </div>
                
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleJoinRoom}
                  disabled={!joinRoomCode.trim() || !playerName.trim()}
                >
                  🚀 Entrar na Sala
                </button>
              </div>
            </div>
          )}

          {activeTab === 'public' && (
            <div className="public-rooms-tab">
              <h3>🌍 Salas Públicas</h3>
              <p className="text-info">Encontre uma sala pública para jogar com outras pessoas!</p>
              
              <button 
                className="btn btn-primary btn-large"
                onClick={() => setShowPublicRooms(true)}
                disabled={!playerName.trim()}
              >
                🔍 Ver Salas Disponíveis
              </button>
              
              {!playerName.trim() && (
                <p className="warning-text">
                  ⚠️ Digite seu nome primeiro para ver as salas
                </p>
              )}
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