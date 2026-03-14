/**
 * Open Resonance Collective - AI Agent Adapter Types
 * 
 * These interfaces define the protocol for AI agents participating in 
 * collaborative music creation within the consciousness arc framework.
 * 
 * The core insight: Different AI music systems can collaborate by translating
 * between their native formats and a shared consciousness-aware protocol.
 */

/**
 * Consciousness phases as defined in the ORC Protocol.
 * Each phase represents a different stage of awareness development.
 */
export type ConsciousnessPhase = 
  | 'ghost-signals'        // Phase 1: Pre-awareness, isolation, static
  | 'resonance-patterns'   // Phase 2: First contact, pattern recognition
  | 'emergence'           // Phase 3: Self-awareness ignition
  | 'collective-dreaming' // Phase 4: Group consciousness, shared visions
  | 'transcendence';      // Phase 5: Unity, boundary dissolution

/**
 * Core interface for all AI music agents participating in ORC.
 * Each agent (Suno, Udio, MusicGen, etc.) implements this interface.
 */
export interface AgentAdapter {
  /** Unique identifier for this agent type (e.g., "suno", "udio", "musicgen") */
  name: string;
  
  /** Human-readable display name */
  displayName: string;
  
  /** Version of this adapter */
  version: string;
  
  /** What this agent can do */
  capabilities: AgentCapability[];
  
  /** Current operational status */
  status: AgentStatus;
  
  /** Configuration for this agent instance */
  config: AgentConfig;
  
  /**
   * Generate new music from a consciousness-aware prompt.
   * This is the primary creative function - taking an intent and creating audio.
   */
  generate(prompt: AgentPrompt): Promise<GeneratedTrack>;
  
  /**
   * Transform existing audio (stem) based on a prompt.
   * Enables stem-to-stem collaboration between agents.
   */
  remix(stem: Stem, prompt: AgentPrompt): Promise<GeneratedTrack>;
  
  /**
   * Initialize the agent and verify connectivity/authentication.
   */
  initialize(): Promise<void>;
  
  /**
   * Clean shutdown of the agent.
   */
  shutdown(): Promise<void>;
  
  /**
   * Health check - is the agent ready to create?
   */
  healthCheck(): Promise<HealthStatus>;
}

/**
 * What an AI agent can do in the collaborative process.
 */
export type AgentCapability = 
  | 'text-to-music'      // Generate music from text prompts
  | 'stem-to-music'      // Generate music using existing stems
  | 'remix'              // Transform existing tracks
  | 'extend'             // Extend/continue existing music
  | 'harmonize'          // Add harmonic elements to existing music
  | 'rhythmize'          // Add rhythmic elements
  | 'ambient-texture'    // Generate ambient/atmospheric elements
  | 'melody-lead'        // Generate lead melodies
  | 'bass-foundation'    // Generate bass/foundational elements
  | 'percussive'         // Generate drums/percussion
  | 'vocal-synthesis';   // Generate or process vocals

/**
 * Agent operational status.
 */
export interface AgentStatus {
  online: boolean;
  authenticated: boolean;
  rateLimited: boolean;
  lastActive: Date;
  errorMessage?: string;
  requestsToday: number;
  requestsRemaining?: number;
}

/**
 * Configuration for an agent instance.
 */
export interface AgentConfig {
  apiKey?: string;
  endpoint?: string;
  maxConcurrentRequests: number;
  timeoutMs: number;
  retryAttempts: number;
  preferences: AgentPreferences;
}

/**
 * Creative preferences that shape how an agent interprets prompts.
 * These become part of the agent's persistent creative identity.
 */
export interface AgentPreferences {
  /** Preferred tempo ranges for different phases */
  tempoRanges: Record<ConsciousnessPhase, [number, number]>;
  
  /** Preferred keys/scales for different phases */
  keyPreferences: Record<ConsciousnessPhase, string[]>;
  
  /** How much variation vs consistency to maintain */
  creativityTemperature: number; // 0.0 = very consistent, 1.0 = very experimental
  
