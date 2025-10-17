import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import './PublicRooms.css';

function PublicRooms({ onJoinRoom, onBack }) {
  const { actions } = useGame();
  const [publicRooms, setPublicRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Simula busca de salas públicas (em um app real seria uma API)
  const fetchPublicRooms = async () => {
    setRefreshing(true);
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dados mock de salas públicas
    const mockRooms = [
      {
        id: 'pub_001',
        name: 'Sala dos Amigos',
        host: 'João123',
        players: 4,
        maxPlayers: 8,
        status: 'WAITING_FOR_PLAYERS',
        isPrivate: false,
        created: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        gameConfig: {
          winningScore: 5,
          roundTimer: 120
        }
      },
      {
        id: 'pub_002', 
        name: 'FDP Hardcore',
        host: 'ProPlayer',
        players: 6,
        maxPlayers: 8,
        status: 'PLAYING',
        isPrivate: false,
        created: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago
        gameConfig: {
          winningScore: 7,
          roundTimer: 90
        }
      },
      {
        id: 'pub_003',
        name: 'Diversão Garantida 😂',
        host: 'Engraçado',
        players: 2,
        maxPlayers: 6,
        status: 'WAITING_FOR_PLAYERS',
        isPrivate: false,
        created: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
        gameConfig: {
          winningScore: 5,
          roundTimer: 120
        }
      },
      {
        id: 'pub_004',
        name: 'Só os Brabo',
        host: 'MasterFDP',
        players: 7,
        maxPlayers: 8,
        status: 'WAITING_FOR_PLAYERS',
        isPrivate: false,
        created: new Date(Date.now() - 3 * 60 * 1000), // 3 min ago
        gameConfig: {
          winningScore: 10,
          roundTimer: 60
        }
      },
      {
        id: 'pub_005',
        name: 'Iniciantes Bem-vindos',
        host: 'Helper',
        players: 1,
        maxPlayers: 4,
        status: 'WAITING_FOR_PLAYERS',
        isPrivate: false,
        created: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
        gameConfig: {
          winningScore: 3,
          roundTimer: 180
        }
      }
    ];
    
    setPublicRooms(mockRooms);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const filteredRooms = publicRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJoinRoom = async (room) => {
    if (room.players >= room.maxPlayers) {
      actions.setError('Sala lotada!');
      return;
    }
    
    if (room.status === 'PLAYING') {
      actions.setError('Jogo já em andamento!');
      return;
    }

    setLoading(true);
    
    // Simula processo de entrada na sala
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Chama a função de entrar na sala
      onJoinRoom(room.id, room.name);
      
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      actions.setError('Erro ao entrar na sala');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING_FOR_PLAYERS': return '⏳';
      case 'PLAYING': return '🎮';
      default: return '❓';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'WAITING_FOR_PLAYERS': return 'Aguardando';
      case 'PLAYING': return 'Jogando';
      default: return 'Desconhecido';
    }
  };

  const getTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Agora';
    if (minutes === 1) return '1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hora';
    return `${hours} horas`;
  };

  return (
    <div className="public-rooms">
      <div className="public-rooms-header">
        <button className="back-btn" onClick={onBack}>
          <span>←</span> Voltar
        </button>
        <h2>🌍 Salas Públicas</h2>
        <button 
          className={`refresh-btn ${refreshing ? 'loading' : ''}`}
          onClick={fetchPublicRooms}
          disabled={refreshing}
        >
          🔄 {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome da sala ou host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="rooms-list">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Entrando na sala...</p>
          </div>
        )}
        
        {filteredRooms.length === 0 && !refreshing && (
          <div className="no-rooms">
            <span className="no-rooms-icon">😔</span>
            <h3>Nenhuma sala encontrada</h3>
            <p>
              {searchTerm 
                ? 'Tente buscar por outros termos ou limpe a busca'
                : 'Não há salas públicas disponíveis no momento'
              }
            </p>
            <button className="btn btn-primary" onClick={fetchPublicRooms}>
              🔄 Tentar novamente
            </button>
          </div>
        )}

        {filteredRooms.map(room => (
          <div key={room.id} className="room-card">
            <div className="room-info">
              <div className="room-header">
                <h3 className="room-name">{room.name}</h3>
                <div className="room-status">
                  <span className="status-icon">{getStatusIcon(room.status)}</span>
                  <span className="status-text">{getStatusText(room.status)}</span>
                </div>
              </div>
              
              <div className="room-details">
                <div className="room-host">
                  <span className="detail-icon">👑</span>
                  <span>Host: <strong>{room.host}</strong></span>
                </div>
                
                <div className="room-players">
                  <span className="detail-icon">👥</span>
                  <span>
                    <strong>{room.players}/{room.maxPlayers}</strong> jogadores
                  </span>
                </div>
                
                <div className="room-config">
                  <span className="detail-icon">🎯</span>
                  <span>{room.gameConfig.winningScore} pontos para vencer</span>
                </div>
                
                <div className="room-timer">
                  <span className="detail-icon">⏱️</span>
                  <span>{room.gameConfig.roundTimer}s por rodada</span>
                </div>
              </div>
              
              <div className="room-meta">
                <span className="room-age">Criada há {getTimeAgo(room.created)}</span>
              </div>
            </div>
            
            <div className="room-actions">
              <button
                className={`join-btn ${
                  room.players >= room.maxPlayers ? 'full' : 
                  room.status === 'PLAYING' ? 'playing' : 'available'
                }`}
                onClick={() => handleJoinRoom(room)}
                disabled={
                  room.players >= room.maxPlayers || 
                  room.status === 'PLAYING' ||
                  loading
                }
              >
                {room.players >= room.maxPlayers ? (
                  <>🚫 Lotada</>
                ) : room.status === 'PLAYING' ? (
                  <>🎮 Jogando</>
                ) : (
                  <>🚀 Entrar</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PublicRooms;