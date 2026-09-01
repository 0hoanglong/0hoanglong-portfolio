import React, { useRef, useEffect, useCallback } from 'react';

export interface LetterGlitchProps {
  glitchColors?: string[];
  className?: string;
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  lightMode?: boolean;
  backgroundColor?: string;
  characters?: string;
}

interface LetterItem {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
}

const HEX_MAP: Record<string, { r: number; g: number; b: number } | null> = {};

const parseHexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (HEX_MAP[hex]) return HEX_MAP[hex];
  const clean = hex.replace('#', '').trim();
  let full = clean;
  if (clean.length === 3) {
    full = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const parsed = parseInt(full, 16);
  if (isNaN(parsed)) return null;
  const rgb = {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
  HEX_MAP[hex] = rgb;
  return rgb;
};

export const LetterGlitch: React.FC<LetterGlitchProps> = ({
  glitchColors = ['#003844', '#00d2ff', '#3b82f6', '#10b981'],
  className = '',
  glitchSpeed = 60,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  lightMode = false,
  backgroundColor,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+=-/<>:;{}[]',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const letters = useRef<LetterItem[]>([]);
  const grid = useRef<{ columns: number; rows: number }>({ columns: 0, rows: 0 });
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const lastGlitchTime = useRef<number>(Date.now());
  const colorsRef = useRef<string[]>(glitchColors);

  colorsRef.current = glitchColors;
  const lettersAndSymbols = Array.from(characters);

  // Optimized grid sizing for lower draw overhead
  const fontSize = 18;
  const charWidth = 14;
  const charHeight = 24;

  const getRandomChar = useCallback(() => {
    return lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  }, [lettersAndSymbols]);

  const getRandomColor = useCallback(() => {
    const arr = colorsRef.current;
    return arr[Math.floor(Math.random() * arr.length)];
  }, []);

  const calculateGrid = (width: number, height: number) => {
    const columns = Math.ceil(width / charWidth);
    const rows = Math.ceil(height / charHeight);
    return { columns, rows };
  };

  const initializeLetters = (columns: number, rows: number) => {
    grid.current = { columns, rows };
    const totalLetters = columns * rows;
    const items: LetterItem[] = new Array(totalLetters);
    for (let i = 0; i < totalLetters; i++) {
      const color = getRandomColor();
      items[i] = {
        char: getRandomChar(),
        color,
        targetColor: color,
        colorProgress: 1,
      };
    }
    letters.current = items;
  };

  const drawLetters = () => {
    if (!context.current || !canvasRef.current || letters.current.length === 0) return;
    const ctx = context.current;
    const { width, height } = canvasRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px "JetBrains Mono", Consolas, "Courier New", monospace`;
    ctx.textBaseline = 'top';

    const cols = grid.current.columns;
    const list = letters.current;
    for (let i = 0; i < list.length; i++) {
      const letter = list[i];
      const x = (i % cols) * charWidth;
      const y = Math.floor(i / cols) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    }
  };

  const updateLetters = () => {
    const list = letters.current;
    if (!list || list.length === 0) return;

    // Optimized: Only scramble ~3% of characters per glitch tick
    const updateCount = Math.max(1, Math.floor(list.length * 0.035));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * list.length);
      const item = list[index];
      if (!item) continue;

      item.char = getRandomChar();
      item.targetColor = getRandomColor();

      if (!smooth) {
        item.color = item.targetColor;
        item.colorProgress = 1;
      } else {
        item.colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    const list = letters.current;
    for (let i = 0; i < list.length; i++) {
      const letter = list[i];
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.08;
        if (letter.colorProgress >= 1) {
          letter.colorProgress = 1;
          letter.color = letter.targetColor;
          needsRedraw = true;
          continue;
        }

        const startRgb = parseHexToRgb(letter.color);
        const endRgb = parseHexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          const factor = letter.colorProgress;
          const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * factor);
          const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * factor);
          const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * factor);
          letter.color = `rgb(${r}, ${g}, ${b})`;
          needsRedraw = true;
        }
      }
    }

    if (needsRedraw) {
      drawLetters();
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    // Optimized dpr cap for loading screen performance
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (context.current) {
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    context.current = canvas.getContext('2d', { alpha: true });
    resizeCanvas();

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;
      const now = Date.now();
      if (now - lastGlitchTime.current >= glitchSpeed) {
        updateLetters();
        drawLetters();
        lastGlitchTime.current = now;
      }

      if (smooth) {
        handleSmoothTransitions();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!isRunning) return;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        animationRef.current = requestAnimationFrame(animate);
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      letters.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glitchSpeed, smooth, getRandomChar, getRandomColor]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: backgroundColor || (lightMode ? '#ffffff' : '#05060f'),
    overflow: 'hidden',
  };

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  };

  const outerVignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: lightMode
      ? 'radial-gradient(circle at center, rgba(255,255,255,0) 40%, rgba(255,255,255,0.96) 100%)'
      : 'radial-gradient(circle at center, rgba(5,6,15,0.2) 20%, rgba(5,6,15,0.95) 90%)',
  };

  const centerVignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: lightMode
      ? 'radial-gradient(circle at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)'
      : 'radial-gradient(circle at center, rgba(5,6,15,0.7) 0%, rgba(5,6,15,0) 70%)',
  };

  return (
    <div style={containerStyle} className={className}>
      <canvas ref={canvasRef} style={canvasStyle} />
      {outerVignette && <div style={outerVignetteStyle} />}
      {centerVignette && <div style={centerVignetteStyle} />}
    </div>
  );
};

export default LetterGlitch;
