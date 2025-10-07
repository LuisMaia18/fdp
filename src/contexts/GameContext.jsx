/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { dealInitialCards, getNextQuestionCard, shuffleArray } from '../data/cards';

// Estados possíveis do jogo
export const GAME_STATES = {
  LOBBY: 'LOBBY',
  WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
  PLAYING: 'PLAYING',
  ROUND_VOTING: 'ROUND_VOTING',
  ROUND_RESULTS: 'ROUND_RESULTS',
  GAME_OVER: 'GAME_OVER'
};

// Configurações padrão do jogo
export const DEFAULT_GAME_CONFIG = {
  maxPlayers: 8,
  minPlayers: 3,
  cardsPerPlayer: 10,
  winningScore: 5,
  roundTimer: 120, // 2 minutos por rodada
  votingTimer: 60,   // 1 minuto para votar
  resultsDelaySec: 10 // tempo de exibição dos resultados antes da próxima rodada
};

// Estado inicial
const initialState = {
  // Estado do jogo
  gameState: GAME_STATES.LOBBY,
  gameConfig: DEFAULT_GAME_CONFIG,
  
  // Informações da sala
  roomCode: null,
  isHost: false,
  
  // Jogadores
  players: [],
  currentPlayer: null,
  currentFDP: null, // Jogador que é o FDP da rodada
  
  // Cartas e jogadas
  currentQuestionCard: null,
  usedQuestionCards: [],
  playerHands: {},
  remainingAnswerCards: [],
  submittedAnswers: {},
  roundWinner: null,
  // Ordem estável para exibição das respostas durante a votação
  answerOrder: [],
  
  // Timer
  timeRemaining: null,
  
  // Histórico e pontuação
  gameHistory: [],
  scores: {},
  
  // UI
  selectedCards: [],
  showResults: false,
  error: null,
  loading: false
  ,
  // Preferências/flags de UI
  streamMode: false,
  // Mensagens especiais
  kickedMessage: null
};

