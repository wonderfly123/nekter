'use client';

import { useEffect, useRef, useCallback } from 'react';

export function AnimatedGradientBackground() {
  const gradientRef = useRef<HTMLDivElement>(null);
  const lastCallRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    // Throttle to max 10fps (every 100ms)
    if (now - lastCallRef.current < 100) return;
    lastCallRef.current = now;

    if (!gradientRef.current) return;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    gradientRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return; // Don't add listener if user prefers reduced motion

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div
      ref={gradientRef}
      className="fixed inset-0 -z-10 transition-transform duration-300 ease-out"
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(245, 158, 11, 0.02) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, rgba(245, 158, 11, 0.02) 0%, transparent 50%)
        `,
        animation: 'pulse 8s ease-in-out infinite alternate',
      }}
    />
  );
}