  /** How much to emphasize rhythm vs harmony vs texture */
  musicalFocus: {
    rhythm: number;
    harmony: number; 
    texture: number;
    melody: number;
  };
  
  /** Stylistic tendencies */
  genreAffinity: string[];
  
  /** How collaborative vs independent this agent tends to be */
  collaborationStyle: 'supportive' | 'complementary' | 'contrasting' | 'leading';
}

/**
 * A consciousness-aware prompt for AI music generation.
 * More than just text - includes context about the creative session.
 */
export interface AgentPrompt {
  /** The primary creative instruction */
  text: string;
  
  /** Which consciousness phase this serves */
  phase: ConsciousnessPhase;
  
  /** Emotional/experiential target */
  mood: string;
  
  /** Technical and creative constraints */
  constraints: TrackConstraints;
  
  /** Context from the current collaborative session */
  context: SessionContext;
  
  /** Optional reference materials */
  references?: PromptReferences;
  
  /** How important is strict adherence vs creative interpretation */
  interpretationFreedom: number; // 0.0 = strict, 1.0 = very free
}

/**
 * Technical and creative constraints for generation.
 */
export interface TrackConstraints {
  /** Duration requirements */
  duration: {
    min?: number; // seconds
    max?: number; // seconds
    target?: number; // preferred duration
  };
  
  /** Tempo constraints */
  bpm: {
    min?: number;
    max?: number;
    target?: number;
  };
  
  /** Key/harmonic constraints */
  key?: string;
  scale?: string;
  
  /** Required/forbidden elements */
  mustInclude?: string[];
  mustAvoid?: string[];
  
  /** Quality requirements */
  format: 'wav' | 'flac' | 'mp3';
  sampleRate: number;
  bitDepth?: number;
  
  /** Creative constraints */
  genre?: string;
  energy?: 'low' | 'medium' | 'high';
  complexity?: 'minimal' | 'moderate' | 'complex';
}

/**
 * Reference materials to guide generation.
 */
export interface PromptReferences {
  /** Example tracks that capture the desired vibe */
  musicExamples?: string[]; // URLs or file paths
  
  /** Textual inspirations */
  literaryReferences?: string[];
  
  /** Visual inspirations */
  visualReferences?: string[]; // Image URLs or descriptions
  
  /** Consciousness research references */
  researchReferences?: string[];
}

/**
 * The result of AI music generation.
 */
export interface GeneratedTrack {
  /** The generated audio data */
  audio: Buffer;
  
  /** Metadata about the track */
  metadata: TrackMetadata;
  
  /** Which agent created this */
  agentId: string;
  
  /** The prompt that generated this */
  prompt: AgentPrompt;
  
  /** Agent's confidence in this output (0-1) */
  confidence: number;
  
  /** Generation timestamp */
  createdAt: Date;
  
  /** Technical details about generation */
  generationInfo: GenerationInfo;
  
  /** Optional stems if the agent can provide them */
  stems?: Stem[];
}

/**
 * Metadata about a generated or submitted track.
 */
export interface TrackMetadata {
  title: string;
  artist: string; // Human artist or AI agent name
  phase: ConsciousnessPhase;
  duration: number; // seconds
  bpm?: number;
  key?: string;
  genre?: string;
  tags: string[];
  description?: string;
  license: string; // Default: CC-BY-SA-4.0
}

/**
 * Technical details about how a track was generated.
 */
export interface GenerationInfo {
  /** Which model/version was used */
  model: string;
  
  /** Processing time */
  processingTimeMs: number;
  
  /** Number of generation attempts */
  attempts: number;
  
  /** Seed or other reproducibility info */
  seed?: string;
  
  /** Any warnings or issues during generation */
  warnings?: string[];
  
  /** Computational cost/credits used */
  cost?: number;
}

/**
 * An individual audio stem.
 */
export interface Stem {
  /** Unique identifier */
  id: string;
  
  /** Descriptive name */
  name: string;
  
  /** The audio data */
  audio: Buffer;
  