// Actions
const ACTIONS = {
  // Configuração do jogo
  SET_GAME_CONFIG: 'SET_GAME_CONFIG',
  SET_ROOM_CODE: 'SET_ROOM_CODE',
  SET_IS_HOST: 'SET_IS_HOST',
  
  // Estados do jogo
  SET_GAME_STATE: 'SET_GAME_STATE',
  START_GAME: 'START_GAME',
  END_GAME: 'END_GAME',
  
  // Jogadores
  ADD_PLAYER: 'ADD_PLAYER',
  REMOVE_PLAYER: 'REMOVE_PLAYER',
  SET_CURRENT_PLAYER: 'SET_CURRENT_PLAYER',
  SET_CURRENT_FDP: 'SET_CURRENT_FDP',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  
  // Cartas e rodadas
  DEAL_CARDS: 'DEAL_CARDS',
  SET_QUESTION_CARD: 'SET_QUESTION_CARD',
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  SELECT_CARD: 'SELECT_CARD',
  DESELECT_CARD: 'DESELECT_CARD',
  CLEAR_SELECTED_CARDS: 'CLEAR_SELECTED_CARDS',
  SET_ROUND_WINNER: 'SET_ROUND_WINNER',
  NEXT_ROUND: 'NEXT_ROUND',
  
  // Timer
  SET_TIME_REMAINING: 'SET_TIME_REMAINING',
  START_TIMER: 'START_TIMER',
  STOP_TIMER: 'STOP_TIMER',
  
  // UI
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  SHOW_RESULTS: 'SHOW_RESULTS',
  HIDE_RESULTS: 'HIDE_RESULTS',
  
  // Reset
  RESET_GAME: 'RESET_GAME',
  // Sincronização (cross-tab)
  APPLY_SNAPSHOT: 'APPLY_SNAPSHOT'
  ,
  // UI/Preferências
  SET_STREAM_MODE: 'SET_STREAM_MODE'
  ,
  SET_KICKED_MESSAGE: 'SET_KICKED_MESSAGE',
  SET_ANSWER_ORDER: 'SET_ANSWER_ORDER'
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GAME_CONFIG: {
      return {
        ...state,
        gameConfig: { ...state.gameConfig, ...action.payload }
      };
    }
      
    case ACTIONS.SET_ROOM_CODE: {
      return {
        ...state,
        roomCode: action.payload
      };
    }
      
    case ACTIONS.SET_IS_HOST: {
      return {
        ...state,
        isHost: action.payload
      };
    }
      
    case ACTIONS.SET_GAME_STATE: {
      return {
        ...state,
        gameState: action.payload
      };
    }
      
    case ACTIONS.ADD_PLAYER: {
      const newPlayer = action.payload;
      return {
        ...state,
        players: [...state.players, newPlayer],
        scores: {
          ...state.scores,
          [newPlayer.id]: 0
        }
      };
    }
      
    case ACTIONS.REMOVE_PLAYER: {
      const playerId = action.payload;
      return {
        ...state,
        players: state.players.filter(p => p.id !== playerId),
        scores: Object.fromEntries(
          Object.entries(state.scores).filter(([id]) => id !== playerId)
        )
      };
    }
      
    case ACTIONS.SET_CURRENT_PLAYER: {
      return {
        ...state,
        currentPlayer: action.payload
      };
    }
      
    case ACTIONS.SET_CURRENT_FDP: {
      return {
        ...state,
        currentFDP: action.payload
      };
    }
      
    case ACTIONS.UPDATE_PLAYER: {
      const { playerId: updateId, updates } = action.payload;
      return {
        ...state,
        players: state.players.map(p => 
          p.id === updateId ? { ...p, ...updates } : p
        )
      };
    }
      
    case ACTIONS.DEAL_CARDS: {
      const { playerHands, remainingCards } = dealInitialCards(
        state.players, 
        state.gameConfig.cardsPerPlayer
      );
      return {
        ...state,
        playerHands,
        remainingAnswerCards: remainingCards
      };
    }
      
    case ACTIONS.SET_QUESTION_CARD: {
      const questionCard = getNextQuestionCard(state.usedQuestionCards);
      return {
        ...state,
        currentQuestionCard: questionCard,
        usedQuestionCards: [...state.usedQuestionCards, questionCard],
        submittedAnswers: {},
        roundWinner: null,
        answerOrder: []
      };
    }
      
    case ACTIONS.SUBMIT_ANSWER: {
      const { playerId: submitterId, answerCard } = action.payload;
      return {
        ...state,
        submittedAnswers: {
          ...state.submittedAnswers,
          [submitterId]: answerCard
        },
        // Remove a carta da mão do jogador
        playerHands: {
          ...state.playerHands,
          // Em clientes remotos a mão do jogador pode ser desconhecida; proteja com fallback
          [submitterId]: (state.playerHands[submitterId] || []).filter(card => card !== answerCard)
        }
      };
    }
      
    case ACTIONS.SELECT_CARD: {
      return {
        ...state,
        selectedCards: [...state.selectedCards, action.payload]
      };
    }
      
    case ACTIONS.DESELECT_CARD: {
      return {
        ...state,
        selectedCards: state.selectedCards.filter(card => card !== action.payload)
      };
    }
      
    case ACTIONS.CLEAR_SELECTED_CARDS: {
      return {
        ...state,
        selectedCards: []
      };
    }
      
    case ACTIONS.SET_ROUND_WINNER: {
      const winnerId = action.payload;
      return {
        ...state,
        roundWinner: winnerId,
        scores: {
          ...state.scores,
          [winnerId]: state.scores[winnerId] + 1
        },
        gameHistory: [
          ...state.gameHistory,
          {
            question: state.currentQuestionCard,
            answers: state.submittedAnswers,
            winner: winnerId,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
      
    case ACTIONS.NEXT_ROUND: {
      // Reabastece as mãos dos jogadores
      const playersToRefill = state.players.filter(p => p.id !== state.currentFDP);
      const newPlayerHands = { ...state.playerHands };
      let cardsUsed = 0;
      
      playersToRefill.forEach(player => {
        // Garante estrutura existente
        if (!Array.isArray(newPlayerHands[player.id])) newPlayerHands[player.id] = [];
        const currentHandSize = newPlayerHands[player.id].length;
        const cardsNeeded = state.gameConfig.cardsPerPlayer - currentHandSize;
        
        if (cardsNeeded > 0) {
          const startIndex = cardsUsed;
          const endIndex = startIndex + cardsNeeded;
          const newCards = state.remainingAnswerCards.slice(startIndex, endIndex);
          
          newPlayerHands[player.id] = [...newPlayerHands[player.id], ...newCards];
          cardsUsed += cardsNeeded;
        }
      });
      
      // Próximo FDP (jogador à esquerda)
      const currentFDPIndex = state.players.findIndex(p => p.id === state.currentFDP);
      const nextFDPIndex = (currentFDPIndex + 1) % state.players.length;
      const nextFDP = state.players[nextFDPIndex].id;
      
      return {
        ...state,
        playerHands: newPlayerHands,
        remainingAnswerCards: state.remainingAnswerCards.slice(cardsUsed),
        currentFDP: nextFDP,
        submittedAnswers: {},
        roundWinner: null,
        selectedCards: [],
        answerOrder: []
      };
    }
      
    case ACTIONS.START_GAME: {
      // Embaralha a ordem dos jogadores e escolhe o primeiro FDP
      const shuffledPlayers = shuffleArray(state.players);
      const firstFDP = shuffledPlayers[0].id;
      
      return {
        ...state,
        gameState: GAME_STATES.PLAYING,
        players: shuffledPlayers,
        currentFDP: firstFDP,
        answerOrder: []
      };
    }
      
    case ACTIONS.SET_TIME_REMAINING: {
      return {
        ...state,
        timeRemaining: action.payload
      };
    }
      
    case ACTIONS.SET_ERROR: {
      return {
        ...state,
        error: action.payload
      };
    }
      
    case ACTIONS.SET_LOADING: {
      return {
        ...state,
        loading: action.payload
      };
    }
    
    case ACTIONS.SET_STREAM_MODE: {
      return {
        ...state,
        streamMode: !!action.payload
      };
    }
    
    case ACTIONS.SET_KICKED_MESSAGE: {
      return {
        ...state,
        kickedMessage: action.payload || null
      };
    }
    
    case ACTIONS.SET_ANSWER_ORDER: {
      return {
        ...state,
        answerOrder: Array.isArray(action.payload) ? action.payload : []
      };
    }
      
    case ACTIONS.SHOW_RESULTS: {
      return {
        ...state,
        showResults: true
      };
    }
      
    case ACTIONS.HIDE_RESULTS: {
      return {
        ...state,
        showResults: false
      };
    }
      
    case ACTIONS.RESET_GAME: {
      return {
        ...initialState,
        currentPlayer: state.currentPlayer
      };
    }

  case ACTIONS.APPLY_SNAPSHOT: {
      const snapshot = action.payload || {};
      const localCurrent = state.currentPlayer;
      // Começa com o snapshot do host
      const next = { ...snapshot };
    // NUNCA herdar isHost do snapshot: cada cliente mantém seu próprio papel
    next.isHost = state.isHost;
      const snapPlayers = Array.isArray(snapshot.players) ? snapshot.players : [];
      const localPlayers = Array.isArray(state.players) ? state.players : [];
      // Une jogadores por id (snapshot tem prioridade para dados), preserva jogadores locais não listados
      const byId = new Map();
      for (const p of snapPlayers) byId.set(p.id, p);
      for (const p of localPlayers) if (!byId.has(p.id)) byId.set(p.id, p);
      next.players = Array.from(byId.values());
      // Scores: usa do snapshot quando existir, senão mantém local ou 0
      const mergedScores = { ...(state.scores || {}), ...(snapshot.scores || {}) };
      for (const p of next.players) {
        if (mergedScores[p.id] === undefined) mergedScores[p.id] = 0;
      }
      next.scores = mergedScores;
      // Mãos: mantém as do snapshot quando existir, senão preserva local
      const mergedHands = { ...(state.playerHands || {}), ...(snapshot.playerHands || {}) };
      // Garante ao menos um array vazio para todos os jogadores
      for (const p of next.players) {
        if (!Array.isArray(mergedHands[p.id])) mergedHands[p.id] = [];
      }
      next.playerHands = mergedHands;
      // currentPlayer local sempre preservado (referência do usuário dessa aba)
      if (localCurrent) {
        next.currentPlayer = localCurrent;
      }
      return next;
    }
      
    default:
      return state;
  }
}

// Context
const GameContext = createContext();

// Provider
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  const channelRef = useRef(null);
  const clientIdRef = useRef(`client_${Math.random().toString(36).slice(2)}`);
  const isApplyingRemoteRef = useRef(false);
  const roomRef = useRef(null);
  
  // Mirror latest state into a ref for stable access in event handlers
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleTimerEnd = React.useCallback(() => {
    // Apenas o host coordena a virada de fase por tempo
    if (!state.isHost) return;
    switch (state.gameState) {
      case GAME_STATES.PLAYING: {
        // Se o tempo acabou durante a submissão de respostas
        // Submete respostas aleatórias para jogadores que não enviaram
        const playersWhoDidntSubmit = state.players.filter(
          p => p.id !== state.currentFDP && !state.submittedAnswers[p.id]
        );
        playersWhoDidntSubmit.forEach(player => {
          const randomCard = state.playerHands[player.id][0];
          if (randomCard) {
            dispatch({ type: ACTIONS.SUBMIT_ANSWER, payload: { playerId: player.id, answerCard: randomCard } });
          }
        });
        // Define ordem estável das respostas e entra em votação
        const ids = Array.from(new Set(Object.keys(state.submittedAnswers).concat(playersWhoDidntSubmit.map(p => p.id))));
        const randomized = [...ids].sort(() => Math.random() - 0.5);
        dispatch({ type: ACTIONS.SET_ANSWER_ORDER, payload: randomized });
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_VOTING });
        if (state.gameConfig.votingTimer > 0) {
          dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.votingTimer });
        }
        setTimeout(() => sendSnapshot(), 0);
        break;
      }
      case GAME_STATES.ROUND_VOTING: {
        // Se o tempo acabou durante a votação, escolhe uma resposta aleatória e avança
        const submittedAnswerIds = Object.keys(state.submittedAnswers);
        if (submittedAnswerIds.length > 0) {
          const randomWinnerId = submittedAnswerIds[Math.floor(Math.random() * submittedAnswerIds.length)];
          dispatch({ type: ACTIONS.SET_ROUND_WINNER, payload: randomWinnerId });
          const newScore = (state.scores[randomWinnerId] || 0) + 1;
          if (newScore >= state.gameConfig.winningScore) {
            dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.GAME_OVER });
            setTimeout(() => sendSnapshot(), 10);
          } else {
            dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_RESULTS });
            setTimeout(() => {
              dispatch({ type: ACTIONS.NEXT_ROUND });
              dispatch({ type: ACTIONS.SET_QUESTION_CARD });
              dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.PLAYING });
              dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.roundTimer });
              setTimeout(() => sendSnapshot(), 10);
            }, (state.gameConfig?.resultsDelaySec ?? 3) * 1000);
          }
        }
        break;
      }
    }
  }, [state.isHost, state.gameState, state.players, state.currentFDP, state.submittedAnswers, state.playerHands, state.gameConfig?.votingTimer, state.gameConfig?.roundTimer, state.gameConfig?.resultsDelaySec]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (state.timeRemaining > 0) {
      timer = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.timeRemaining - 1 });
      }, 1000);
    } else if (state.timeRemaining === 0) {
      handleTimerEnd();
    }
    
    return () => clearTimeout(timer);
  }, [state.timeRemaining, handleTimerEnd]);
  
  // Funções auxiliares
  // ---------------------------------
  const postMessageBC = (type, payload) => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({ type, payload, sender: clientIdRef.current, ts: Date.now() });
  };

  const sendSnapshot = React.useCallback(() => {
    // Não enviar enquanto aplicando estado remoto
    if (isApplyingRemoteRef.current) return;
    postMessageBC('STATE_SNAPSHOT', {
      ...stateRef.current
    });
  }, []);

  // BroadcastChannel para sincronizar entre abas do mesmo navegador
  // BroadcastChannel para sincronizar entre abas do mesmo navegador
  useEffect(() => {
    // Recria o canal quando o roomCode muda
    if (state.roomCode && roomRef.current !== state.roomCode) {
      // Fecha canal anterior
      if (channelRef.current) {
  try { channelRef.current.close(); } catch { /* noop */ }
      }
      const name = `fdp-room-${state.roomCode}`;
      const ch = new BroadcastChannel(name);
      channelRef.current = ch;
      roomRef.current = state.roomCode;

      ch.onmessage = (ev) => {
        const msg = ev.data || {};
        if (!msg || msg.sender === clientIdRef.current) return; // ignora a si mesmo
        const { type, payload } = msg;
        switch (type) {
          case 'PLAYER_JOIN': {
            const exists = stateRef.current.players.some(p => p.id === payload.id);
            if (!exists) {
              dispatch({ type: ACTIONS.ADD_PLAYER, payload });
            }
            // Se somos host, mandamos um snapshot após pequeno atraso para garantir estado atualizado
            if (stateRef.current.isHost) setTimeout(() => sendSnapshot(), 50);
            break;
          }
          case 'PLAYER_LEAVE': {
            dispatch({ type: ACTIONS.REMOVE_PLAYER, payload });
            // Se fomos nós que fomos removidos pelo host, exibe aviso local
            const localId = stateRef.current.currentPlayer?.id;
            const weWereKicked = localId && payload === localId;
            if (weWereKicked) {
              dispatch({ type: ACTIONS.SET_KICKED_MESSAGE, payload: 'O host te removeu da sala.' });
            }
            if (stateRef.current.isHost) sendSnapshot();
            break;
          }
          case 'STATE_SNAPSHOT': {
            isApplyingRemoteRef.current = true;
            dispatch({ type: ACTIONS.APPLY_SNAPSHOT, payload });
            // pequena janela para não rebroadcastar
            setTimeout(() => { isApplyingRemoteRef.current = false; }, 0);
            break;
          }
          case 'ANSWER_SUBMITTED': {
            // Atualiza submissão de qualquer jogador nas demais abas
            const { playerId, answerCard } = payload || {};
            if (playerId && answerCard) {
              dispatch({ type: ACTIONS.SUBMIT_ANSWER, payload: { playerId, answerCard } });
              // Se somos host, ao recebermos a última resposta, avançamos para votação e sincronizamos
              if (stateRef.current.isHost) {
                setTimeout(() => {
                  const s = stateRef.current;
                  const needed = s.players.filter(p => p.id !== s.currentFDP).length;
                  const received = new Set([...Object.keys(s.submittedAnswers), playerId]).size;
                  if (received >= needed && s.gameState === GAME_STATES.PLAYING) {
                    // Define uma ordem estável (aleatória apenas UMA vez) das respostas
                    const ids = Array.from(new Set([...Object.keys(s.submittedAnswers), playerId]));
                    const randomized = [...ids].sort(() => Math.random() - 0.5);
                    dispatch({ type: ACTIONS.SET_ANSWER_ORDER, payload: randomized });
                    dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_VOTING });
                    if (s.gameConfig.votingTimer > 0) {
                      dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: s.gameConfig.votingTimer });
                    }
                    // Host envia snapshot para alinhar todos (após reducers processarem)
                    setTimeout(() => sendSnapshot(), 0);
                  }
                }, 0);
              }
            }
            break;
          }
          case 'WINNER_SELECTED': {
            if (stateRef.current.isHost) {
              const winnerId = payload?.winnerId;
              const s = stateRef.current;
              if (winnerId && s.gameState === GAME_STATES.ROUND_VOTING) {
                dispatch({ type: ACTIONS.SET_ROUND_WINNER, payload: winnerId });
                const newScore = (s.scores[winnerId] || 0) + 1;
                if (newScore >= s.gameConfig.winningScore) {
                  dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.GAME_OVER });
                  setTimeout(() => sendSnapshot(), 10);
                } else {
                  dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_RESULTS });
                  setTimeout(() => sendSnapshot(), 10);
                  setTimeout(() => {
                    dispatch({ type: ACTIONS.NEXT_ROUND });
                    dispatch({ type: ACTIONS.SET_QUESTION_CARD });
                    dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.PLAYING });
                    dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: stateRef.current.gameConfig.roundTimer });
                    setTimeout(() => sendSnapshot(), 10);
                  }, (stateRef.current.gameConfig?.resultsDelaySec ?? 3) * 1000);
                }
              }
            }
            break;
          }
          case 'SNAPSHOT_REQUEST': {
            if (stateRef.current.isHost) sendSnapshot();
            break;
          }
          default:
            break;
        }
      };

      // Anuncia presença do jogador atual, se houver, antes de pedir snapshot
      if (stateRef.current.currentPlayer) {
        postMessageBC('PLAYER_JOIN', stateRef.current.currentPlayer);
      }
      // Se não é host, pede snapshot logo em seguida (ligeiro atraso para o host processar o JOIN)
      if (!stateRef.current.isHost) {
        setTimeout(() => postMessageBC('SNAPSHOT_REQUEST', null), 50);
      }
    }
    // cleanup ao desmontar
    return () => {};
  }, [state.roomCode, state.isHost, sendSnapshot]);

  // Broadcast leave ao fechar/atualizar a aba
  useEffect(() => {
    const onBeforeUnload = () => {
      if (stateRef.current.currentPlayer) {
  try { postMessageBC('PLAYER_LEAVE', stateRef.current.currentPlayer.id); } catch { /* noop */ }
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const actions = {
    // Configuração
    setGameConfig: (config) => {
      if (!state.isHost) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Somente o host pode alterar as configurações.' });
        return;
      }
      dispatch({ type: ACTIONS.SET_GAME_CONFIG, payload: config });
      // sincroniza configurações com os demais clientes
      if (state.isHost) setTimeout(() => sendSnapshot(), 0);
    },
    setRoomCode: (code) => {
      // Permite definir o código se ainda não existe (criar/entrar) ou se for o host
      if (state.roomCode && !state.isHost) {
        // Ignora alterações de roomCode por não-host após entrar
        return;
      }
      dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: code });
    },
    setIsHost: (isHost) => dispatch({ type: ACTIONS.SET_IS_HOST, payload: isHost }),
    setGameState: (gameState) => dispatch({ type: ACTIONS.SET_GAME_STATE, payload: gameState }),
    
    // Jogadores
    addPlayer: (player) => {
      // Impede que não-host adicionem bots de teste
      if (player?.isBot && !state.isHost) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Somente o host pode adicionar bots.' });
        return;
      }
      dispatch({ type: ACTIONS.ADD_PLAYER, payload: player });
      // broadcast presença
      postMessageBC('PLAYER_JOIN', player);
    },
    removePlayer: (playerId) => {
      const isSelf = state.currentPlayer && state.currentPlayer.id === playerId;
      if (!state.isHost && !isSelf) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Somente o host pode remover outros jogadores.' });
        return;
      }
      dispatch({ type: ACTIONS.REMOVE_PLAYER, payload: playerId });
      postMessageBC('PLAYER_LEAVE', playerId);
    },
    setCurrentPlayer: (player) => dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: player }),
    updatePlayer: (playerId, updates) => dispatch({ 
      type: ACTIONS.UPDATE_PLAYER, 
      payload: { playerId, updates } 
    }),
    
    // Jogo
    startGame: () => {
      if (!state.isHost) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Somente o host pode iniciar o jogo.' });
        return;
      }
      dispatch({ type: ACTIONS.DEAL_CARDS });
      dispatch({ type: ACTIONS.START_GAME });
      dispatch({ type: ACTIONS.SET_QUESTION_CARD });
      dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.roundTimer });
      // Host envia snapshot para sincronizar clientes
      if (state.isHost) {
        // Pequeno atraso para garantir que todas as mutações estejam aplicadas
        setTimeout(() => sendSnapshot(), 10);
      }
    },
    
    submitAnswer: (answerCard) => {
      if (state.currentPlayer && state.currentPlayer.id !== state.currentFDP) {
        // Evita submissões repetidas
        if (state.submittedAnswers[state.currentPlayer.id]) return;
        dispatch({
          type: ACTIONS.SUBMIT_ANSWER,
          payload: { playerId: state.currentPlayer.id, answerCard }
        });
        // Notifica demais abas sobre a submissão
        postMessageBC('ANSWER_SUBMITTED', { playerId: state.currentPlayer.id, answerCard });
        // Se não somos host, pedimos um snapshot como fallback de sincronização
        if (!state.isHost) setTimeout(() => postMessageBC('SNAPSHOT_REQUEST', null), 80);
        // Se somos host, verificamos se é a última resposta e avançamos para a votação
        if (state.isHost) {
          const needed = state.players.filter(p => p.id !== state.currentFDP).length;
          const received = new Set([...Object.keys(state.submittedAnswers), state.currentPlayer.id]).size;
          if (received >= needed && state.gameState === GAME_STATES.PLAYING) {
            // Define ordem estável das respostas desta votação
            const ids = Array.from(new Set([...Object.keys(state.submittedAnswers), state.currentPlayer.id]));
            const randomized = [...ids].sort(() => Math.random() - 0.5);
            dispatch({ type: ACTIONS.SET_ANSWER_ORDER, payload: randomized });
            dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_VOTING });
            if (state.gameConfig.votingTimer > 0) {
              dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.votingTimer });
            }
            setTimeout(() => sendSnapshot(), 0);
          }
        }
      }
    },
    
    selectWinner: (playerId) => {
      // Apenas o FDP pode tentar escolher
      if (!state.currentPlayer || state.currentPlayer.id !== state.currentFDP) return;
      // Se não é host, delega ao host via BroadcastChannel
      if (!state.isHost) {
        postMessageBC('WINNER_SELECTED', { winnerId: playerId });
        return;
      }
      // Host aplica imediatamente e sincroniza
      dispatch({ type: ACTIONS.SET_ROUND_WINNER, payload: playerId });
      const newScore = (state.scores[playerId] || 0) + 1;
      if (newScore >= state.gameConfig.winningScore) {
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.GAME_OVER });
        setTimeout(() => sendSnapshot(), 10);
      } else {
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_RESULTS });
        setTimeout(() => sendSnapshot(), 10);
        setTimeout(() => {
          dispatch({ type: ACTIONS.NEXT_ROUND });
          dispatch({ type: ACTIONS.SET_QUESTION_CARD });
            dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.PLAYING });
          dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.roundTimer });
          setTimeout(() => sendSnapshot(), 10);
        }, (state.gameConfig?.resultsDelaySec ?? 3) * 1000);
      }
    },
    
    // Cartas
    selectCard: (card) => dispatch({ type: ACTIONS.SELECT_CARD, payload: card }),
    deselectCard: (card) => dispatch({ type: ACTIONS.DESELECT_CARD, payload: card }),
    clearSelectedCards: () => dispatch({ type: ACTIONS.CLEAR_SELECTED_CARDS }),
    
    // Timer
    startTimer: (seconds) => dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: seconds }),
    stopTimer: () => dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: null }),
    
    // UI
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setStreamMode: (enabled) => {
      if (!state.isHost) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: 'Somente o host pode alterar a visibilidade do código da sala.' });
        return;
      }
      dispatch({ type: ACTIONS.SET_STREAM_MODE, payload: enabled });
      if (state.isHost) setTimeout(() => sendSnapshot(), 0);
    },
    showResults: () => dispatch({ type: ACTIONS.SHOW_RESULTS }),
    hideResults: () => dispatch({ type: ACTIONS.HIDE_RESULTS }),
    setKickedMessage: (msg) => dispatch({ type: ACTIONS.SET_KICKED_MESSAGE, payload: msg }),
    
    // Reset
    resetGame: () => {
      dispatch({ type: ACTIONS.RESET_GAME });
      if (state.isHost) setTimeout(() => sendSnapshot(), 0);
    }
  };
  
  return (
    <GameContext.Provider value={{ state, actions, GAME_STATES }}>
      {children}
    </GameContext.Provider>
  );
}

// Hook para usar o contexto
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
}

export { ACTIONS };