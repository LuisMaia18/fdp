import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { dealInitialCards, getNextQuestionCard, shuffleArray, answerCards } from '../data/cards';

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
  votingTimer: 60   // 1 minuto para votar
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
  RESET_GAME: 'RESET_GAME'
};

// Reducer
function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_GAME_CONFIG:
      return {
        ...state,
        gameConfig: { ...state.gameConfig, ...action.payload }
      };
      
    case ACTIONS.SET_ROOM_CODE:
      return {
        ...state,
        roomCode: action.payload
      };
      
    case ACTIONS.SET_IS_HOST:
      return {
        ...state,
        isHost: action.payload
      };
      
    case ACTIONS.SET_GAME_STATE:
      return {
        ...state,
        gameState: action.payload
      };
      
    case ACTIONS.ADD_PLAYER:
      const newPlayer = action.payload;
      return {
        ...state,
        players: [...state.players, newPlayer],
        scores: {
          ...state.scores,
          [newPlayer.id]: 0
        }
      };
      
    case ACTIONS.REMOVE_PLAYER:
      const playerId = action.payload;
      return {
        ...state,
        players: state.players.filter(p => p.id !== playerId),
        scores: Object.fromEntries(
          Object.entries(state.scores).filter(([id]) => id !== playerId)
        )
      };
      
    case ACTIONS.SET_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer: action.payload
      };
      
    case ACTIONS.SET_CURRENT_FDP:
      return {
        ...state,
        currentFDP: action.payload
      };
      
    case ACTIONS.UPDATE_PLAYER:
      const { playerId: updateId, updates } = action.payload;
      return {
        ...state,
        players: state.players.map(p => 
          p.id === updateId ? { ...p, ...updates } : p
        )
      };
      
    case ACTIONS.DEAL_CARDS:
      const { playerHands, remainingCards } = dealInitialCards(
        state.players, 
        state.gameConfig.cardsPerPlayer
      );
      return {
        ...state,
        playerHands,
        remainingAnswerCards: remainingCards
      };
      
    case ACTIONS.SET_QUESTION_CARD:
      const questionCard = getNextQuestionCard(state.usedQuestionCards);
      return {
        ...state,
        currentQuestionCard: questionCard,
        usedQuestionCards: [...state.usedQuestionCards, questionCard],
        submittedAnswers: {},
        roundWinner: null
      };
      
    case ACTIONS.SUBMIT_ANSWER:
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
          [submitterId]: state.playerHands[submitterId].filter(
            card => card !== answerCard
          )
        }
      };
      
    case ACTIONS.SELECT_CARD:
      return {
        ...state,
        selectedCards: [...state.selectedCards, action.payload]
      };
      
    case ACTIONS.DESELECT_CARD:
      return {
        ...state,
        selectedCards: state.selectedCards.filter(card => card !== action.payload)
      };
      
    case ACTIONS.CLEAR_SELECTED_CARDS:
      return {
        ...state,
        selectedCards: []
      };
      
    case ACTIONS.SET_ROUND_WINNER:
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
      
    case ACTIONS.NEXT_ROUND:
      // Reabastece as mãos dos jogadores
      const playersToRefill = state.players.filter(p => p.id !== state.currentFDP);
      const newPlayerHands = { ...state.playerHands };
      let cardsUsed = 0;
      
      playersToRefill.forEach(player => {
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
        selectedCards: []
      };
      
    case ACTIONS.START_GAME:
      // Embaralha a ordem dos jogadores e escolhe o primeiro FDP
      const shuffledPlayers = shuffleArray(state.players);
      const firstFDP = shuffledPlayers[0].id;
      
      return {
        ...state,
        gameState: GAME_STATES.PLAYING,
        players: shuffledPlayers,
        currentFDP: firstFDP
      };
      
    case ACTIONS.SET_TIME_REMAINING:
      return {
        ...state,
        timeRemaining: action.payload
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ACTIONS.SHOW_RESULTS:
      return {
        ...state,
        showResults: true
      };
      
    case ACTIONS.HIDE_RESULTS:
      return {
        ...state,
        showResults: false
      };
      
    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        currentPlayer: state.currentPlayer
      };
      
    default:
      return state;
  }
}

// Context
const GameContext = createContext();

