/**
 * Utilitários para validação de jogadas
 */

/**
 * Valida se um jogador pode submeter uma resposta
 */
export function canPlayerSubmitAnswer(gameState, currentPlayer, currentFDP, submittedAnswers) {
  // Verifica se o jogo está no estado correto
  if (gameState !== 'PLAYING') {
    return { valid: false, reason: 'Não é possível submeter resposta agora' };
  }

  // Verifica se o jogador existe
  if (!currentPlayer) {
    return { valid: false, reason: 'Jogador não encontrado' };
  }

  // Verifica se o jogador não é o FDP da rodada
  if (currentPlayer.id === currentFDP) {
    return { valid: false, reason: 'O FDP não pode submeter resposta' };
  }

  // Verifica se o jogador já submeteu uma resposta
  if (submittedAnswers[currentPlayer.id]) {
    return { valid: false, reason: 'Você já submeteu sua resposta' };
  }

  return { valid: true };
}

/**
 * Valida se o FDP pode escolher um vencedor
 */
export function canFDPSelectWinner(gameState, currentPlayer, currentFDP, submittedAnswers, players) {
  // Verifica se o jogo está no estado correto
  if (gameState !== 'ROUND_VOTING') {
    return { valid: false, reason: 'Não é hora de votar' };
  }

  // Verifica se o jogador é o FDP
  if (!currentPlayer || currentPlayer.id !== currentFDP) {
    return { valid: false, reason: 'Apenas o FDP pode escolher o vencedor' };
  }

  // Verifica se todas as respostas foram submetidas
  const nonFDPPlayers = players.filter(p => p.id !== currentFDP);
  const allSubmitted = nonFDPPlayers.every(p => submittedAnswers[p.id]);

  if (!allSubmitted) {
    return { valid: false, reason: 'Nem todos os jogadores submeteram suas respostas' };
  }

  return { valid: true };
}

/**
 * Valida se é possível iniciar o jogo
 */
export function canStartGame(players, gameConfig) {
  if (players.length < gameConfig.minPlayers) {
    return { 
      valid: false, 
      reason: `Mínimo de ${gameConfig.minPlayers} jogadores necessários` 
    };
  }

  if (players.length > gameConfig.maxPlayers) {
    return { 
      valid: false, 
      reason: `Máximo de ${gameConfig.maxPlayers} jogadores permitidos` 
    };
  }

  return { valid: true };
}

/**
 * Valida configurações do jogo
 */
export function validateGameConfig(config) {
  const errors = [];

  if (config.cardsPerPlayer < 5 || config.cardsPerPlayer > 15) {
    errors.push('Cartas por jogador deve estar entre 5 e 15');
  }

  if (config.winningScore < 1 || config.winningScore > 10) {
    errors.push('Pontos para vencer deve estar entre 1 e 10');
  }

  if (config.maxPlayers < 3 || config.maxPlayers > 12) {
    errors.push('Máximo de jogadores deve estar entre 3 e 12');
  }

  if (config.minPlayers < 3 || config.minPlayers > config.maxPlayers) {
    errors.push('Mínimo de jogadores deve estar entre 3 e o máximo configurado');
  }

  if (config.roundTimer < 0 || config.roundTimer > 600) {
    errors.push('Timer da rodada deve estar entre 0 e 600 segundos');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Verifica se o jogo terminou
 */
export function checkGameEnd(scores, winningScore) {
  const maxScore = Math.max(...Object.values(scores));
  const winners = Object.keys(scores).filter(playerId => scores[playerId] === maxScore);
  
  if (maxScore >= winningScore) {
    return {
      gameEnded: true,
      winners,
      finalScore: maxScore
    };
  }

  return {
    gameEnded: false,
    winners: [],
    finalScore: maxScore
  };
}

/**
 * Calcula estatísticas do jogo
 */
export function calculateGameStats(gameHistory, players, scores) {
  const stats = {
    totalRounds: gameHistory.length,
    totalPlayers: players.length,
    averageRoundsPerPlayer: gameHistory.length / players.length,
    playerStats: {}
  };

  // Estatísticas por jogador
  players.forEach(player => {
    const playerWins = gameHistory.filter(round => round.winner === player.id).length;
    const winRate = gameHistory.length > 0 ? (playerWins / gameHistory.length) * 100 : 0;
    
    stats.playerStats[player.id] = {
      name: player.name,
      wins: playerWins,
      winRate: winRate.toFixed(1),
      currentScore: scores[player.id] || 0,
      isBot: player.isBot || false
    };
  });

  // Jogador com melhor desempenho
  const bestPlayer = Object.values(stats.playerStats).reduce((best, current) => {
    return current.wins > best.wins ? current : best;
  }, { wins: 0 });

  stats.bestPlayer = bestPlayer;

  return stats;
}

/**
 * Gera relatório do jogo
 */
export function generateGameReport(gameHistory, players, scores, gameConfig) {
  const stats = calculateGameStats(gameHistory, players, scores);
  const gameEnd = checkGameEnd(scores, gameConfig.winningScore);
  
  const report = {
    gameInfo: {
      startTime: gameHistory[0]?.timestamp || new Date().toISOString(),
      endTime: new Date().toISOString(),
      duration: gameHistory.length > 0 ? 
        new Date() - new Date(gameHistory[0].timestamp) : 0,
      config: gameConfig
    },
    results: {
      winner: gameEnd.winners[0] || null,
      finalScores: scores,
      gameEnded: gameEnd.gameEnded
    },
    statistics: stats,
    roundHistory: gameHistory.map((round, index) => ({
      roundNumber: index + 1,
      question: round.question,
      winningAnswer: round.answers[round.winner],
      winner: players.find(p => p.id === round.winner)?.name || 'Desconhecido',
      allAnswers: Object.entries(round.answers).map(([playerId, answer]) => ({
        player: players.find(p => p.id === playerId)?.name || 'Desconhecido',
        answer
      }))
    }))
  };

  return report;
}

/**
 * Formata tempo em formato legível
 */
export function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Sanitiza texto para evitar XSS
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Valida nome de jogador
 */
export function validatePlayerName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }

  const sanitizedName = sanitizeText(name);
  
  if (sanitizedName.length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }

  if (sanitizedName.length > 20) {
    return { valid: false, error: 'Nome deve ter no máximo 20 caracteres' };
  }

  if (!/^[a-zA-ZÀ-ÿ0-9\s]+$/.test(sanitizedName)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }

  return { valid: true, sanitizedName };
}

/**
 * Valida código da sala
 */
export function validateRoomCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Código da sala é obrigatório' };
  }

  const sanitizedCode = code.trim().toUpperCase();
  
  if (sanitizedCode.length !== 6) {
    return { valid: false, error: 'Código deve ter 6 caracteres' };
  }

  if (!/^[A-Z0-9]+$/.test(sanitizedCode)) {
    return { valid: false, error: 'Código contém caracteres inválidos' };
  }

  return { valid: true, sanitizedCode };
}

/**
 * Gera um ID único
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function para otimizar performance
 */
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function para otimizar performance
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}