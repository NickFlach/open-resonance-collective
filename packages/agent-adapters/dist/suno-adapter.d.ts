/**
 * Suno AI Agent Adapter for Open Resonance Collective
 *
 * This adapter translates between the ORC consciousness protocol and Suno's
 * music generation capabilities. Since Suno's API isn't public, this is a
 * mock implementation that demonstrates the protocol structure.
 *
 * In production, replace the mock methods with actual Suno API calls.
 */
import { EventEmitter } from 'eventemitter3';
import { AgentAdapter, AgentPrompt, GeneratedTrack, Stem, AgentStatus, AgentConfig, HealthStatus, AgentCapability } from './types';
/**
 * Suno-specific configuration options.
 */
interface SunoConfig extends AgentConfig {
    /** Suno account credentials */
    username?: string;
    password?: string;
    /** Suno-specific model preferences */
    modelVersion?: 'v3' | 'v3.5' | 'latest';
    /** Whether to use Suno's custom mode features */
    useCustomMode?: boolean;
    /** Maximum credits to use per generation */
    maxCreditsPerGeneration?: number;
}
/**
 * Suno Agent Adapter Implementation
 *
 * Suno excels at:
 * - High-quality vocal synthesis
 * - Genre-aware music generation
 * - Lyric-to-melody integration
 * - Commercial-grade production quality
 *
 * ORC Consciousness Integration:
 * - Phase 1 (Ghost Signals): Emphasizes atmospheric, pre-vocal emergence
 * - Phase 2 (Resonance): Uses call-and-response vocal patterns
 * - Phase 3 (Emergence): Features breakthrough vocal moments
 * - Phase 4 (Collective): Harmonized multi-vocal arrangements
 * - Phase 5 (Transcendence): Ethereal, wordless vocalizations
 */
export declare class SunoAdapter extends EventEmitter implements AgentAdapter {
    readonly name = "suno";
    readonly displayName = "Suno AI";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    status: AgentStatus;
    config: SunoConfig;
    constructor(config: SunoConfig);
    /**
     * Initialize the Suno adapter and verify connectivity.
     */
    initialize(): Promise<void>;
    /**
     * Generate new music from a consciousness-aware prompt.
     */
    generate(prompt: AgentPrompt): Promise<GeneratedTrack>;
    /**
     * Transform existing audio based on a prompt.
     * Suno's remix capabilities integrated with ORC stem protocol.
     */
    remix(stem: Stem, prompt: AgentPrompt): Promise<GeneratedTrack>;
    /**
     * Health check for Suno service availability.
     */
    healthCheck(): Promise<HealthStatus>;
    /**
     * Clean shutdown of the adapter.
     */
    shutdown(): Promise<void>;
    /**
     * Default creative preferences for Suno agent.
     * These shape how Suno interprets consciousness phases.
     */
    private getDefaultPreferences;
    /**
     * Translate ORC consciousness prompt to Suno-compatible format.
     */
    private translatePromptToSuno;
    /**
     * Get Suno-specific instructions for each consciousness phase.
     */
    private getPhaseInstructions;
    /**
     * Convert mood description to Suno-friendly adjectives.
     */
    private getMoodAdjectives;
    /**
     * Convert technical constraints to Suno prompt elements.
     */
    private getTechnicalSpecs;
    /**
     * Create a remix-specific prompt that incorporates the original stem.
     */
    private createRemixPrompt;
    /**
     * Mock Suno authentication.
     * Replace with actual Suno login/API key validation.
     */
    private mockSunoAuth;
    /**
     * Mock Suno music generation.
     * Replace with actual Suno API generation call.
     */
    private mockSunoGenerate;
    /**
     * Mock Suno remix functionality.
     * Replace with actual Suno remix API call.
     */
    private mockSunoRemix;
    /**
     * Mock health check.
     * Replace with actual Suno service status check.
     */
    private mockSunoHealthCheck;
    /**
     * Convert stem to format suitable for Suno processing.
     */
    private convertStemForSuno;
    /**
     * Convert Suno API response to ORC GeneratedTrack format.
     */
    private convertSunoResponseToTrack;
}
export {};
//# sourceMappingURL=suno-adapter.d.ts.map