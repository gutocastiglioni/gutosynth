/**
 * 5-Tier Viewport & Responsive Layout Hook
 * Implements Directive 2 (Mobile <640px, Tablet 640-1023px, Laptop 1024-1439px, Desktop 1440-1920px, Ultrawide >1920px)
 */

import { useState, useEffect } from 'react';

export type DeviceTier = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';

export interface ResponsiveState {
  width: number;
  height: number;
  tier: DeviceTier;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return getResponsiveMetrics(w, h);
  });

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveMetrics(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

function getResponsiveMetrics(width: number, height: number): ResponsiveState {
  let tier: DeviceTier = 'desktop';

  if (width < 640) {
    tier = 'mobile';
  } else if (width < 1024) {
    tier = 'tablet';
  } else if (width < 1440) {
    tier = 'laptop';
  } else if (width <= 1920) {
    tier = 'desktop';
  } else {
    tier = 'ultrawide';
  }

  return {
    width,
    height,
    tier,
    isMobile: tier === 'mobile',
    isTablet: tier === 'tablet',
    isDesktop: tier === 'laptop' || tier === 'desktop' || tier === 'ultrawide',
    isPortrait: height > width
  };
}
