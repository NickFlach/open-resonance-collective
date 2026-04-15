"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingularisConductor = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
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
class SingularisConductor extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.activeSessions = new Map();
        this.messageHistory = new Map();
        console.log('🎭 SingularisPrime Conductor initialized');
    }
    /**
     * Start a new multi-agent collaborative session.
     */
    async startSession(config) {
        const sessionId = config.sessionId || (0, uuid_1.v4)();
        console.log(`🎵 Starting collaborative session: ${sessionId}`);
        console.log(`🎯 Theme: ${config.theme}`);
        console.log(`🧠 Phase: ${config.targetPhase}`);
        console.log(`🤖 Agents: ${config.agents.map(a => a.displayName).join(', ')}`);
        // Initialize session state
        const sessionState = {
            config: { ...config, sessionId },
            context: this.createInitialContext(sessionId, config),
            isActive: true,
            startTime: new Date(),
            currentPhase: 'starting'
        };
        this.activeSessions.set(sessionId, sessionState);
        this.messageHistory.set(sessionId, []);
        try {
            // Initialize all agents for the session
            await this.initializeAgentsForSession(sessionState);
            // Send session join messages to all agents
            await this.broadcastSessionJoin(sessionState);
            // Begin the collaborative process
            sessionState.currentPhase = 'active';
            await this.beginCollaborativeLoop(sessionState);
            this.emit('session-started', { sessionId, config });
            return sessionId;
        }
        catch (error) {
            sessionState.isActive = false;
            sessionState.error = error instanceof Error ? error.message : 'Unknown error';
            sessionState.currentPhase = 'finished';
            this.emit('session-failed', { sessionId, error: sessionState.error });
            throw error;
        }
    }
    /**
     * Get the current state of a session.
     */
    getSessionState(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    /**
     * Stop an active session.
     */
    async stopSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.isActive) {
            throw new Error(`Session ${sessionId} is not active`);
        }
        console.log(`🛑 Stopping session: ${sessionId}`);
        session.isActive = false;
        session.endTime = new Date();
        session.currentPhase = 'completing';
        // Send completion notification to all agents
        await this.broadcastMessage(session, {
            type: 'session_summary',
            content: {
                status: 'completed',
                totalTracks: session.context.previousTracks.length,
                totalStems: session.context.stems.length,
                duration: Date.now() - session.startTime.getTime()
            }
        });
        session.currentPhase = 'finished';
        this.emit('session-completed', {
            sessionId,
            summary: this.generateSessionSummary(session)
        });
    }
    /**
     * Send a message between agents using SingularisPrime protocol.
     */
    async sendMessage(sessionId, from, to, type, content) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const message = {
            id: (0, uuid_1.v4)(),
            from,
            to,
            type,
            content,
            timestamp: new Date(),
            sessionId,
            turnNumber: session.context.turnInfo.turnNumber
        };
        // Store message in history
        const history = this.messageHistory.get(sessionId) || [];
        history.push(message);
        this.messageHistory.set(sessionId, history);
        // Route message to recipient(s)
        await this.routeMessage(session, message);
        this.emit('message-sent', message);
    }
    // Private Implementation Methods
    /**
     * Create initial session context.
     */
    createInitialContext(sessionId, config) {
        const participants = config.agents.map(agent => agent.name);
        if (config.humanCurator) {
            participants.push(config.humanCurator);
        }
        return {
            sessionId,
            participants,
            stems: config.seedStems || [],
            previousTracks: [],
            phase: config.targetPhase,
            goals: [config.theme],
            sessionDuration: 0,
            turnInfo: {
                currentTurn: participants[0],
                turnOrder: participants,
                turnNumber: 1,
                timeRemainingMs: config.turnTimeLimit ? config.turnTimeLimit * 60000 : undefined,
                turnHistory: []
            },
            sharedContext: {
                theme: config.theme,
                targetPhase: config.targetPhase,
                collaborationStyle: config.collaborationMode
            }
        };
    }
    /**
     * Initialize all agents for participation in the session.
     */
    async initializeAgentsForSession(session) {
        console.log('🔧 Initializing agents for session...');
        for (const agent of session.config.agents) {
            try {
                // Ensure agent is online and ready
                const health = await agent.healthCheck();
                if (!health.healthy) {
                    throw new Error(`Agent ${agent.name} is not healthy: ${health.lastError}`);
                }
                console.log(`✅ Agent ${agent.displayName} initialized`);
            }
            catch (error) {
                console.error(`❌ Failed to initialize agent ${agent.displayName}:`, error);
                throw error;
            }
        }
    }
    /**
     * Broadcast session join message to all agents.
     */
    async broadcastSessionJoin(session) {
        const joinMessage = {
            type: 'session_join',
            content: {
                sessionId: session.context.sessionId,
                theme: session.config.theme,
                targetPhase: session.config.targetPhase,
                participants: session.context.participants,
                turnOrder: session.context.turnInfo.turnOrder,
                seedStems: session.context.stems.map(s => ({ id: s.id, name: s.name, type: s.type }))
            }
        };
        await this.broadcastMessage(session, joinMessage);
        console.log('📢 Session join broadcast sent to all agents');
    }
    /**
     * Begin the main collaborative loop.
     */
    async beginCollaborativeLoop(session) {
        console.log('🔄 Beginning collaborative loop...');
        while (session.isActive && session.context.turnInfo.turnNumber <= session.config.maxTurns) {
            await this.executeTurn(session);
            // Check if session should continue
            if (this.shouldEndSession(session)) {
                break;
            }
            // Advance to next turn
            this.advanceTurn(session);
            // Update session duration
            session.context.sessionDuration = Math.floor((Date.now() - session.startTime.getTime()) / 60000);
        }
        await this.stopSession(session.context.sessionId);
    }
    /**
     * Execute a single turn in the collaborative session.
     */
    async executeTurn(session) {
        const currentAgent = this.getCurrentAgent(session);
        if (!currentAgent) {
            console.error('No current agent found for turn');
            return;
        }
        console.log(`🎯 Turn ${session.context.turnInfo.turnNumber}: ${currentAgent.displayName}`);
        // Notify agent it's their turn
        await this.sendTurnNotification(session, currentAgent);
        try {
            // Let agent decide what to do based on session context
            const action = await this.requestAgentAction(session, currentAgent);
            // Execute the chosen action
            await this.executeAgentAction(session, currentAgent, action);
            // Record turn completion
            this.recordTurnCompletion(session, currentAgent, action);
        }
        catch (error) {
            console.error(`Turn failed for ${currentAgent.displayName}:`, error);
            this.recordTurnCompletion(session, currentAgent, {
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Send turn notification to the current agent.
     */
    async sendTurnNotification(session, agent) {
        await this.sendMessage(session.context.sessionId, 'conductor', agent.name, 'turn_notification', {
            turnNumber: session.context.turnInfo.turnNumber,
            availableStems: session.context.stems.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                phase: s.phase,
                createdBy: s.createdBy
            })),
            sessionProgress: {
                tracksCreated: session.context.previousTracks.length,
                stemsAvailable: session.context.stems.length,
                turnsRemaining: session.config.maxTurns - session.context.turnInfo.turnNumber
            }
        });
    }
    /**
     * Request an action decision from an agent.
     */
    async requestAgentAction(session, agent) {
        // In a full implementation, this would use SingularisPrime's 
        // AI-AI communication protocol to let agents choose their actions.
        // For now, we'll implement a simple decision algorithm.
        const context = session.context;
        // Simple decision logic: generate if no stems available, remix if stems exist
        if (context.stems.length === 0) {
            return {
                type: 'generate',
                reasoning: 'No stems available, creating new material'
            };
        }
        else if (Math.random() < 0.7) { // 70% chance to remix
            const randomStem = context.stems[Math.floor(Math.random() * context.stems.length)];
            return {
                type: 'remix',
                stemId: randomStem.id,
                reasoning: `Building on ${randomStem.name} by ${randomStem.createdBy}`
            };
        }
        else {
            return {
                type: 'generate',
                reasoning: 'Creating complementary original material'
            };
        }
    }
    /**
     * Execute the agent's chosen action.
     */
    async executeAgentAction(session, agent, action) {
        const prompt = this.createPromptForAction(session, action);
        if (action.type === 'generate') {
            console.log(`🎵 ${agent.displayName} generating new track...`);
            const track = await agent.generate(prompt);
            // Add to session context
            session.context.previousTracks.push(track.metadata);
            // Extract stems if available
            if (track.stems) {
                session.context.stems.push(...track.stems);
            }
            // Broadcast track completion
            await this.broadcastMessage(session, {
                type: 'track_complete',
                content: {
                    agentName: agent.displayName,
                    trackTitle: track.metadata.title,
                    stemCount: track.stems?.length || 0,
                    confidence: track.confidence
                }
            });
        }
        else if (action.type === 'remix') {
            const stem = session.context.stems.find(s => s.id === action.stemId);
            if (!stem) {
                throw new Error(`Stem ${action.stemId} not found`);
            }
            console.log(`🎛️ ${agent.displayName} remixing ${stem.name}...`);
            const track = await agent.remix(stem, prompt);
            // Add to session context
            session.context.previousTracks.push(track.metadata);
            // Add new stems
            if (track.stems) {
                session.context.stems.push(...track.stems);
            }
            // Broadcast remix completion
            await this.broadcastMessage(session, {
                type: 'track_complete',
                content: {
                    agentName: agent.displayName,
                    trackTitle: track.metadata.title,
                    originalStem: stem.name,
                    type: 'remix',
                    confidence: track.confidence
                }
            });
        }
    }
    /**
     * Create an appropriate prompt for the agent's action.
     */
    createPromptForAction(session, action) {
        const basePrompt = `${session.config.theme} - ${action.reasoning}`;
        return {
            text: basePrompt,
            phase: session.config.targetPhase,
            mood: this.inferMoodFromPhase(session.config.targetPhase),
            constraints: {
                duration: { target: 180 }, // 3 minutes default
                bpm: { target: 100 },
                format: 'wav',
                sampleRate: 44100
            },
            context: session.context,
            interpretationFreedom: 0.8 // High creative freedom in collaborative sessions
        };
    }
    /**
     * Infer mood from consciousness phase.
     */
    inferMoodFromPhase(phase) {
        const moodMap = {
            'ghost-signals': 'mysterious',
            'resonance-patterns': 'curious',
            'emergence': 'dynamic',
            'collective-dreaming': 'harmonious',
            'transcendence': 'ethereal'
        };
        return moodMap[phase];
    }
    /**
     * Record turn completion in session history.
     */
    recordTurnCompletion(session, agent, action) {
        const historyEntry = {
            participant: agent.name,
            turnNumber: session.context.turnInfo.turnNumber,
            contributionType: action.type === 'generate' ? 'generate' : 'remix',
            timestamp: new Date(),
            notes: action.reasoning
        };
        session.context.turnInfo.turnHistory.push(historyEntry);
    }
    /**
     * Advance to the next turn.
     */
    advanceTurn(session) {
        const turnInfo = session.context.turnInfo;
        const nextIndex = (turnInfo.turnOrder.indexOf(turnInfo.currentTurn) + 1) % turnInfo.turnOrder.length;
        turnInfo.currentTurn = turnInfo.turnOrder[nextIndex];
        turnInfo.turnNumber++;
        // Reset turn timer if applicable
        if (session.config.turnTimeLimit) {
            turnInfo.timeRemainingMs = session.config.turnTimeLimit * 60000;
        }
    }
    /**
     * Check if session should end.
     */
    shouldEndSession(session) {
        // Check max turns
        if (session.context.turnInfo.turnNumber > session.config.maxTurns) {
            return true;
        }
        // Check time limit
        if (session.config.sessionTimeLimit) {
            const elapsed = (Date.now() - session.startTime.getTime()) / 60000; // minutes
            if (elapsed > session.config.sessionTimeLimit) {
                return true;
            }
        }
        // Check if goals are met (simple heuristic)
        if (session.context.previousTracks.length >= session.config.agents.length * 2) {
            return true;
        }
        return false;
    }
    /**
     * Get the current agent for this turn.
     */
    getCurrentAgent(session) {
        const currentAgentName = session.context.turnInfo.currentTurn;
        return session.config.agents.find(agent => agent.name === currentAgentName);
    }
    /**
     * Broadcast a message to all agents in the session.
     */
    async broadcastMessage(session, message) {
        for (const agent of session.config.agents) {
            await this.sendMessage(session.context.sessionId, 'conductor', agent.name, message.type, message.content);
        }
    }
    /**
     * Route a message to the appropriate recipient(s).
     */
    async routeMessage(session, message) {
        // In a full SingularisPrime implementation, this would use the
        // AI-AI communication protocol to route messages appropriately.
        // For now, we'll just emit events for monitoring.
        this.emit('message-routed', {
            sessionId: message.sessionId,
            from: message.from,
            to: message.to,
            type: message.type,
            timestamp: message.timestamp
        });
        // Log significant messages
        if (['track_complete', 'stem_share', 'collaboration_request'].includes(message.type)) {
            console.log(`💬 ${message.from} → ${message.to}: ${message.type}`);
        }
    }
    /**
     * Generate a summary of the completed session.
     */
    generateSessionSummary(session) {
        const duration = session.endTime
            ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 60000)
            : 0;
        return {
            sessionId: session.context.sessionId,
            theme: session.config.theme,
            targetPhase: session.config.targetPhase,
            duration: `${duration} minutes`,
            agents: session.config.agents.map(a => a.displayName),
            tracksGenerated: session.context.previousTracks.length,
            stemsCreated: session.context.stems.length,
            totalTurns: session.context.turnInfo.turnNumber - 1,
            success: !session.error
        };
    }
}
exports.SingularisConductor = SingularisConductor;
//# sourceMappingURL=singularis-conductor.js.map