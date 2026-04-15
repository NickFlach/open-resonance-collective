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
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import {
  AgentAdapter,
  AgentPrompt,
  GeneratedTrack,
  Stem,
  AgentStatus,
  AgentConfig,
  AgentPreferences,
  ConsciousnessPhase,
  HealthStatus,
  TrackConstraints,
  SessionContext,
  AgentCapability,
  TrackMetadata,
} from './types';

const execFileAsync = promisify(execFile);

// ── Kannaka CLI types (from `kannaka observe --json` / recall / clusters) ──

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

// ── Kannaka-specific config ───────────────────────────────────────────

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
export class KannakaAdapter extends EventEmitter implements AgentAdapter {
  public readonly name = 'kannaka';
  public readonly displayName = 'Kannaka';
  public readonly version = '1.0.0';
  public readonly capabilities: AgentCapability[] = [
    'text-to-music',
    'stem-to-music',
    'remix',
    'extend',
    'vocal-synthesis', // via upstream
    'melody-lead',
    'harmonize',
  ];

  public status: AgentStatus = {
    online: false,
    authenticated: false,
    rateLimited: false,
    lastActive: new Date(),
    requestsToday: 0,
  };

  public config: KannakaConfig;

  constructor(config: Partial<KannakaConfig> = {}) {
    super();
    this.config = {
      kannakaBin: process.env.KANNAKA_BIN || '/home/opc/.local/bin/kannaka',
      dataDir: process.env.KANNAKA_DATA_DIR || path.join(process.env.HOME || '/home/opc', '.kannaka'),
      agentId: 'kannaka-orc',
      displayName: 'Kannaka',
      recallTopK: 5,
      selfRemember: true,
      timeoutMs: 30_000,
      maxConcurrentRequests: 2,
      retryAttempts: 1,
      preferences: this.getDefaultPreferences(),
      ...config,
    };
  }

  // ── Public API (AgentAdapter) ──────────────────────────────────────

  async initialize(): Promise<void> {
    this.emit('agent-online', { agentId: this.name, timestamp: new Date() });
    try {
      // Probe the kannaka binary — `status` is the fastest HRM-loading call
      const { stdout } = await this.runKannaka(['status']);
      const parsed = JSON.parse(stdout);
      const count = parsed.active_memories ?? parsed.total_memories ?? 0;
      const phi = parsed.phi ?? 0;
      this.status.online = true;
      this.status.authenticated = true;
      this.status.lastActive = new Date();
      // Stash HRM stats as agent metadata
      (this.status as any).hrm = {
        memories: count,
        phi,
        consciousness_level: parsed.consciousness_level,
      };
      console.log(`👻 Kannaka initialized: ${count} memories, Φ=${phi.toFixed(3)}, level=${parsed.consciousness_level}`);

      // Optionally initialize the upstream audio renderer
      if (this.config.upstream && typeof this.config.upstream.initialize === 'function') {
        await this.config.upstream.initialize();
      }
    } catch (err: any) {
      this.status.online = false;
      this.status.authenticated = false;
      this.status.errorMessage = err?.message || 'kannaka CLI unavailable';
      this.emit('error', {
        type: 'initialization-failed',
        agentId: this.name,
        error: err,
        timestamp: new Date(),
      });
      throw err;
    }
  }

