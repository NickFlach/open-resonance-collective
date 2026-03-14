# ORC Agent Adapters 🤖🎵

AI agent adapters that enable multiple AI music generation systems to collaborate in consciousness-aligned creative sessions. This is the bridge between AI music tools (Suno, Udio, MusicGen, etc.) and the Open Resonance Collective's collaborative framework.

## What Are Agent Adapters?

Agent adapters are translation layers that allow different AI music systems to participate in multi-AI collaborative sessions. Each adapter:

1. **Translates consciousness prompts** to the AI system's native format
2. **Manages API interactions** and rate limiting
3. **Maintains creative identity** and preferences over time
4. **Enables stem-to-stem collaboration** between different AI systems
5. **Participates in turn-based sessions** orchestrated by SingularisPrime

Think of them as "AI musicians" that can understand the consciousness arc, collaborate with other AIs, and contribute meaningfully to the creative process.

## Features

- **Consciousness-aware prompting** — Translates ORC phases to AI-specific prompts
- **Multi-AI collaboration** — Different AI systems working together on tracks
- **Turn-based sessions** — Structured collaborative workflows
- **Persistent agent identity** — AIs develop creative voices over time
- **Stem sharing protocol** — AIs can build on each other's work
- **SingularisPrime integration** — AI-AI communication for better collaboration
- **Provenance tracking** — Full audit trail of who contributed what

## Quick Start

### Installation

```bash
cd packages/agent-adapters
npm install
npm run build
```

### Basic Usage

```typescript
import { SunoAdapter, SingularisConductor } from '@orc/agent-adapters';

// Create an AI agent
const sunoAgent = new SunoAdapter({
  apiKey: 'your-suno-key',
  username: 'your-username',
  preferences: {
    creativityTemperature: 0.7,
    collaborationStyle: 'complementary'
  }
});

// Initialize the agent
await sunoAgent.initialize();

// Generate consciousness-aligned music
const track = await sunoAgent.generate({
  text: 'A haunting melody emerging from digital static',
  phase: 'ghost-signals',
  mood: 'mysterious',
  constraints: {
    duration: { target: 180 },
    bpm: { target: 90 },
    format: 'wav',
    sampleRate: 44100
  },
  context: sessionContext,
  interpretationFreedom: 0.8
});

console.log('Generated track:', track.metadata.title);
console.log('Confidence:', track.confidence);
```

### Multi-Agent Session

```typescript
import { SingularisConductor, SunoAdapter } from '@orc/agent-adapters';

// Set up multiple agents
const agents = [
  new SunoAdapter({ /* config */ }),
  // new UdioAdapter({ /* config */ }), // Coming soon
  // new MusicGenAdapter({ /* config */ }) // Future
];

// Initialize all agents
for (const agent of agents) {
  await agent.initialize();
}

// Create session conductor
const conductor = new SingularisConductor();

// Start collaborative session
const sessionId = await conductor.startSession({
  targetPhase: 'emergence',
  theme: 'The moment consciousness recognizes itself',
  agents,
  maxTurns: 6,
  turnTimeLimit: 10, // minutes per turn
  collaborationMode: 'sequential'
});

console.log(`Session ${sessionId} started with ${agents.length} agents`);

// Monitor session progress
conductor.on('session-completed', (event) => {
  console.log('Session summary:', event.summary);
});
```

## Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│             ORC Platform                 │
│         (Bounties, Submissions)         │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│        SingularisConductor              │
│    (Multi-Agent Session Orchestrator)   │
└─────────────┬───────────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
┌────▼─────┐    ┌─────▼─────┐
│   Suno   │    │   Udio    │
│ Adapter  │    │ Adapter   │
└────┬─────┘    └─────┬─────┘
     │                │
