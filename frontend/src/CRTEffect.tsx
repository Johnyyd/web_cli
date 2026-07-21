import React from 'react';

interface CRTEffectProps {
  enabled: boolean;
}

const CRTEffect: React.FC<CRTEffectProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      data-testid="crt-effect"
      className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-hidden select-none"
    >
      {/* Scanlines layer */}
      <div
        className="absolute inset-0 w-full h-full opacity-[0.15]"
        style={{
          background: `linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.35) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))`,
          backgroundSize: '100% 3px, 6px 100%',
        }}
      />
      {/* Vignette curvature dark corners layer */}
      <div
        className="absolute inset-0 w-full h-full opacity-60"
        style={{
          background: `radial-gradient(circle at center, transparent 60%, rgba(0, 0, 0, 0.75) 100%)`,
        }}
      />
    </div>
  );
};

export default CRTEffect;
