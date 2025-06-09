// src/utils/loginUtils.ts

import { ParticleColor } from '@/types/login';

export const PARTICLE_COLORS: ParticleColor[] = [
  { bg: 'bg-[#ff950e]', hex: '#ff950e' }, // Orange
  { bg: 'bg-[#ff6b00]', hex: '#ff6b00' }, // Orange variant
  { bg: 'bg-white', hex: '#ffffff' },     // White
  { bg: 'bg-[#ffb347]', hex: '#ffb347' }, // Light orange
  { bg: 'bg-[#ffa500]', hex: '#ffa500' }  // Another orange variant
];

export const generateParticleProps = () => ({
  size: Math.random() * 2 + 1, // Size between 1px and 3px
  opacity: Math.random() * 0.3 + 0.1, // Opacity between 0.1 and 0.4
  glowIntensity: Math.random() * 0.5 + 0.2, // Glow intensity
});

export const getParticleColor = (index: number): ParticleColor => {
  return PARTICLE_COLORS[index % PARTICLE_COLORS.length];
};

export const createGlowColor = (hex: string, intensity: number): string => {
  return `${hex}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`;
};

export const validateUsername = (username: string): boolean => {
  return username.trim().length > 0;
};

export const validateAdminCredentials = (username: string, role: string): boolean => {
  if (role !== 'admin') return true;
  const trimmedUsername = username.trim().toLowerCase();
  return trimmedUsername === 'gerome' || trimmedUsername === 'oakley';
};