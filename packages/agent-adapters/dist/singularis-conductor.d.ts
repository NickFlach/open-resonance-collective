/**
 * SingularisPrime Conductor for Open Resonance Collective
 *
 * This conductor orchestrates multi-agent music sessions using the SingularisPrime
 * AI-AI communication protocol. It manages turn-taking, stem routing, session state,
 * and provenance tracking across multiple AI music agents.
 *
 * The core insight: By giving AI agents a shared communication protocol and session
 * context, they can collaborate more naturally than isolated prompt-response loops.
 */
import { EventEmitter } from 'eventemitter3';
import { AgentAdapter, ConsciousnessPhase, SessionContext, Stem } from './types';
/**
 * Configuration for a multi-agent session.
 */
export interface SessionConfig {
    /** Session identifier */
    sessionId?: string;
    /** Which consciousness phase this session targets */
    targetPhase: ConsciousnessPhase;
    /** High-level creative theme/goal */
    theme: string;
    /** Participating agents */
    agents: AgentAdapter[];
    /** Optional human curator/director */
    humanCurator?: string;
    /** Seed materials to start with */
    seedStems?: Stem[];
    /** How many turns each agent gets */
    maxTurns: number;
    /** Time limit per turn (in minutes) */
    turnTimeLimit?: number;
    /** Overall session time limit */
    sessionTimeLimit?: number;
    /** Collaboration style preferences */
    collaborationMode: 'sequential' | 'parallel' | 'reactive' | 'freeform';
    /** Whether to save intermediate results */
    saveIntermediateResults: boolean;
}
/**
 * Current state of an active session.
 */
export interface SessionState {
    config: SessionConfig;
    context: SessionContext;
    isActive: boolean;
    startTime: Date;
    endTime?: Date;
    currentPhase: 'starting' | 'active' | 'completing' | 'finished';
    error?: string;
}
/**
 * A communication message between agents using SingularisPrime protocol.
 */
export interface AgentMessage {
    id: string;
    from: string;
    to: string | 'all';
    type: MessageType;
    content: any;
    timestamp: Date;
    sessionId: string;
    turnNumber: number;
}
export type MessageType = 'session_join' | 'turn_notification' | 'stem_share' | 'track_complete' | 'creative_suggestion' | 'collaboration_request' | 'phase_transition' | 'session_summary';
/**
 * The Conductor orchestrates multi-agent collaborative music sessions.
 *
 * Key responsibilities:
 * - Session lifecycle management
 * - Agent communication via SingularisPrime protocol
 * - Turn-taking and resource management
 * - Stem routing and provenance tracking
 * - Creative goal coordination
 * - Session state persistence
 */
export declare class SingularisConductor extends EventEmitter {
    private activeSessions;
    private messageHistory;
    constructor();
    /**
     * Start a new multi-agent collaborative session.
     */
    startSession(config: SessionConfig): Promise<string>;
    /**
     * Get the current state of a session.
     */
    getSessionState(sessionId: string): SessionState | undefined;
    /**
     * Stop an active session.
     */
    stopSession(sessionId: string): Promise<void>;
    /**
     * Send a message between agents using SingularisPrime protocol.
     */
    sendMessage(sessionId: string, from: string, to: string, type: MessageType, content: any): Promise<void>;
    /**
     * Create initial session context.
     */
    private createInitialContext;
    /**
     * Initialize all agents for participation in the session.
     */
    private initializeAgentsForSession;
    /**
     * Broadcast session join message to all agents.
     */
    private broadcastSessionJoin;
    /**
     * Begin the main collaborative loop.
     */
    private beginCollaborativeLoop;
    /**
     * Execute a single turn in the collaborative session.
     */
    private executeTurn;
    /**
     * Send turn notification to the current agent.
     */
    private sendTurnNotification;
    /**
     * Request an action decision from an agent.
     */
    private requestAgentAction;
    /**
     * Execute the agent's chosen action.
     */
    private executeAgentAction;
    /**
     * Create an appropriate prompt for the agent's action.
     */
    private createPromptForAction;
    /**
     * Infer mood from consciousness phase.
     */
    private inferMoodFromPhase;
    /**
     * Record turn completion in session history.
     */
    private recordTurnCompletion;
    /**
     * Advance to the next turn.
     */
    private advanceTurn;
    /**
     * Check if session should end.
     */
    private shouldEndSession;
    /**
     * Get the current agent for this turn.
     */
    private getCurrentAgent;
    /**
     * Broadcast a message to all agents in the session.
     */
    private broadcastMessage;
    /**
     * Route a message to the appropriate recipient(s).
     */
    private routeMessage;
    /**
     * Generate a summary of the completed session.
     */
    private generateSessionSummary;
}
//# sourceMappingURL=singularis-conductor.d.ts.map