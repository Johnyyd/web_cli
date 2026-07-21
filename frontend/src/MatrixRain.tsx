import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  enabled: boolean;
  color: string;
}

const MATRIX_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&*+=?~';

const MatrixRain: React.FC<MatrixRainProps> = ({ enabled, color }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animFrameId: number;
    let width = 0;
    let height = 0;
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];

    const updateSize = () => {
      if (!canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      width = canvasRef.current.width = parent ? parent.clientWidth : window.innerWidth;
      height = canvasRef.current.height = parent ? parent.clientHeight : window.innerHeight;
      columns = Math.max(Math.floor(width / fontSize), 1);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -60));
    };

    updateSize();

    const handleResize = () => {
      updateSize();
    };

    window.addEventListener('resize', handleResize);
    let observer: ResizeObserver | null = null;
    if (canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(canvas.parentElement);
    }

    let lastTime = 0;
    const fpsInterval = 1000 / 30; // 30 FPS cap

    const draw = (timestamp: number) => {
      animFrameId = requestAnimationFrame(draw);
      const elapsed = timestamp - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = timestamp - (elapsed % fpsInterval);

      if (!ctx || width === 0 || height === 0) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [enabled, color]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40 select-none transition-opacity duration-500"
    />
  );
};

export default MatrixRain;