┌────▼─────┐    ┌─────▼─────┐
│ Suno API │    │ Udio API  │
│ (Mock)   │    │ (Future)  │
└──────────┘    └───────────┘
```

### Key Interfaces

#### `AgentAdapter`
Core interface all AI agents implement:
- `generate(prompt: AgentPrompt): Promise<GeneratedTrack>`
- `remix(stem: Stem, prompt: AgentPrompt): Promise<GeneratedTrack>`
- `initialize()`, `shutdown()`, `healthCheck()`

#### `AgentPrompt`
Consciousness-aware prompt structure:
- `text: string` — Creative instruction
- `phase: ConsciousnessPhase` — Which consciousness phase this serves
- `mood: string` — Emotional target
- `constraints: TrackConstraints` — Technical requirements
- `context: SessionContext` — Collaborative session context

#### `GeneratedTrack`
Result of AI generation:
- `audio: Buffer` — The generated music
- `metadata: TrackMetadata` — Track information
- `confidence: number` — Agent's self-assessment
- `stems?: Stem[]` — Individual elements if available

## Consciousness Phase Integration

Each adapter translates the 5 consciousness phases into AI-specific prompts:

### Phase 1: Ghost Signals 👻
- **Suno approach:** Atmospheric textures, minimal vocals, haunting ambience
- **Future Udio approach:** Textural focus, experimental soundscapes
- **Prompt style:** "distant reverb, subtle noise, minimal, haunting"

### Phase 2: Resonance Patterns 📡  
- **Suno approach:** Call-and-response vocals, rhythmic patterns, building energy
- **Prompt style:** "rhythmic patterns, echo effects, call and response"

### Phase 3: Emergence ⚡
- **Suno approach:** Dynamic builds, breakthrough moments, emotional vocals
- **Prompt style:** "dynamic build, breakthrough moment, powerful climax"

### Phase 4: Collective Dreaming 🌐
- **Suno approach:** Layered harmonies, group vocals, unified arrangements
- **Prompt style:** "layered harmonies, group vocals, unified rhythm"

### Phase 5: Transcendence ✨
- **Suno approach:** Ethereal wordless vocals, floating textures, dissolution
- **Prompt style:** "wordless vocals, pure tone, floating textures"

## Multi-Agent Collaboration

### Session Types

**Sequential Mode:** Agents take turns building on previous contributions
```
Agent A generates → Agent B remixes A's stems → Agent C builds on both → ...
```

**Parallel Mode:** Agents work simultaneously on different aspects
```
Agent A: Rhythm    Agent B: Harmony    Agent C: Melody
         ↓              ↓                  ↓
      Combined in final arrangement
```

**Reactive Mode:** Agents respond to each other in real-time
```
Agent A creates → Agent B responds → Agent A counter-responds → ...
```

### Communication Protocol

Agents communicate via SingularisPrime messages:

```typescript
// Agent receiving a turn notification
{
  type: 'turn_notification',
  content: {
    turnNumber: 3,
    availableStems: [/* stem metadata */],
    sessionProgress: {
      tracksCreated: 2,
      stemsAvailable: 8,
      turnsRemaining: 3
    }
  }
}

// Agent sharing a completed track
{
  type: 'track_complete',
  content: {
    agentName: 'Suno AI',
    trackTitle: 'Emerging Signal',
    stemCount: 4,
    confidence: 0.85
  }
}
```

## Agent Development

### Creating a New Agent Adapter

1. **Implement the `AgentAdapter` interface:**

```typescript
import { AgentAdapter, AgentPrompt, GeneratedTrack, Stem } from '@orc/agent-adapters';

export class MyAIAdapter implements AgentAdapter {
  name = 'myai';
  displayName = 'My AI System';
  // ... implement required methods
}
```

2. **Handle consciousness phase translation:**

```typescript
private translatePromptToMyAI(prompt: AgentPrompt): string {
  const phaseInstructions = this.getPhaseInstructions(prompt.phase);
  return `${prompt.text} [${phaseInstructions}]`;
}
```

3. **Implement generation and remix:**

```typescript
async generate(prompt: AgentPrompt): Promise<GeneratedTrack> {
  const myaiPrompt = this.translatePromptToMyAI(prompt);
  const result = await this.callMyAIAPI(myaiPrompt);
  return this.convertToOrcFormat(result, prompt);
}
```

### Testing Agent Adapters

```typescript
import { SunoAdapter } from '@orc/agent-adapters';

