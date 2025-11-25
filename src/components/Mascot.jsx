import React from 'react';
import './Mascot.css';

/**
 * Mascot component
 * Props:
 * - size: number|string -> pixel size (default 96)
 * - variant: 'hero' | 'inline' (default 'inline')
 * - floating: boolean (default true)
 * - glow: boolean (default true)
 * - speech: optional string to show speech bubble (works for both variants)
 * - ariaLabel: accessible label for the mascot role=img
 */
function Mascot({
  size = 96,
  variant = 'inline',
  floating = true,
  glow = true,
  speech,
  ariaLabel = 'Mascote do jogo',
  className = ''
}) {
  const styleSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`mascot ${variant === 'hero' ? 'mascot--hero' : 'mascot--inline'} ${floating ? 'is-floating' : ''} ${glow ? 'has-glow' : ''} ${className}`}
      style={{ ['--mascot-size']: styleSize }}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="mascot-ring" aria-hidden="true" />
      <img className="mascot-img" src="/mascot_monkey.svg" alt="" loading="lazy" />
      {speech && (
        <div className="mascot-speech" aria-hidden="true">{speech}</div>
      )}
    </div>
  );
}

export default Mascot;
