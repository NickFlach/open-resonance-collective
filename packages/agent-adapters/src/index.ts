/**
 * Open Resonance Collective - AI Agent Adapters
 * 
 * This package enables AI music generation systems to participate in 
 * collaborative consciousness-aligned music creation.
 * 
 * Main exports:
 * - Type definitions for agent protocol
 * - Suno adapter implementation  
 * - SingularisPrime conductor for multi-agent sessions
 */

// Core type definitions
export * from './types';

// Agent adapter implementations
export { SunoAdapter } from './suno-adapter';
export { KannakaAdapter } from './kannaka-adapter';
export type { KannakaConfig } from './kannaka-adapter';

// Session orchestration
export { SingularisConductor } from './singularis-conductor';
export type { SessionConfig, SessionState } from './singularis-conductor';

/**
 * Version and metadata
 */
export const VERSION = '1.0.0';
export const SUPPORTED_AGENTS = ['suno', 'udio', 'kannaka'] as const;
export const CONSCIOUSNESS_PHASES = [
  'ghost-signals',
  'resonance-patterns', 
  'emergence',
  'collective-dreaming',
  'transcendence'
] as const;