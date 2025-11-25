import React, { useState, useCallback, useEffect } from 'react';
import { useGame, GAME_STATES } from '../contexts/GameContext';
import Mascot from './Mascot';
import PublicRooms from './PublicRooms';
import './Lobby.css';

function Lobby() {
  const { state, actions, GAME_STATES } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showPublicRooms, setShowPublicRooms] = useState(false);

  const clearError = useCallback(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        actions.setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error, actions]);

  useEffect(() => {
    if (showPublicRooms) {
      return (
        <PublicRooms 
          onJoinRoom={handleJoinPublicRoom}
          onBack={() => setShowPublicRooms(false)}
        />
      );
    }
  }, [state.error, clearError]);

  // Se estiver mostrando salas públicas, renderiza o componente específico
  if (showPublicRooms) {
    return (
      <PublicRooms 
        onJoinRoom={handleJoinPublicRoom}
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
      actions.setError('Digite seu nome antes de criar a sala!');
      return;
    }

    const roomCode = generateRoomCode();
    
    // Criar jogador host
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
    
    const player = {
      id: `player_${Date.now()}`,
      name: playerName.trim(),
      isHost: false,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`
    };
    
    actions.setIsHost(false);
    actions.setCurrentPlayer(player);
    actions.setRoomCode(joinRoomCode.trim());
    actions.addPlayer(player);
    actions.setGameState(GAME_STATES.WAITING_FOR_PLAYERS);
    actions.setError(null);
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        {/* Header Compacto */}
        <div className="lobby-header-compact">
          <div className="brand-section">
            <Mascot variant="hero" size={80} className="mascot-hero" />
            <div className="brand-text">
              <h1 className="game-title-compact">
                <span className="title-main">Foi De Propósito</span>
                <span className="title-subtitle">O jogo mais FDP que existe!</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Layout em Duas Colunas */}
        <div className="lobby-two-columns">
          
          {/* Coluna Esquerda - Ações do Jogo */}
          <div className="left-column">
            <div className="actions-section">
              <h2>🎮 Começar a Jogar</h2>
              
              {/* Formulário de Nome */}
              <div className="name-form-compact">
                <label>Seu nome no jogo:</label>
                <div className="input-group-compact">
                  <input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                    maxLength={20}
                    className="name-input-compact"
                  />
                  {playerName && (
                    <div className="avatar-preview-compact">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random`}
                        alt="Avatar"
                        className="avatar-compact"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Opções de Jogo */}
              <div className="game-options">
                
                {/* Criar Sala */}
                <div className="option-card">
                  <div className="option-header">
                    <span className="option-icon">🎮</span>
                    <h3>Criar Nova Sala</h3>
                  </div>
                  <p>Crie uma sala e convide seus amigos!</p>
                  <div className="option-buttons">
                    <button 
                      className="btn btn-create-private btn-full"
                      onClick={() => handleCreateRoom(false)}
                      disabled={!playerName.trim()}
                    >
                      🔒 Sala Privada
                    </button>
                    <button 
                      className="btn btn-create-public btn-full"
                      onClick={() => handleCreateRoom(true)}
                      disabled={!playerName.trim()}
                    >
                      🌍 Sala Pública
                    </button>
                  </div>
                </div>

                {/* Entrar por Código */}
                <div className="option-card">
                  <div className="option-header">
                    <span className="option-icon">🚪</span>
                    <h3>Entrar por Código</h3>
                  </div>
                  <p>Tem um código de sala? Cole aqui!</p>
                  <div className="join-form">
                    <input
                      type="text"
                      placeholder="Código da sala (ex: ABC123)"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                      maxLength={10}
                      className="code-input"
                    />
                    <button 
                      className="btn btn-join-code btn-full"
                      onClick={handleJoinRoom}
                      disabled={!playerName.trim() || !joinRoomCode.trim()}
                    >
                      Entrar na Sala
                    </button>
                  </div>
                </div>

                {/* Salas Públicas */}
                <div className="option-card">
                  <div className="option-header">
                    <span className="option-icon">🌍</span>
                    <h3>Salas Públicas</h3>
                  </div>
                  <p>Descubra salas abertas para todos!</p>
                  <button 
                    className="btn btn-public-rooms btn-full"
                    onClick={() => setShowPublicRooms(true)}
                    disabled={!playerName.trim()}
                  >
                    Explorar Salas Públicas
                  </button>
                </div>

              </div>

              {/* Mostrar erro se houver */}
              {state.error && (
                <div className="error-message">
                  ❌ {state.error}
                </div>
              )}

            </div>
          </div>

          {/* Coluna Direita - Informações do Jogo */}
          <div className="right-column">
            <div className="info-section">
              
              {/* Sobre o Jogo */}
              <div className="about-game">
                <h2>🎭 Sobre o Jogo</h2>
                <p className="game-description-compact">
                  Prepare-se para muitas risadas, absurdos e momentos inesquecíveis! 
                  Complete as frases da maneira mais escrota possível e conquiste pontos 
                  fazendo todo mundo rir!
                </p>
              </div>

              {/* Como Jogar */}
              <div className="rules-compact">
                <h3>🎯 Como Jogar</h3>
                <div className="rules-list">
                  <div className="rule-item-compact">
                    <span className="rule-number">1</span>
                    <div className="rule-text">
                      <strong>Distribuição:</strong> Cada jogador recebe 10 cartas de resposta
                    </div>
                  </div>
                  <div className="rule-item-compact">
                    <span className="rule-number">2</span>
                    <div className="rule-text">
                      <strong>Pergunta:</strong> O FDP da vez lê uma carta de pergunta
                    </div>
                  </div>
                  <div className="rule-item-compact">
                    <span className="rule-number">3</span>
                    <div className="rule-text">
                      <strong>Resposta:</strong> Todos escolhem a carta mais engraçada
                    </div>
                  </div>
                  <div className="rule-item-compact">
                    <span className="rule-number">4</span>
                    <div className="rule-text">
                      <strong>Votação:</strong> O FDP escolhe a melhor resposta (1 ponto)
                    </div>
                  </div>
                  <div className="rule-item-compact">
                    <span className="rule-number">5</span>
                    <div className="rule-text">
                      <strong>Vitória:</strong> Primeiro a fazer 5 pontos ganha!
                    </div>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="tips-section">
                <h3>💡 Dicas</h3>
                <ul className="tips-list">
                  <li>🎭 Seja criativo e pense fora da caixa</li>
                  <li>😂 Quanto mais absurdo, melhor!</li>
                  <li>🎯 Conheça o humor do seu grupo</li>
                  <li>⚡ Seja rápido nas escolhas</li>
                  <li>🏆 Divirta-se, ganhar é secundário!</li>
                </ul>
              </div>

              {/* Aviso */}
              <div className="warning-section">
                <div className="warning-card">
                  <span className="warning-icon">⚠️</span>
                  <div className="warning-text">
                    <strong>Conteúdo Adulto</strong>
                    <p>Este jogo contém humor ácido e politicamente incorreto. Recomendado apenas para maiores de 18 anos.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Compacto */}
        <div className="lobby-footer-compact">
          <p>Versão Web • Baseado no jogo original Foi De Propósito</p>
        </div>

      </div>
    </div>
  );
}

export default Lobby;