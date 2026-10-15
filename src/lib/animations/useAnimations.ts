'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to reveal elements on scroll with a staggered fade & subtle upward translation
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  stagger?: number;
  y?: number;
  duration?: number;
  delay?: number;
}) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = containerRef.current!.children;
      if (!items || items.length === 0) return;

      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: options?.y ?? 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.8,
          stagger: options?.stagger ?? 0.08,
          ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
          delay: options?.delay ?? 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [options?.stagger, options?.y, options?.duration, options?.delay]);

  return containerRef;
}

/**
 * Hook to apply parallax effect on a background element relative to scroll
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.25) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || isReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current, {
        yPercent: speed * 50,
        ease: 'none',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