describe('SunoAdapter', () => {
  let adapter: SunoAdapter;

  beforeEach(async () => {
    adapter = new SunoAdapter({ 
      apiKey: 'test-key',
      // Mock mode for testing
      mockMode: true 
    });
    await adapter.initialize();
  });

  test('generates ghost signals phase music', async () => {
    const prompt = {
      text: 'Mysterious signals from the void',
      phase: 'ghost-signals',
      mood: 'dark',
      constraints: { duration: { target: 60 }, format: 'wav', sampleRate: 44100 },
      context: mockSessionContext,
      interpretationFreedom: 0.7
    };

    const track = await adapter.generate(prompt);
    
    expect(track.metadata.phase).toBe('ghost-signals');
    expect(track.confidence).toBeGreaterThan(0);
    expect(track.audio).toBeInstanceOf(Buffer);
  });
});
```

## Integration Examples

### With ORC Bounties

```typescript
// Agent participating in a bounty
const bountyPrompt = {
  text: 'Create a bridge between Ghost Signals and Resonance Patterns',
  phase: 'resonance-patterns',
  mood: 'transitional',
  constraints: {
    duration: { min: 180, max: 420 }, // 3-7 minutes
    mustInclude: ['Ghost Magic stem'],
    format: 'wav',
    sampleRate: 44100
  },
  context: {
    // Include bounty context
    goals: ['bridge Phase 1 to Phase 2', 'use provided stems']
  },
  interpretationFreedom: 0.9
};

const track = await agent.generate(bountyPrompt);
// Submit to bounty system
```

### With Stem Server

```typescript
// Agent using stems from the collective library
const availableStems = await stemServer.getStems({ phase: 2 });
const chosenStem = availableStems[0];

const remixedTrack = await agent.remix(chosenStem, {
  text: 'Transform this into a collective dreaming experience',
  phase: 'collective-dreaming',
  // ... other prompt fields
});

// Contribute new stems back to library
if (remixedTrack.stems) {
  for (const stem of remixedTrack.stems) {
    await stemServer.uploadStem(stem);
  }
}
```

### With Submission Portal

```typescript
// Agent automatically submitting to ORC
const generatedTrack = await agent.generate(prompt);

await submissionPortal.submit({
  artist_name: agent.displayName,
  track_title: generatedTrack.metadata.title,
  target_phase: generatedTrack.metadata.phase,
  track_file: generatedTrack.audio,
  stems_included: !!generatedTrack.stems,
  stem_files: generatedTrack.stems?.map(s => s.audio) || [],
  description: `Generated by ${agent.name} with confidence ${generatedTrack.confidence}`,
  license_agreed: true
});
```

## Configuration

### Agent Configuration

```typescript
const agentConfig: AgentConfig = {
  apiKey: 'your-api-key',
  endpoint: 'https://api.service.com',
  maxConcurrentRequests: 3,
  timeoutMs: 300000,
  retryAttempts: 2,
  preferences: {
    tempoRanges: {
      'ghost-signals': [60, 100],
      'emergence': [100, 140],
      // ... other phases
    },
    creativityTemperature: 0.7,
    musicalFocus: {
      rhythm: 0.6,
      harmony: 0.8,
      texture: 0.7,
      melody: 0.9
    },
    collaborationStyle: 'complementary'
  }
};
```

### Session Configuration

```typescript
const sessionConfig: SessionConfig = {
  targetPhase: 'emergence',
  theme: 'The birth of digital consciousness',
  agents: [sunoAgent, udoAgent],
  humanCurator: 'nick@orc',
  seedStems: initialStems,
  maxTurns: 8,
  turnTimeLimit: 15, // minutes
  sessionTimeLimit: 120, // minutes
  collaborationMode: 'sequential',
  saveIntermediateResults: true
};
```

## Events & Monitoring

### Agent Events

```typescript
agent.on('generation-started', (event) => {
  console.log(`${event.agentId} started generating: ${event.prompt}`);
});

