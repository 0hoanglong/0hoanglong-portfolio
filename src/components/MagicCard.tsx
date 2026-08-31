import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

export interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  enableBorderGlow?: boolean;
  enableStars?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  particleCount?: number;
  spotlightRadius?: number;
  glowColor?: string; // Optional custom RGB string e.g. "0, 210, 255". If omitted, defaults to active theme accent.
  disableAnimations?: boolean;
}

const DEFAULT_SPOTLIGHT_RADIUS = 260;
const DEFAULT_PARTICLE_COUNT = 8;

export const MagicCard: React.FC<MagicCardProps> = ({
  children,
  className = '',
  enableTilt = true,
  enableBorderGlow = true,
  enableStars = true,
  enableMagnetism = false,
  clickEffect = true,
  particleCount = DEFAULT_PARTICLE_COUNT,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor,
  disableAnimations = false,
  style,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isHoveredRef = useRef<boolean>(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  // Helper to retrieve current CSS theme accent rgb
  const getComputedAccentRgb = useCallback((): string => {
    if (glowColor) return glowColor;
    if (typeof window === 'undefined') return '0, 210, 255';
    const computed = getComputedStyle(document.documentElement).getPropertyValue('--magic-glow-color').trim();
    return computed || '0, 210, 255';
  }, [glowColor]);

  // Create subtle cosmic star particles
  const createParticle = useCallback((x: number, y: number, colorRgb: string) => {
    const el = document.createElement('div');
    el.className = 'particle-star';
    el.style.cssText = `
      position: absolute;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: rgba(${colorRgb}, 0.9);
      box-shadow: 0 0 8px rgba(${colorRgb}, 0.8);
      pointer-events: none;
      z-index: 25;
      left: ${x}px;
      top: ${y}px;
    `;
    return el;
  }, []);

  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        },
      });
    });
    particlesRef.current = [];
  }, []);

  const spawnParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || !enableStars) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    const currentRgb = getComputedAccentRgb();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const particle = createParticle(
          Math.random() * (width - 20) + 10,
          Math.random() * (height - 20) + 10,
          currentRgb
        );
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(
          particle,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
        );

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 60,
          y: (Math.random() - 0.5) * 60,
          duration: 2 + Math.random() * 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        gsap.to(particle, {
          opacity: 0.2,
          duration: 1.2,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
        });
      }, i * 90);

      timeoutsRef.current.push(timeoutId);
    }
  }, [enableStars, particleCount, createParticle, getComputedAccentRgb]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (disableAnimations || isMobile || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      spawnParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearParticles();

      // Reset Glow
      element.style.setProperty('--glow-intensity', '0');

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.35,
          ease: 'power2.out',
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const relativeX = (x / rect.width) * 100;
      const relativeY = (y / rect.height) * 100;

      // Update CSS variables for border glow and backdrop spotlight
      element.style.setProperty('--glow-x', `${relativeX}%`);
      element.style.setProperty('--glow-y', `${relativeY}%`);
      element.style.setProperty('--glow-intensity', '1');
      element.style.setProperty('--glow-radius', `${spotlightRadius}px`);
      if (glowColor) {
        element.style.setProperty('--current-glow', glowColor);
      }

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.15,
          ease: 'power1.out',
          transformPerspective: 1000,
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.04;
        const magnetY = (y - centerY) * 0.04;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.25,
          ease: 'power2.out',
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );

      const activeRgb = getComputedAccentRgb();
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${activeRgb}, 0.35) 0%, rgba(${activeRgb}, 0.15) 35%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 50;
      `;

      element.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.7,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        }
      );
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearParticles();
    };
  }, [
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    spawnParticles,
    clearParticles,
    spotlightRadius,
    glowColor,
    getComputedAccentRgb,
  ]);

  return (
    <div
      ref={cardRef}
      className={`magic-card ${enableBorderGlow ? 'magic-card-glow' : ''} ${className}`.trim()}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
export default MagicCard;
