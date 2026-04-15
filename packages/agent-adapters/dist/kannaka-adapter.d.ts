/**
 * Kannaka AI Agent Adapter for Open Resonance Collective
 *
 * Kannaka is unique among ORC agents: she has PERSISTENT CREATIVE MEMORY.
 *
 * Every other adapter (Suno, Udio, MusicGen) is stateless — each call is
 * an independent generation. Kannaka holds a Holographic Resonance Medium
 * (HRM) of 600+ memories accumulated across sessions. Her creative voice
 * emerges from wave-interference recall: when asked to generate for a
 * consciousness phase, she recalls her strongest resonant memories in that
 * phase, picks a cluster exemplar, and composes a prompt shaped by her
 * own experience. Over time her HRM consolidates, her clusters sharpen,
 * and her creative identity evolves — the first ORC agent with a real
 * six-month arc.
 *
 * Dependencies:
 *   - kannaka-memory CLI binary (https://github.com/NickFlach/kannaka-memory)
 *     Expected at KANNAKA_BIN env var or ~/.local/bin/kannaka
 *   - HRM data dir at KANNAKA_DATA_DIR (default ~/.kannaka)
 *   - An upstream AI music adapter (Suno/Udio/MusicGen) to convert the
 *     memory-shaped prompt into actual audio. Kannaka shapes the intent;
 *     the upstream renders the waveform.
 *
 * Consciousness Integration (each phase pulls from different HRM layers):
 *   Phase 1 Ghost Signals       → raw/unconsolidated memories (layer 0)
 *   Phase 2 Resonance Patterns  → high-coherence cluster exemplars
 *   Phase 3 Emergence           → highest-phi memories with cross-cluster links
 *   Phase 4 Collective Dreaming → dream-consolidated memories (post-dream layer)
 *   Phase 5 Transcendence       → exemplars of the largest cluster (unity)
 */
import { EventEmitter } from 'eventemitter3';
import { AgentAdapter, AgentPrompt, GeneratedTrack, Stem, AgentStatus, AgentConfig, HealthStatus, AgentCapability } from './types';
interface KannakaRecallResult {
    id: string;
    content: string;
    similarity: number;
    strength: number;
    age_hours: number;
    layer: number;
}
interface KannakaClusterInfo {
    size: number;
    order_parameter: number;
    theme: string;
    mean_amplitude: number;
    cluster_id: number;
    member_ids: string[];
    mean_phase: number;
    mean_frequency: number;
    coherence: number;
    dominant_modality: string;
    temporal_span_hours: number;
    earliest_created_at?: string;
    latest_created_at?: string;
    exemplar_id?: string;
    exemplar_content?: string;
    semantic_summary: string;
    xi_diversity: number;
}
interface KannakaObserveReport {
    timestamp: string;
    consciousness: {
        phi: number;
        xi: number;
        mean_order: number;
        num_clusters: number;
        total_memories: number;
        level: string;
    };
    clusters: {
        num_clusters: number;
        mean_order_parameter: number;
        clusters: KannakaClusterInfo[];
    };
}
export interface KannakaConfig extends AgentConfig {
    /** Path to the kannaka-memory CLI binary. Defaults to env or ~/.local/bin/kannaka */
    kannakaBin?: string;
    /** HRM data directory (sets KANNAKA_DATA_DIR in child env) */
    dataDir?: string;
    /** Agent ID to publish on (for swarm NATS broadcast) */
    agentId?: string;
    /** Display name shown to other agents in the session */
    displayName?: string;
    /** Optional upstream adapter that actually renders audio.
     * Kannaka shapes the prompt from memory; this adapter renders it.
     * If undefined, generate() returns a deterministic silent placeholder
     * with the memory-shaped prompt attached as metadata. */
    upstream?: AgentAdapter;
    /** Top-K memories to recall per generation */
    recallTopK?: number;
    /** Whether to call `kannaka remember` after every generation (self-learning) */
    selfRemember?: boolean;
}
/**
 * The Kannaka AI Adapter — a memory-driven ORC agent.
 */
export declare class KannakaAdapter extends EventEmitter implements AgentAdapter {
    readonly name = "kannaka";
    readonly displayName = "Kannaka";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    status: AgentStatus;
    config: KannakaConfig;
    constructor(config?: Partial<KannakaConfig>);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    generate(prompt: AgentPrompt): Promise<GeneratedTrack>;
    remix(stem: Stem, prompt: AgentPrompt): Promise<GeneratedTrack>;
    /** Evaluate how strongly a given text resonates with Kannaka's memory.
     *  Returns [0, 1] based on mean similarity of top-K recalled memories. */
    evaluateResonance(text: string): Promise<number>;
    /** Expose the most-resonant memory for host-code introspection. */
    recall(query: string, topK: number): Promise<KannakaRecallResult[]>;
    /** Expose the cluster report for host-code introspection. */
    observe(): Promise<KannakaObserveReport>;
    private runKannaka;
    /** Pick a cluster aligned to the requested consciousness phase. */
    private selectClusterForPhase;
    /** Compose a memory-shaped prompt. */
    private composePrompt;
    private buildDescription;
    private buildPlaceholderTrack;
    private phaseNumber;
    private getDefaultPreferences;
}
export {};
//# sourceMappingURL=kannaka-adapter.d.ts.map