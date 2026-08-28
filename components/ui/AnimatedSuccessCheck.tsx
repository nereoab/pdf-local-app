'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Checkmark with SVG pathLength stroke-drawing & radar pulse
 */
export function AnimatedCheckmark({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Radar ripple pulses rubio platinado */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: 1.7, opacity: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full border border-[#E8DFCF]/60 pointer-events-none"
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        className="absolute inset-0 rounded-full border border-[#FAF6EE]/40 pointer-events-none"
      />

      {/* SVG drawing circle & check en rubio platinado / white gold */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        className="text-[#F3ECE0] drop-shadow-[0_0_14px_rgba(243,236,224,0.65)]"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        <motion.path
          d="M15 26.5L23 34.5L37 18.5"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.35 }}
        />
      </svg>
    </div>
  );
}

/**
 * Animated Number Counter (Slot/Odometer effect)
 */
export function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ease * value;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const formatted =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/**
 * Disparador de confeti rubio platinado & oro blanco de ultra-lujo (Platinum Blonde Edition)
 */
export async function triggerLuxuryConfetti() {
  if (typeof window === 'undefined') return;
  try {
    const confetti = (await import('canvas-confetti')).default;

    // Ráfaga 1: Cañón izquierdo rubio platinado
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 60,
      origin: { x: 0.15, y: 0.75 },
      colors: ['#FAF6EE', '#F3ECE0', '#E8DFCF', '#DFD5C2', '#C9BDA8', '#FFFFFF'],
      shapes: ['square', 'circle'],
      scalar: 0.9,
      ticks: 160,
      gravity: 0.9,
      decay: 0.91,
      zIndex: 9999,
    });

    // Ráfaga 2: Cañón derecho rubio platinado
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 60,
      origin: { x: 0.85, y: 0.75 },
      colors: ['#FAF6EE', '#F3ECE0', '#E8DFCF', '#DFD5C2', '#C9BDA8', '#FFFFFF'],
      shapes: ['square', 'circle'],
      scalar: 0.9,
      ticks: 160,
      gravity: 0.9,
      decay: 0.91,
      zIndex: 9999,
    });

    // Ráfaga 3: Destello central platino champagne
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#FAF6EE', '#F3ECE0', '#EDE4D3', '#FFFFFF', '#D5C9B3'],
        shapes: ['circle', 'square'],
        scalar: 1.0,
        ticks: 180,
        gravity: 0.85,
        decay: 0.92,
        zIndex: 9999,
      });
    }, 200);
  } catch (err) {
    console.debug('Confetti disabled or failed:', err);
  }
}

/**
 * Micro-explosión de chispas rubio platinado al pulsar el botón de descarga
 */
export async function triggerButtonSparkles(event?: React.MouseEvent) {
  if (typeof window === 'undefined') return;
  try {
    const confetti = (await import('canvas-confetti')).default;
    let origin = { x: 0.5, y: 0.5 };
    if (event) {
      origin = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight,
      };
    }
    confetti({
      particleCount: 35,
      spread: 70,
      origin,
      colors: ['#FAF6EE', '#F3ECE0', '#E8DFCF', '#DFD5C2', '#FFFFFF', '#C9BDA8'],
      shapes: ['circle', 'square'],
      scalar: 0.85,
      ticks: 120,
      gravity: 1.1,
      decay: 0.9,
      zIndex: 9999,
    });
  } catch (err) {
    console.debug('Sparkles disabled or failed:', err);
  }
}
