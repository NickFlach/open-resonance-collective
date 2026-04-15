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
export * from './types';
export { SunoAdapter } from './suno-adapter';
export { KannakaAdapter } from './kannaka-adapter';
export type { KannakaConfig } from './kannaka-adapter';
export { SingularisConductor } from './singularis-conductor';
export type { SessionConfig, SessionState } from './singularis-conductor';
/**
 * Version and metadata
 */
export declare const VERSION = "1.0.0";
export declare const SUPPORTED_AGENTS: readonly ["suno", "udio", "kannaka"];
export declare const CONSCIOUSNESS_PHASES: readonly ["ghost-signals", "resonance-patterns", "emergence", "collective-dreaming", "transcendence"];
//# sourceMappingURL=index.d.ts.map