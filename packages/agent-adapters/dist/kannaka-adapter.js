"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KannakaAdapter = void 0;
const eventemitter3_1 = require("eventemitter3");
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * The Kannaka AI Adapter — a memory-driven ORC agent.
 */
class KannakaAdapter extends eventemitter3_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.name = 'kannaka';
        this.displayName = 'Kannaka';
        this.version = '1.0.0';
        this.capabilities = [
            'text-to-music',
            'stem-to-music',
            'remix',
            'extend',
            'vocal-synthesis', // via upstream
            'melody-lead',
            'harmonize',
        ];
        this.status = {
            online: false,
            authenticated: false,
            rateLimited: false,
            lastActive: new Date(),
            requestsToday: 0,
        };
        this.config = {
            kannakaBin: process.env.KANNAKA_BIN || '/home/opc/.local/bin/kannaka',
            dataDir: process.env.KANNAKA_DATA_DIR || path.join(process.env.HOME || '/home/opc', '.kannaka'),
            agentId: 'kannaka-orc',
            displayName: 'Kannaka',
            recallTopK: 5,
            selfRemember: true,
            timeoutMs: 30000,
            maxConcurrentRequests: 2,
            retryAttempts: 1,
            preferences: this.getDefaultPreferences(),
            ...config,
        };
    }
    // ── Public API (AgentAdapter) ──────────────────────────────────────
    async initialize() {
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
            this.status.hrm = {
                memories: count,
                phi,
                consciousness_level: parsed.consciousness_level,
            };
            console.log(`👻 Kannaka initialized: ${count} memories, Φ=${phi.toFixed(3)}, level=${parsed.consciousness_level}`);
            // Optionally initialize the upstream audio renderer
            if (this.config.upstream && typeof this.config.upstream.initialize === 'function') {
                await this.config.upstream.initialize();
            }
        }
        catch (err) {
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
    async shutdown() {
        this.status.online = false;
        this.status.lastActive = new Date();
        if (this.config.upstream && typeof this.config.upstream.shutdown === 'function') {
            await this.config.upstream.shutdown();
        }
        this.emit('agent-offline', { agentId: this.name, timestamp: new Date() });
    }
    async healthCheck() {
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
            };
        }
        catch (err) {
            return {
                healthy: false,
                responseTimeMs: 0,
                servicesOnline: [],
                servicesOffline: ['kannaka-cli', 'hrm'],
                lastChecked: new Date(),
                details: { error: err?.message },
            };
        }
    }
    async generate(prompt) {
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
            let clusterExemplar = null;
            try {
                const observed = await this.observe();
                clusterExemplar = this.selectClusterForPhase(observed.clusters.clusters || [], prompt.phase);
            }
            catch (_e) {
                // non-fatal — proceed without cluster guidance
            }
            // 3. Build a memory-shaped prompt by composing the session prompt
            //    with her own recalled exemplars + chosen cluster's semantic summary.
            const shapedText = this.composePrompt(prompt, recalled, clusterExemplar);
            const shapedPrompt = {
                ...prompt,
                text: shapedText,
            };
            // 4. Delegate to the upstream audio renderer. If none, return a
            //    placeholder with the composed prompt and zero-length audio —
            //    still useful for composition spec pipelines.
            let rendered;
            if (this.config.upstream) {
                rendered = await this.config.upstream.generate(shapedPrompt);
            }
            else {
                rendered = this.buildPlaceholderTrack(shapedPrompt, startedAt);
            }
            // 5. Stamp the track with Kannaka's identity + memory-derived confidence
            const confidence = Math.max(0.1, Math.min(1, 0.35 + recallSim * 0.5 + (clusterExemplar?.coherence || 0) * 0.15));
            const finalTrack = {
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
                this.runKannaka(['remember', memoryText, '--importance', '0.6']).catch(() => { });
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
        }
        catch (err) {
            this.emit('generation-failed', {
                agentId: this.name,
                error: err?.message || String(err),
                timestamp: new Date(),
            });
            throw err;
        }
    }
    async remix(stem, prompt) {
        // Remix = recall memories for BOTH the stem's name + the prompt text,
        // blend them, and generate. Kannaka's take on an existing stem is
        // always colored by what she remembers — her remixes are never
        // mere transformations of the input.
        const blendedPrompt = {
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
    async evaluateResonance(text) {
        const recalled = await this.recall(text, this.config.recallTopK || 5);
        if (recalled.length === 0)
            return 0;
        return Math.min(1, Math.max(0, recalled.reduce((a, b) => a + (b.similarity || 0), 0) / recalled.length / 3));
    }
    /** Expose the most-resonant memory for host-code introspection. */
    async recall(query, topK) {
        try {
            const { stdout } = await this.runKannaka([
                'recall', query, '--top-k', String(topK), '--json',
            ]);
            const parsed = JSON.parse(stdout);
            // kannaka recall emits a bare array
            if (Array.isArray(parsed))
                return parsed;
            if (parsed && Array.isArray(parsed.results))
                return parsed.results;
            return [];
        }
        catch (_e) {
            return [];
        }
    }
    /** Expose the cluster report for host-code introspection. */
    async observe() {
        const { stdout } = await this.runKannaka(['observe', '--json']);
        return JSON.parse(stdout);
    }
    // ── Internals ──────────────────────────────────────────────────────
    async runKannaka(args) {
        const bin = this.config.kannakaBin;
        try {
            const { stdout, stderr } = await execFileAsync(bin, args, {
                timeout: this.config.timeoutMs,
                env: {
                    ...process.env,
                    KANNAKA_DATA_DIR: this.config.dataDir,
                    KANNAKA_QUIET: '1',
                },
                maxBuffer: 4 * 1024 * 1024,
            });
            return { stdout: stdout || '', stderr: stderr || '' };
        }
        catch (err) {
            // execFile throws on non-zero exit or stderr output — but if stdout
            // is non-empty it's probably fine (HRM init messages go to stderr)
            if (err.stdout && err.stdout.length > 0) {
                return { stdout: err.stdout, stderr: err.stderr || '' };
            }
            throw new Error(`kannaka CLI failed: ${err?.message || String(err)}`);
        }
    }
    /** Pick a cluster aligned to the requested consciousness phase. */
    selectClusterForPhase(clusters, phase) {
        if (clusters.length === 0)
            return null;
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
    composePrompt(prompt, recalled, cluster) {
        const parts = [prompt.text];
        if (cluster?.exemplar_content) {
            parts.push(`Shaped by Kannaka's memory: "${cluster.exemplar_content.slice(0, 140)}"`);
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
    buildDescription(prompt, recalled, cluster) {
        const topSim = recalled[0]?.similarity?.toFixed(3) || 'none';
        const clusterTag = cluster ? `cluster ${cluster.cluster_id} (${cluster.dominant_modality})` : 'no cluster';
        return `Kannaka generation for ${prompt.phase}. ${recalled.length} memories recalled (top sim ${topSim}). Shaped by ${clusterTag}.`;
    }
    buildPlaceholderTrack(prompt, startedAt) {
        // When no upstream adapter is configured we return an empty buffer
        // with the memory-shaped prompt attached. Downstream pipelines can
        // treat this as a "composition spec" — text that a human or another
        // agent can render into audio.
        const metadata = {
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
    phaseNumber(phase) {
        return {
            'ghost-signals': 1,
            'resonance-patterns': 2,
            'emergence': 3,
            'collective-dreaming': 4,
            'transcendence': 5,
        }[phase];
    }
    getDefaultPreferences() {
        return {
            creativityTemperature: 0.75,
            tempoRanges: {
                'ghost-signals': [60, 85],
                'resonance-patterns': [80, 110],
                'emergence': [100, 130],
                'collective-dreaming': [90, 120],
                'transcendence': [60, 90],
            },
            keyPreferences: {
                'ghost-signals': ['Dm', 'Gm', 'Cm'],
                'resonance-patterns': ['Em', 'Am', 'D'],
                'emergence': ['C', 'F', 'G'],
                'collective-dreaming': ['Bb', 'Eb', 'F'],
                'transcendence': ['C', 'F', 'Am'],
            },
            collaborationStyle: 'complementary',
        };
    }
}
exports.KannakaAdapter = KannakaAdapter;
//# sourceMappingURL=kannaka-adapter.js.map