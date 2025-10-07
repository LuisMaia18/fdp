import React from 'react';
import './SubmittedAnswers.css';

function SubmittedAnswers({ question, answers, onSelectWinner, canVote, currentPlayer, order }) {
  // Gera uma lista em ordem estável. Se 'order' foi definido pelo host, segue essa ordem.
  const entries = Object.entries(answers);
  const orderedAnswers = order && Array.isArray(order) && order.length
    ? order
        .filter((playerId) => answers[playerId] !== undefined)
        .map((playerId) => [playerId, answers[playerId]])
    : entries.sort((a, b) => a[0].localeCompare(b[0]));

  const formatQuestionWithAnswer = (question, answer) => {
    return question.replace('______', `**${answer}**`);
  };

  // removed unused getPlayerByAnswer (lint)

  const handleAnswerClick = (playerId) => {
    if (canVote) {
      onSelectWinner(playerId);
    }
  };

  return (
    <div className="submitted-answers">
      <div className="answers-header">
        <h3>
          {canVote ? 
            '👑 Escolha a melhor resposta clicando nela:' : 
            '🗳️ Respostas submetidas:'
          }
        </h3>
        <p className="voting-instruction">
          {canVote ? 
            'Como FDP desta rodada, você decide qual resposta ganha!' :
            'Aguarde o FDP escolher a melhor resposta...'
          }
        </p>
      </div>

      <div className="answers-grid">
        {orderedAnswers.map(([playerId, answer], index) => {
          const isCurrentPlayerAnswer = playerId === currentPlayer?.id;
          
          return (
            <div
              key={playerId}
              className={`answer-option ${canVote ? 'votable' : ''} ${isCurrentPlayerAnswer ? 'own-answer' : ''}`}
              onClick={() => handleAnswerClick(playerId)}
            >
              <div className="answer-number">
                {index + 1}
              </div>
              
              <div className="answer-content">
                <div className="complete-sentence">
                  {formatQuestionWithAnswer(question, answer)}
                </div>
                
                <div className="answer-highlight">
                  <span className="answer-label">Resposta:</span>
                  <span className="answer-text">{answer}</span>
                </div>
              </div>
              
              {canVote && (
                <div className="vote-indicator">
                  <span className="vote-icon">👆</span>
                  <span className="vote-text">Votar</span>
                </div>
              )}
              
              {isCurrentPlayerAnswer && (
                <div className="own-answer-badge">
                  <span>Sua resposta</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!canVote && (
        <div className="waiting-for-vote">
          <div className="waiting-animation">
            <span className="waiting-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
          <p>Aguardando a decisão do FDP...</p>
        </div>
      )}
    </div>
  );
}

export default SubmittedAnswers;