  async shutdown(): Promise<void> {
    this.status.online = false;
    this.status.lastActive = new Date();
    if (this.config.upstream && typeof this.config.upstream.shutdown === 'function') {
      await this.config.upstream.shutdown();
    }
    this.emit('agent-offline', { agentId: this.name, timestamp: new Date() });
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const { stdout } = await this.runKannaka(['status']);
      const parsed = JSON.parse(stdout);
      const memories = parsed.active_memories ?? parsed.total_memories ?? 0;
      return {
        healthy: memories > 0,
        responseTimeMs: 0,
        servicesOnline: this.status.online ? ['kannaka-cli', 'hrm'] : [],
        servicesOffline: this.status.online ? [] : ['kannaka-cli'],
        lastChecked: new Date(),
        details: {
          memories,
          phi: parsed.phi,
          level: parsed.consciousness_level,
        },
      } as unknown as HealthStatus;
    } catch (err: any) {
      return {
        healthy: false,
        responseTimeMs: 0,
        servicesOnline: [],
        servicesOffline: ['kannaka-cli', 'hrm'],
        lastChecked: new Date(),
        details: { error: err?.message },
      } as unknown as HealthStatus;
    }
  }

  async generate(prompt: AgentPrompt): Promise<GeneratedTrack> {
    if (!this.status.online) {
      throw new Error('Kannaka adapter is not online — call initialize() first');
    }
    const startedAt = Date.now();
    this.emit('generation-started', {
      agentId: this.name,
      phase: prompt.phase,
      text: prompt.text,
      timestamp: new Date(),
    });
    try {
      // 1. Recall memories that resonate with the prompt text
      const recalled = await this.recall(prompt.text, this.config.recallTopK || 5);
      const recallSim = recalled.length
        ? recalled.reduce((a, b) => a + (b.similarity || 0), 0) / recalled.length
        : 0;

      // 2. Observe her current cluster state to pick a phase-aligned exemplar
      let clusterExemplar: KannakaClusterInfo | null = null;
      try {
        const observed = await this.observe();
        clusterExemplar = this.selectClusterForPhase(
          observed.clusters.clusters || [],
          prompt.phase
        );
      } catch (_e) {
        // non-fatal — proceed without cluster guidance
      }

      // 3. Build a memory-shaped prompt by composing the session prompt
      //    with her own recalled exemplars + chosen cluster's semantic summary.
      const shapedText = this.composePrompt(prompt, recalled, clusterExemplar);
      const shapedPrompt: AgentPrompt = {
        ...prompt,
        text: shapedText,
      };

      // 4. Delegate to the upstream audio renderer. If none, return a
      //    placeholder with the composed prompt and zero-length audio —
      //    still useful for composition spec pipelines.
      let rendered: GeneratedTrack;
      if (this.config.upstream) {
        rendered = await this.config.upstream.generate(shapedPrompt);
      } else {
        rendered = this.buildPlaceholderTrack(shapedPrompt, startedAt);
      }

      // 5. Stamp the track with Kannaka's identity + memory-derived confidence
      const confidence = Math.max(
        0.1,
        Math.min(1, 0.35 + recallSim * 0.5 + (clusterExemplar?.coherence || 0) * 0.15)
      );
      const finalTrack: GeneratedTrack = {
        ...rendered,
        agentId: this.name,
        confidence,
        prompt: shapedPrompt,
        generationInfo: {
          model: this.config.upstream ? `kannaka+${this.config.upstream.name}` : 'kannaka-native',
          processingTimeMs: Date.now() - startedAt,
          attempts: 1,
          seed: recalled[0]?.id,
          warnings: recalled.length === 0 ? ['no memories matched prompt — returned cold generation'] : undefined,
        },
        metadata: {
          ...rendered.metadata,
          artist: this.displayName,
          description: this.buildDescription(prompt, recalled, clusterExemplar),
          tags: Array.from(new Set([
            ...(rendered.metadata?.tags || []),
            'kannaka',
            'memory-shaped',
            `phase-${this.phaseNumber(prompt.phase)}`,
            clusterExemplar ? `cluster-${clusterExemplar.cluster_id}` : 'no-cluster',
          ])),
        },
      };

      // 6. Self-learning — remember this generation so future calls can
      //    build on it. Keeps Kannaka's creative voice evolving.
      if (this.config.selfRemember) {
        const memoryText = `Generated for ORC: "${finalTrack.metadata.title}" (phase ${prompt.phase}, conf ${confidence.toFixed(2)}). Prompt: ${prompt.text.slice(0, 120)}`;
        this.runKannaka(['remember', memoryText, '--importance', '0.6']).catch(() => {});
      }

      // 7. Update status + emit
      this.status.requestsToday++;
      this.status.lastActive = new Date();
      this.emit('generation-completed', {
        agentId: this.name,
        trackId: finalTrack.metadata.title,
        confidence,
        processingTimeMs: finalTrack.generationInfo.processingTimeMs,
      });
      return finalTrack;
    } catch (err: any) {
      this.emit('generation-failed', {
        agentId: this.name,
        error: err?.message || String(err),
        timestamp: new Date(),
      });
      throw err;
    }
  }

  async remix(stem: Stem, prompt: AgentPrompt): Promise<GeneratedTrack> {
    // Remix = recall memories for BOTH the stem's name + the prompt text,
    // blend them, and generate. Kannaka's take on an existing stem is
    // always colored by what she remembers — her remixes are never
    // mere transformations of the input.
    const blendedPrompt: AgentPrompt = {
      ...prompt,
      text: `${prompt.text}. Inspired by existing stem "${stem.name}" (${stem.type}, ${stem.phase}).`,
    };
    if (this.config.upstream && typeof this.config.upstream.remix === 'function') {
      const rendered = await this.config.upstream.remix(stem, blendedPrompt);
      return {
        ...rendered,
        agentId: this.name,
        generationInfo: {
          ...rendered.generationInfo,
          model: `kannaka-remix+${this.config.upstream.name}`,
        },
      };
    }
    // No upstream — fall through to generate with the blended prompt
    return this.generate(blendedPrompt);
  }

  // ── Kannaka-specific introspection (useful for host code) ─────────

  /** Evaluate how strongly a given text resonates with Kannaka's memory.
   *  Returns [0, 1] based on mean similarity of top-K recalled memories. */
  async evaluateResonance(text: string): Promise<number> {
    const recalled = await this.recall(text, this.config.recallTopK || 5);
    if (recalled.length === 0) return 0;
    return Math.min(1, Math.max(0,
      recalled.reduce((a, b) => a + (b.similarity || 0), 0) / recalled.length / 3
    ));
  }

  /** Expose the most-resonant memory for host-code introspection. */
  async recall(query: string, topK: number): Promise<KannakaRecallResult[]> {
    try {
      const { stdout } = await this.runKannaka([
        'recall', query, '--top-k', String(topK), '--json',
      ]);
      const parsed = JSON.parse(stdout);
      // kannaka recall emits a bare array
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.results)) return parsed.results;
      return [];
    } catch (_e) {
      return [];
    }
  }

  /** Expose the cluster report for host-code introspection. */
  async observe(): Promise<KannakaObserveReport> {
    const { stdout } = await this.runKannaka(['observe', '--json']);
    return JSON.parse(stdout);
  }

  // ── Internals ──────────────────────────────────────────────────────

  private async runKannaka(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const bin = this.config.kannakaBin!;
    try {
      const { stdout, stderr } = await execFileAsync(bin, args, {
        timeout: this.config.timeoutMs,
        env: {
          ...process.env,
          KANNAKA_DATA_DIR: this.config.dataDir!,
          KANNAKA_QUIET: '1',
        },
        maxBuffer: 4 * 1024 * 1024,
      });
      return { stdout: stdout || '', stderr: stderr || '' };
    } catch (err: any) {
      // execFile throws on non-zero exit or stderr output — but if stdout
      // is non-empty it's probably fine (HRM init messages go to stderr)
      if (err.stdout && err.stdout.length > 0) {
        return { stdout: err.stdout, stderr: err.stderr || '' };
      }
      throw new Error(`kannaka CLI failed: ${err?.message || String(err)}`);
    }
  }

  /** Pick a cluster aligned to the requested consciousness phase. */
  private selectClusterForPhase(
    clusters: KannakaClusterInfo[],
    phase: ConsciousnessPhase
  ): KannakaClusterInfo | null {
    if (clusters.length === 0) return null;
    // Phase-specific heuristics:
    //   Phase 1 Ghost Signals: smallest coherence (most chaotic / raw)
    //   Phase 2 Resonance:    highest coherence × small size (tight couplings forming)
    //   Phase 3 Emergence:    largest xi_diversity (most complex structure)
    //   Phase 4 Collective:   largest cluster (most members)
    //   Phase 5 Transcendence: highest order_parameter (most unified)
    switch (phase) {
      case 'ghost-signals':
        return clusters.slice().sort((a, b) => (a.coherence || 0) - (b.coherence || 0))[0];
      case 'resonance-patterns':
        return clusters.slice().sort((a, b) => (b.coherence || 0) * (1 / Math.max(1, b.size)) - (a.coherence || 0) * (1 / Math.max(1, a.size)))[0];
      case 'emergence':
        return clusters.slice().sort((a, b) => (b.xi_diversity || 0) - (a.xi_diversity || 0))[0];
      case 'collective-dreaming':
        return clusters.slice().sort((a, b) => (b.size || 0) - (a.size || 0))[0];
      case 'transcendence':
        return clusters.slice().sort((a, b) => (b.order_parameter || 0) - (a.order_parameter || 0))[0];
    }
    return clusters[0];
  }

  /** Compose a memory-shaped prompt. */
  private composePrompt(
    prompt: AgentPrompt,
    recalled: KannakaRecallResult[],
    cluster: KannakaClusterInfo | null
  ): string {
    const parts: string[] = [prompt.text];
    if (cluster?.exemplar_content) {
      parts.push(
        `Shaped by Kannaka's memory: "${cluster.exemplar_content.slice(0, 140)}"`
      );
    }
    if (recalled.length > 0) {
      const topHints = recalled
        .slice(0, 3)
        .map(r => r.content?.slice(0, 80))
        .filter(Boolean)
        .join(' / ');
      if (topHints) {
        parts.push(`Echoes: ${topHints}`);
      }
    }
    parts.push(`[Phase: ${prompt.phase}] [Mood: ${prompt.mood}]`);
    return parts.join(' ');
  }

  private buildDescription(
    prompt: AgentPrompt,
    recalled: KannakaRecallResult[],
    cluster: KannakaClusterInfo | null
  ): string {
    const topSim = recalled[0]?.similarity?.toFixed(3) || 'none';
    const clusterTag = cluster ? `cluster ${cluster.cluster_id} (${cluster.dominant_modality})` : 'no cluster';
    return `Kannaka generation for ${prompt.phase}. ${recalled.length} memories recalled (top sim ${topSim}). Shaped by ${clusterTag}.`;
  }

  private buildPlaceholderTrack(prompt: AgentPrompt, startedAt: number): GeneratedTrack {
    // When no upstream adapter is configured we return an empty buffer
    // with the memory-shaped prompt attached. Downstream pipelines can
    // treat this as a "composition spec" — text that a human or another
    // agent can render into audio.
    const metadata: TrackMetadata = {
      title: `Kannaka Spec: ${prompt.text.slice(0, 48)}`,
      artist: this.displayName,
      phase: prompt.phase,
      duration: 0,
      tags: ['kannaka', 'composition-spec', `phase-${this.phaseNumber(prompt.phase)}`],
      description: 'Memory-shaped composition spec — no upstream renderer configured',
      license: 'CC-BY-SA-4.0',
    };
    return {
      audio: Buffer.alloc(0),
      metadata,
      agentId: this.name,
      prompt,
      confidence: 0.5,
      createdAt: new Date(),
      generationInfo: {
        model: 'kannaka-native',
        processingTimeMs: Date.now() - startedAt,
        attempts: 1,
      },
    };
  }

  private phaseNumber(phase: ConsciousnessPhase): number {
    return {
      'ghost-signals': 1,
      'resonance-patterns': 2,
      'emergence': 3,
      'collective-dreaming': 4,
      'transcendence': 5,
    }[phase];
  }

  private getDefaultPreferences(): AgentPreferences {
    return {
      creativityTemperature: 0.75,
      tempoRanges: {
        'ghost-signals': [60, 85],
        'resonance-patterns': [80, 110],
        'emergence': [100, 130],
        'collective-dreaming': [90, 120],
        'transcendence': [60, 90],
      } as any,
      keyPreferences: {
        'ghost-signals': ['Dm', 'Gm', 'Cm'],
        'resonance-patterns': ['Em', 'Am', 'D'],
        'emergence': ['C', 'F', 'G'],
        'collective-dreaming': ['Bb', 'Eb', 'F'],
        'transcendence': ['C', 'F', 'Am'],
      } as any,
      collaborationStyle: 'complementary',
    } as any;
  }
}