// Provider
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Timer effect
  useEffect(() => {
    let timer;
    if (state.timeRemaining > 0) {
      timer = setTimeout(() => {
        dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.timeRemaining - 1 });
      }, 1000);
    } else if (state.timeRemaining === 0) {
      // Timer acabou, fazer ação apropriada baseada no estado
      handleTimerEnd();
    }
    
    return () => clearTimeout(timer);
  }, [state.timeRemaining]);
  
  const handleTimerEnd = () => {
    switch (state.gameState) {
      case GAME_STATES.PLAYING:
        // Se o tempo acabou durante a submissão de respostas
        // Submete respostas aleatórias para jogadores que não enviaram
        const playersWhoDidntSubmit = state.players.filter(
          p => p.id !== state.currentFDP && !state.submittedAnswers[p.id]
        );
        
        playersWhoDidntSubmit.forEach(player => {
          const randomCard = state.playerHands[player.id][0];
          if (randomCard) {
            dispatch({
              type: ACTIONS.SUBMIT_ANSWER,
              payload: { playerId: player.id, answerCard: randomCard }
            });
          }
        });
        
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_VOTING });
        break;
        
      case GAME_STATES.ROUND_VOTING:
        // Se o tempo acabou durante a votação, escolhe uma resposta aleatória
        const submittedAnswerIds = Object.keys(state.submittedAnswers);
        if (submittedAnswerIds.length > 0) {
          const randomWinnerId = submittedAnswerIds[
            Math.floor(Math.random() * submittedAnswerIds.length)
          ];
          dispatch({ type: ACTIONS.SET_ROUND_WINNER, payload: randomWinnerId });
        }
        break;
    }
  };
  
  // Funções auxiliares
  const actions = {
    // Configuração
    setGameConfig: (config) => dispatch({ type: ACTIONS.SET_GAME_CONFIG, payload: config }),
    setRoomCode: (code) => dispatch({ type: ACTIONS.SET_ROOM_CODE, payload: code }),
    setIsHost: (isHost) => dispatch({ type: ACTIONS.SET_IS_HOST, payload: isHost }),
    
    // Jogadores
    addPlayer: (player) => dispatch({ type: ACTIONS.ADD_PLAYER, payload: player }),
    removePlayer: (playerId) => dispatch({ type: ACTIONS.REMOVE_PLAYER, payload: playerId }),
    setCurrentPlayer: (player) => dispatch({ type: ACTIONS.SET_CURRENT_PLAYER, payload: player }),
    updatePlayer: (playerId, updates) => dispatch({ 
      type: ACTIONS.UPDATE_PLAYER, 
      payload: { playerId, updates } 
    }),
    
    // Jogo
    startGame: () => {
      dispatch({ type: ACTIONS.DEAL_CARDS });
      dispatch({ type: ACTIONS.START_GAME });
      dispatch({ type: ACTIONS.SET_QUESTION_CARD });
      dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.roundTimer });
    },
    
    submitAnswer: (answerCard) => {
      if (state.currentPlayer && state.currentPlayer.id !== state.currentFDP) {
        dispatch({
          type: ACTIONS.SUBMIT_ANSWER,
          payload: { playerId: state.currentPlayer.id, answerCard }
        });
      }
    },
    
    selectWinner: (playerId) => {
      dispatch({ type: ACTIONS.SET_ROUND_WINNER, payload: playerId });
      
      // Verifica se alguém ganhou o jogo
      const newScore = state.scores[playerId] + 1;
      if (newScore >= state.gameConfig.winningScore) {
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.GAME_OVER });
      } else {
        dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.ROUND_RESULTS });
        setTimeout(() => {
          dispatch({ type: ACTIONS.NEXT_ROUND });
          dispatch({ type: ACTIONS.SET_QUESTION_CARD });
          dispatch({ type: ACTIONS.SET_GAME_STATE, payload: GAME_STATES.PLAYING });
          dispatch({ type: ACTIONS.SET_TIME_REMAINING, payload: state.gameConfig.roundTimer });
        }, 3000);
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
    showResults: () => dispatch({ type: ACTIONS.SHOW_RESULTS }),
    hideResults: () => dispatch({ type: ACTIONS.HIDE_RESULTS }),
    
    // Reset
    resetGame: () => dispatch({ type: ACTIONS.RESET_GAME })
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