import React, { useEffect, useRef } from 'react';

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create stars
    const numStars = Math.min(120, Math.floor((width * height) / 12000));
    const stars = Array.from({ length: numStars }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    }));

    // Shooting stars
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      active: boolean;
    }

    let shootingStars: ShootingStar[] = [];
    const spawnShootingStar = () => {
      if (Math.random() < 0.03 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 6 + 4,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          opacity: 1,
          active: true,
        });
      }
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle dark gradient background
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.8,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      grad.addColorStop(1, 'rgba(9, 10, 15, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render Stars
      stars.forEach((star) => {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        star.twinklePhase += star.twinkleSpeed;
        const currentOpacity =
          star.opacity * (0.6 + 0.4 * Math.sin(star.twinklePhase));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();
      });

      // Spawn & Render Shooting Stars
      spawnShootingStar();
      shootingStars.forEach((star) => {
        if (!star.active) return;
        const tailX = star.x - Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const lineGrad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        lineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        lineGrad.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.015;

        if (star.opacity <= 0 || star.x > width || star.y > height) {
          star.active = false;
        }
      });
      shootingStars = shootingStars.filter((s) => s.active);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />
    </div>
  );
};
