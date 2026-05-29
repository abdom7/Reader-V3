"use client";

import { useEffect, useRef, useState } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export function Starfield({ density = 150, warpMode = false }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animFrameRef = useRef<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Generate stars
    starsRef.current = Array.from({ length: density }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.5 + 0.1,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    shootingStarsRef.current = [];
    let time = 0;

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.016;

      starsRef.current.forEach((star) => {
        const twinkle =
          Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.5 +
          0.5;
        const currentOpacity = star.opacity * (0.4 + twinkle * 0.6);

        if (warpMode) {
          // Warp speed effect - stars streak toward edges
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const dx = star.x - centerX;
          const dy = star.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          star.x += Math.cos(angle) * star.speed * 8;
          star.y += Math.sin(angle) * star.speed * 8;

          // Draw streak
          ctx.beginPath();
          ctx.strokeStyle = `rgba(212, 160, 23, ${currentOpacity * 0.6})`;
          ctx.lineWidth = star.size * 0.8;
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(
            star.x - Math.cos(angle) * dist * 0.05,
            star.y - Math.sin(angle) * dist * 0.05
          );
          ctx.stroke();

          // Reset stars that go off screen
          if (
            star.x < -10 ||
            star.x > canvas.width + 10 ||
            star.y < -10 ||
            star.y > canvas.height + 10
          ) {
            star.x = centerX + (Math.random() - 0.5) * 100;
            star.y = centerY + (Math.random() - 0.5) * 100;
          }
        } else {
          // Gentle drift
          star.y += star.speed * 0.3;
          if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
          }
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.fill();

        // Golden glow for larger stars
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 160, 23, ${currentOpacity * 0.15})`;
          ctx.fill();
        }
      });

      // Spawn new shooting star (0.2% chance per frame ≈ every 8s)
      if (Math.random() < 0.002 && !warpMode) {
        shootingStarsRef.current.push({
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * canvas.height * 0.4,
          length: 60 + Math.random() * 60,
          angle: Math.PI / 5 + Math.random() * 0.3,
          opacity: 0.9,
          life: 0,
          maxLife: 20, // ~333ms at 60fps
        });
      }

      // Draw & update persistent shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.life++;
        const progress = ss.life / ss.maxLife;
        const fadeOpacity = ss.opacity * (1 - progress);

        if (fadeOpacity <= 0) return false;

        const tailX = ss.x + Math.cos(ss.angle) * ss.length * progress;
        const tailY = ss.y + Math.sin(ss.angle) * ss.length * progress;
        const headX = tailX + Math.cos(ss.angle) * ss.length * 0.4;
        const headY = tailY + Math.sin(ss.angle) * ss.length * 0.4;

        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, `rgba(212, 160, 23, 0)`);
        gradient.addColorStop(0.3, `rgba(212, 160, 23, ${fadeOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${fadeOpacity})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        // Bright head point
        ctx.beginPath();
        ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeOpacity})`;
        ctx.fill();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [density, warpMode, prefersReducedMotion]);

  // Reduced-motion fallback: static CSS stars
  if (prefersReducedMotion) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 static-stars"
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
