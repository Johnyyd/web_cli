import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface HardwareBorderProps {
  enabled: boolean;
  children: ReactNode;
}

const HardwareBorder: React.FC<HardwareBorderProps> = ({ enabled, children }) => {
  if (!enabled) {
    return <>{children}</>;
  }

  const getDefaultSize = () => {
    if (typeof window !== 'undefined') {
      return {
        width: Math.min(Math.max(window.innerWidth * 0.88, 600), 1350),
        height: Math.min(Math.max(window.innerHeight * 0.86, 450), 860),
      };
    }
    return { width: 1150, height: 750 };
  };

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [size, setSize] = useState<{ width: number; height: number }>(getDefaultSize);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialPosX: number; initialPosY: number } | null>(null);
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialPosX: number;
    initialPosY: number;
    dir: string;
  } | null>(null);

  // Drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        setPosition({
          x: dragStartRef.current.initialPosX + dx,
          y: dragStartRef.current.initialPosY + dy,
        });
      } else if (resizeStartRef.current) {
        const { startX, startY, initialWidth, initialHeight, initialPosX, initialPosY, dir } = resizeStartRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newW = initialWidth;
        let newH = initialHeight;
        let newX = initialPosX;
        let newY = initialPosY;

        if (dir.includes('e')) newW = Math.max(480, initialWidth + dx);
        if (dir.includes('s')) newH = Math.max(320, initialHeight + dy);
        if (dir.includes('w')) {
          const possibleW = initialWidth - dx;
          if (possibleW >= 480) {
            newW = possibleW;
            newX = initialPosX + dx;
          }
        }
        if (dir.includes('n')) {
          const possibleH = initialHeight - dy;
          if (possibleH >= 320) {
            newH = possibleH;
            newY = initialPosY + dy;
          }
        }

        setSize({ width: newW, height: newH });
        if (dir.includes('w') || dir.includes('n')) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragStartRef.current) {
        dragStartRef.current = null;
        setIsDragging(false);
      }
      if (resizeStartRef.current) {
        resizeStartRef.current = null;
        setIsResizing(false);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // Touch drag listeners for mobile
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (dragStartRef.current) {
        const dx = touch.clientX - dragStartRef.current.startX;
        const dy = touch.clientY - dragStartRef.current.startY;
        setPosition({
          x: dragStartRef.current.initialPosX + dx,
          y: dragStartRef.current.initialPosY + dy,
        });
      } else if (resizeStartRef.current) {
        const { startX, startY, initialWidth, initialHeight, dir } = resizeStartRef.current;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (dir.includes('e')) setSize((prev) => ({ ...prev, width: Math.max(480, initialWidth + dx) }));
        if (dir.includes('s')) setSize((prev) => ({ ...prev, height: Math.max(320, initialHeight + dy) }));
      }
    };

    const handleTouchEnd = () => {
      if (dragStartRef.current) {
        dragStartRef.current = null;
        setIsDragging(false);
      }
      if (resizeStartRef.current) {
        resizeStartRef.current = null;
        setIsResizing(false);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isResizing]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMaximized) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialPosX: position.x,
      initialPosY: position.y,
    };
    setIsDragging(true);
  };

  const startResize = (e: React.MouseEvent | React.TouchEvent, dir: string) => {
    e.stopPropagation();
    if (isMaximized) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizeStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialWidth: size.width,
      initialHeight: size.height,
      initialPosX: position.x,
      initialPosY: position.y,
      dir,
    };
    setIsResizing(true);
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setPosition({ x: 0, y: 0 });
    } else {
      setIsMaximized(true);
      if (typeof window !== 'undefined') {
        setSize({ width: window.innerWidth - 24, height: window.innerHeight - 24 });
      }
      setPosition({ x: 0, y: 0 });
    }
  };

  const resetPositionAndSize = () => {
    setIsMaximized(false);
    setPosition({ x: 0, y: 0 });
    setSize(getDefaultSize());
  };

  const currentWidth = isMaximized ? (typeof window !== 'undefined' ? window.innerWidth - 24 : size.width) : size.width;
  const currentHeight = isMaximized ? (typeof window !== 'undefined' ? window.innerHeight - 24 : size.height) : size.height;

  return (
    <div
      data-testid="hardware-border"
      className="min-h-screen w-full bg-neutral-900/95 flex justify-center items-center select-none overflow-hidden relative"
      style={{
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.95), inset 0 0 20px rgba(255,255,255,0.03)',
      }}
    >
      {/* Outer Monitor Bezel Casing */}
      <div
        className={`bg-neutral-950 rounded-2xl sm:rounded-3xl border-[6px] sm:border-[10px] border-neutral-800 shadow-[0_25px_60px_rgba(0,0,0,0.98)] flex flex-col relative transition-shadow duration-200 ${
          isDragging ? 'shadow-[0_35px_80px_rgba(0,0,0,0.99)] border-neutral-700/80' : ''
        }`}
        style={{
          width: `${currentWidth}px`,
          height: `${currentHeight}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging || isResizing ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Bezel Vent Grooves & Drag Bar */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onDoubleClick={toggleMaximize}
          title="Drag to move terminal window | Double-click to maximize/restore"
          className="h-7 sm:h-8 bg-neutral-900 hover:bg-neutral-850 border-b border-neutral-800/90 flex justify-between items-center px-3 sm:px-4 shrink-0 cursor-move rounded-t-xl sm:rounded-t-2xl transition-colors select-none group"
        >
          {/* Left: Drag indicator & title */}
          <div className="flex items-center gap-2 text-neutral-400 group-hover:text-neutral-200 transition-colors">
            <span className="text-xs sm:text-sm font-mono tracking-tighter opacity-60">⠿</span>
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase truncate">
              DRAG / MOVE BEZEL :: CRT TERMINAL MONITOR
            </span>
          </div>

          {/* Middle Vents */}
          <div className="hidden md:flex items-center gap-1.5 opacity-40">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-4 h-1 bg-neutral-950 rounded-full" />
            ))}
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <button
              onClick={resetPositionAndSize}
              className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/60"
              title="Reset position and size to center default"
            >
              [⟲ Reset]
            </button>
            <button
              onClick={toggleMaximize}
              className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/60"
              title="Toggle maximize / restore size"
            >
              {isMaximized ? '[✕ Restore]' : '[□ Max]'}
            </button>
          </div>
        </div>

        {/* Inner Screen Display Area */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-black rounded-lg sm:rounded-xl shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] flex flex-col">
          {children}
        </div>

        {/* Bottom Bezel Hardware Controls & LED */}
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="h-8 sm:h-9 bg-neutral-900 border-t border-neutral-800 flex justify-between items-center px-4 sm:px-6 shrink-0 text-neutral-500 font-mono text-xs cursor-move select-none rounded-b-xl sm:rounded-b-2xl"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-neutral-400">POWER</span>
          </div>
          <div className="font-bold tracking-widest text-neutral-400 text-xs sm:text-sm drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] truncate px-2">
            LINUX / UNIX TERMINAL 1999
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-neutral-500 hidden sm:inline">{`${Math.round(currentWidth)}×${Math.round(currentHeight)}`}</span>
            <div className="flex items-center gap-1 opacity-60 hidden sm:flex">
              <div className="w-2.5 h-1 bg-neutral-700" />
              <div className="w-2.5 h-1 bg-neutral-700" />
              <div className="w-2.5 h-1 bg-neutral-700" />
            </div>
          </div>
        </div>

        {/* --- RESIZE HANDLES AROUND THE BORDERS --- */}
        {/* East (Right) Edge */}
        <div
          onMouseDown={(e) => startResize(e, 'e')}
          onTouchStart={(e) => startResize(e, 'e')}
          className="absolute right-0 top-7 bottom-8 w-2 cursor-e-resize hover:bg-neutral-600/30 transition-colors z-50"
        />
        {/* West (Left) Edge */}
        <div
          onMouseDown={(e) => startResize(e, 'w')}
          onTouchStart={(e) => startResize(e, 'w')}
          className="absolute left-0 top-7 bottom-8 w-2 cursor-w-resize hover:bg-neutral-600/30 transition-colors z-50"
        />
        {/* South (Bottom) Edge */}
        <div
          onMouseDown={(e) => startResize(e, 's')}
          onTouchStart={(e) => startResize(e, 's')}
          className="absolute left-4 right-4 bottom-0 h-2 cursor-s-resize hover:bg-neutral-600/30 transition-colors z-50"
        />
        {/* North (Top) Edge */}
        <div
          onMouseDown={(e) => startResize(e, 'n')}
          onTouchStart={(e) => startResize(e, 'n')}
          className="absolute left-4 right-4 top-0 h-2 cursor-n-resize hover:bg-neutral-600/30 transition-colors z-50"
        />
        {/* South-East (Bottom-Right) Corner Grip */}
        <div
          onMouseDown={(e) => startResize(e, 'se')}
          onTouchStart={(e) => startResize(e, 'se')}
          title="Drag bottom-right corner to resize monitor"
          className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 z-50 group/grip"
        >
          <div className="w-3 h-3 border-r-2 border-b-2 border-neutral-500 group-hover/grip:border-neutral-200 transition-colors rounded-br" />
        </div>
        {/* South-West Corner */}
        <div
          onMouseDown={(e) => startResize(e, 'sw')}
          onTouchStart={(e) => startResize(e, 'sw')}
          className="absolute left-0 bottom-0 w-5 h-5 cursor-sw-resize z-50"
        />
      </div>
    </div>
  );
};

export default HardwareBorder;
