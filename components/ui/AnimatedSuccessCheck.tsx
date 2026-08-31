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
  // Confetti disabled per user request
}

export async function triggerButtonSparkles(_event?: React.MouseEvent) {
  // Sparkles disabled per user request
}
