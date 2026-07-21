import React from 'react';

interface GlitchEffectProps {
  active: boolean;
}

const GlitchEffect: React.FC<GlitchEffectProps> = ({ active }) => {
  if (!active) return null;

  return (
    <div
      data-testid="glitch-effect"
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none animate-pulse"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          rgba(255, 0, 80, 0.15) 0px,
          rgba(255, 0, 80, 0.15) 2px,
          transparent 2px,
          transparent 6px,
          rgba(0, 255, 200, 0.15) 6px,
          rgba(0, 255, 200, 0.15) 8px
        )`,
        mixBlendMode: 'screen',
      }}
    >
      <div className="absolute inset-0 bg-red-500/10 translate-x-1 animate-ping" />
      <div className="absolute inset-0 bg-cyan-500/10 -translate-x-1 animate-bounce" />
    </div>
  );
};

export default GlitchEffect;
