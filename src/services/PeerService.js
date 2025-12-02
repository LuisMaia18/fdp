import Peer from 'peerjs';

class PeerService {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.onMessageCallbacks = [];
    this.roomCode = null;
    this.isHost = false;
  }

  /**
   * Inicializa o peer como host da sala
   */
  initializeAsHost(roomCode) {
    return new Promise((resolve, reject) => {
      try {
        this.roomCode = roomCode;
        this.isHost = true;
        
        // Cria peer com ID baseado no código da sala
        this.peer = new Peer(`fdp-host-${roomCode}`, {
          debug: 2,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('🎮 Host peer aberto com ID:', id);
          resolve(id);
        });

        this.peer.on('error', (err) => {
          console.error('❌ Erro no peer host:', err);
          reject(err);
        });

        // Recebe conexões de jogadores
        this.peer.on('connection', (conn) => {
          console.log('👥 Novo jogador conectando:', conn.peer);
          this.setupConnection(conn);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Conecta como jogador a uma sala existente
   */
  connectToRoom(roomCode) {
    return new Promise((resolve, reject) => {
      try {
        this.roomCode = roomCode;
        this.isHost = false;
        
        // Cria peer com ID único
        this.peer = new Peer(`fdp-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, {
          debug: 2,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          console.log('🎮 Player peer aberto com ID:', id);
          
          // Conecta ao host
          const hostId = `fdp-host-${roomCode}`;
          console.log('🔌 Conectando ao host:', hostId);
          
          const conn = this.peer.connect(hostId, {
            reliable: true,
            serialization: 'json'
          });

          this.setupConnection(conn);

          conn.on('open', () => {
            console.log('✅ Conectado ao host com sucesso!');
            resolve(id);
          });

          conn.on('error', (err) => {
            console.error('❌ Erro ao conectar ao host:', err);
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          console.error('❌ Erro no peer player:', err);
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Configura uma conexão (host ou player)
   */
  setupConnection(conn) {
    conn.on('open', () => {
      console.log('🔗 Conexão estabelecida com:', conn.peer);
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      console.log('📨 Mensagem recebida:', data);
      this.onMessageCallbacks.forEach(callback => callback(data));
      
      // Se for host, rebroadcast para outros jogadores
      if (this.isHost) {
        this.broadcast(data, conn.peer);
      }
    });

    conn.on('close', () => {
      console.log('👋 Conexão fechada com:', conn.peer);
      this.connections.delete(conn.peer);
    });

    conn.on('error', (err) => {
      console.error('❌ Erro na conexão com', conn.peer, ':', err);
    });
  }

  /**
   * Envia mensagem para todos os conectados
   */
  broadcast(data, excludePeerId = null) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error('❌ Erro ao enviar para', peerId, ':', error);
        }
      }
    });
  }

  /**
   * Registra callback para receber mensagens
   */
  onMessage(callback) {
    this.onMessageCallbacks.push(callback);
  }

  /**
   * Remove callback de mensagens
   */
  removeMessageListener(callback) {
    const index = this.onMessageCallbacks.indexOf(callback);
    if (index > -1) {
      this.onMessageCallbacks.splice(index, 1);
    }
  }

  /**
   * Fecha todas as conexões
   */
  disconnect() {
    console.log('🔌 Desconectando peer service...');
    
    this.connections.forEach((conn) => {
      conn.close();
    });
    
    this.connections.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.onMessageCallbacks = [];
  }

  /**
   * Verifica se está conectado
   */
  isConnected() {
    return this.peer && !this.peer.destroyed && this.connections.size > 0;
  }

  /**
   * Retorna número de jogadores conectados
   */
  getConnectionCount() {
    return this.connections.size;
  }
}

// Singleton
const peerService = new PeerService();
export default peerService;