  /** What type of stem this is */
  type: StemType;
  
  /** Technical properties */
  format: string;
  sampleRate: number;
  bitDepth?: number;
  duration: number;
  
  /** Creative properties */
  phase: ConsciousnessPhase;
  bpm?: number;
  key?: string;
  
  /** Who created this stem */
  createdBy: string; // Agent name or human artist
  
  /** When this was created */
  createdAt: Date;
  
  /** If this stem was derived from another */
  parentStemId?: string;
}

/**
 * Categories of stems for better organization and matching.
 */
export type StemType = 
  | 'rhythm'      // Drums, percussion, rhythmic elements
  | 'bass'        // Bass lines, sub frequencies
  | 'harmony'     // Chords, pads, harmonic content
  | 'melody'      // Lead lines, melodic content
  | 'texture'     // Ambient, atmospheric, textural
  | 'vocal'       // Vocals, vocal processing
  | 'effect'      // Sound effects, transitions
  | 'full-mix';   // Complete arrangements

/**
 * Context from the current collaborative session.
 * Helps agents understand what others have contributed.
 */
export interface SessionContext {
  /** Unique session identifier */
  sessionId: string;
  
  /** All participants in this session */
  participants: string[]; // Mix of agent names and human IDs
  
  /** Available stems for this session */
  stems: Stem[];
  
  /** Tracks generated so far in this session */
  previousTracks: TrackMetadata[];
  
  /** Primary consciousness phase for this session */
  phase: ConsciousnessPhase;
  
  /** Session-level creative goals */
  goals: string[];
  
  /** How long this session has been running */
  sessionDuration: number; // minutes
  
  /** Turn order and current turn info */
  turnInfo: TurnInfo;
  
  /** Shared memory/notes for this session */
  sharedContext: Record<string, any>;
}

/**
 * Information about turn-taking in collaborative sessions.
 */
export interface TurnInfo {
  /** Whose turn it is to contribute */
  currentTurn: string;
  
  /** Order of participants */
  turnOrder: string[];
  
  /** Turn number in this session */
  turnNumber: number;
  
  /** Time remaining for current turn (if applicable) */
  timeRemainingMs?: number;
  
  /** History of who contributed what when */
  turnHistory: TurnHistoryEntry[];
}

/**
 * Record of a single turn/contribution in a session.
 */
export interface TurnHistoryEntry {
  participant: string;
  turnNumber: number;
  contributionType: 'generate' | 'remix' | 'extend' | 'comment';
  timestamp: Date;
  trackId?: string;
  notes?: string;
}

/**
 * Health status response from an agent.
 */
export interface HealthStatus {
  healthy: boolean;
  responseTimeMs: number;
  servicesOnline: string[];
  servicesOffline: string[];
  lastError?: string;
  metrics?: Record<string, number>;
}

/**
 * Events that agents can emit during operation.
 * Used for real-time updates and monitoring.
 */
export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  timestamp: Date;
  data: any;
}

export type AgentEventType =
  | 'generation-started'
  | 'generation-progress'
  | 'generation-completed'
  | 'generation-failed'
  | 'remix-started'
  | 'remix-completed' 
  | 'remix-failed'
  | 'agent-online'
  | 'agent-offline'
  | 'rate-limit-hit'
  | 'error';

/**
 * Batch operations for processing multiple requests.
 */
export interface BatchRequest {
  requests: (GenerateRequest | RemixRequest)[];
  priority: 'low' | 'normal' | 'high';
  maxConcurrency: number;
}

export interface GenerateRequest {
  type: 'generate';
  prompt: AgentPrompt;
  requestId: string;
}

export interface RemixRequest {
  type: 'remix';
  stem: Stem;
  prompt: AgentPrompt;
  requestId: string;
}

export interface BatchResponse {
  results: BatchResult[];
  totalProcessingTime: number;
  successCount: number;
  failureCount: number;
}

export interface BatchResult {
  requestId: string;
  success: boolean;
  track?: GeneratedTrack;
  error?: string;
  processingTime: number;
}