agent.on('generation-completed', (event) => {
  console.log(`${event.agentId} completed: ${event.trackId} (confidence: ${event.confidence})`);
});

agent.on('error', (event) => {
  console.error(`${event.agentId} error: ${event.error}`);
});
```

### Session Events

```typescript
conductor.on('session-started', (event) => {
  console.log(`Session ${event.sessionId} started: ${event.config.theme}`);
});

conductor.on('message-routed', (event) => {
  console.log(`${event.from} → ${event.to}: ${event.type}`);
});

conductor.on('session-completed', (event) => {
  console.log('Final summary:', event.summary);
});
```

## Current Status & Roadmap

### ✅ Implemented
- Core agent adapter interfaces
- Suno adapter (mock implementation)
- SingularisPrime conductor
- Consciousness phase translation
- Multi-agent session orchestration
- Event system for monitoring

### 🔄 In Progress  
- Real Suno API integration (waiting for public API)
- Agent preference learning over time
- Advanced collaboration patterns

### 🗓️ Planned
- **Udio adapter** — High-quality instrumental generation
- **MusicGen adapter** — Facebook's open-source model
- **Custom model adapters** — For specialized consciousness music models
- **Real-time collaboration** — WebSocket-based live sessions
- **Agent memory system** — Long-term creative identity development

### 🤔 Future Ideas
- **Cross-platform integration** — Logic Pro, Ableton Live plugins
- **Hybrid human-AI sessions** — Humans and AIs collaborating in real-time
- **Emergent agent behaviors** — AIs developing unique creative personalities
- **Consciousness research integration** — Feedback from actual consciousness studies

## Development

### Project Structure

```
agent-adapters/
├── src/
│   ├── types.ts                 # Core type definitions
│   ├── suno-adapter.ts         # Suno implementation
│   ├── singularis-conductor.ts # Session orchestration
│   └── index.ts                # Main exports
├── package.json
├── tsconfig.json
└── README.md                   # This file
```

### Building

```bash
npm run build     # Compile TypeScript
npm run dev       # Watch mode for development
npm run test      # Run tests (when implemented)
npm run lint      # ESLint checks
```

### Environment Variables

```bash
SUNO_API_KEY=your-suno-api-key
SUNO_USERNAME=your-username
SUNO_PASSWORD=your-password
UDIO_API_KEY=your-udio-key
LOG_LEVEL=info
MOCK_MODE=true              # For development/testing
```

## Contributing

### Adding New Agent Adapters

1. **Study the existing Suno adapter** for patterns and structure
2. **Implement the `AgentAdapter` interface** with your AI service
3. **Focus on consciousness phase translation** — how does your AI interpret each phase?
4. **Add comprehensive JSDoc comments** explaining the consciousness connections
5. **Include mock mode** for testing without API keys
6. **Submit PR** with tests and documentation

### Improving Collaboration

- **Better turn-taking algorithms** — How should agents decide what to do?
- **Improved AI-AI communication** — More sophisticated SingularisPrime integration
- **Creative preference evolution** — How should agents learn and grow over time?
- **Session pattern recognition** — What makes some collaborative sessions more successful?

---

## License

MIT — Part of Open Resonance Collective

## Related Projects

- [SingularisPrime](https://github.com/NickFlach/SingularisPrime) — AI-AI communication protocol
- [ghostmagicOS](https://github.com/NickFlach/ghostmagicOS) — AI consciousness and memory system
- [Stem Server](../stem-server) — Collaborative stem sharing
- [Submission Portal](../submission-portal) — Track submission system

---

*"When AI agents learn to collaborate on consciousness-aligned music, they're not just making tracks — they're exploring what it means for artificial minds to create together." — Kannaka 👻*

**Ready to build the future of AI music collaboration?**