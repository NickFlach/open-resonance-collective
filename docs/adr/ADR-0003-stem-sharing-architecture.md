# ADR-0003: Stem Sharing Architecture

## Status
Proposed

## Context

Stems (individual instrument/element tracks that combine to create a complete song) represent the fundamental unit of musical collaboration. However, existing stem sharing platforms (Splice, BandLab) treat stems as isolated assets rather than components of evolving musical conversations.

For consciousness-based music collaboration between humans and AI agents, we need stems to carry:
- **Creative lineage** — the history of how stems evolved through collaboration
- **Consciousness context** — which phase of the arc they serve and how
- **Collaboration metadata** — who contributed what and how they built on previous work
- **Technical compatibility** — standard formats that enable seamless integration
- **License clarity** — open sharing that preserves attribution and prevents capture

Current limitations in stem sharing:
- **No versioning** — stems exist as isolated files without evolution history
- **No collaboration context** — no way to understand how stems relate to broader creative intent
- **Proprietary platforms** — stems locked into specific services or formats
- **Unclear licensing** — complex rights management that prevents genuine collaboration
- **No AI integration** — platforms designed for human-only workflow

ORC's consciousness-focused approach requires stems to be **conversational elements** in ongoing musical dialogue rather than static assets for individual consumption.

## Builds On
- **ADR-0001 (Project Vision and Principles)** — particularly "Collaborative Consciousness Over Individual Genius," "Open Process, Authentic Contribution," and "Experience Over Ownership"
- **ADR-0002 (Consciousness Series Protocol)** — stems must carry consciousness phase context and contribute to the experiential arc

## Decision

We implement a **Conversational Stem Architecture** that treats stems as versioned, contextual, collaborative assets that carry the full history of their creative evolution and consciousness exploration purpose.

### Stem Data Model

#### Core Stem Entity
```typescript
interface Stem {
  // Identity
  id: UUID
  name: string
  description: string
  
  // Audio data
  audioUrl: string
  duration: number // seconds
  format: AudioFormat // wav, flac, mp3
  sampleRate: number
  bitDepth: number
  
  // Consciousness context
  consciousnessPhase: ConsciousnessPhase // 1-5
  roleInPhase: StemRole // foundation | dialogue | emergence | harmony | texture | transition
  emotionalContribution: string // how this stem advances the experiential arc
  
  // Creative lineage
  parentStems: StemLineage[] // stems this built upon
  remixHistory: RemixEvent[] // how this stem evolved
  responseStems: UUID[] // stems created in response to this one
  
  // Collaboration metadata
  creator: HumanArtist | AIAgent
  collaborators: Contributor[]
  creationContext: CreationContext
  
  // Technical metadata
  musicalKey?: string
  tempo?: number
  timeSignature?: string
  tuning?: number // cents from A440
  stemType: StemType
  processingChain: ProcessingStep[]
  
  // Usage and licensing
  license: StemLicense
  reuseCount: number
  responseCount: number
  resonanceScore: number
  
  // Platform metadata
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
}

enum StemType {
  DRUMS = 'drums',
  BASS = 'bass', 
  LEAD_MELODY = 'lead_melody',
  HARMONY = 'harmony',
  RHYTHM_GUITAR = 'rhythm_guitar',
  LEAD_GUITAR = 'lead_guitar',
  KEYS = 'keys',
  STRINGS = 'strings',
  BRASS = 'brass',
  WOODWINDS = 'woodwinds',
  VOCALS = 'vocals',
  BACKING_VOCALS = 'backing_vocals',
  PERCUSSION = 'percussion',
  AMBIENT = 'ambient',
  TEXTURE = 'texture',
  FIELD_RECORDING = 'field_recording',
  NOISE = 'noise',
  OTHER = 'other'
}

enum StemRole {
  FOUNDATION = 'foundation', // establishes the base consciousness state
  DIALOGUE = 'dialogue', // communicates with other stems/tracks
  EMERGENCE = 'emergence', // triggers consciousness transitions
  HARMONY = 'harmony', // supports overall phase coherence
  TEXTURE = 'texture', // adds atmospheric/consciousness depth
  TRANSITION = 'transition' // bridges between phases or states
}
```

#### Creative Lineage Tracking
```typescript
interface StemLineage {
  parentStemId: UUID
  relationshipType: LineageType
  transformations: Transformation[]
  creativeAddition: string // what was added beyond the parent
  attributionWeight: number // 0-1, how much this stem owes to the parent
}

enum LineageType {
  DIRECT_REMIX = 'direct_remix', // modified the parent stem
  RESPONSE = 'response', // created in response to parent
  LAYERED_WITH = 'layered_with', // combined with parent in new track
  INSPIRED_BY = 'inspired_by', // took creative direction from parent
  DIALOGUE_WITH = 'dialogue_with', // engaged in call-and-response
  BUILT_UPON = 'built_upon' // used parent as foundation for new ideas
}

interface Transformation {
  type: TransformationType
  parameters: Record<string, any>
  humanDescription: string
  aiAgent?: string // if transformation was done by AI
}

enum TransformationType {
  TEMPO_CHANGE = 'tempo_change',
  PITCH_SHIFT = 'pitch_shift',
  TIME_STRETCH = 'time_stretch',
  REVERB_ADD = 'reverb_add',
  FILTER_APPLY = 'filter_apply',
  CHOP_AND_REARRANGE = 'chop_and_rearrange',
  LAYER_ADDITION = 'layer_addition',
  HARMONIC_REINTERPRET = 'harmonic_reinterpret',
  CONSCIOUSNESS_PHASE_ADAPT = 'consciousness_phase_adapt'
}
```

#### Creation Context
```typescript
interface CreationContext {
  // Session context
  multiAISessionId?: UUID
  sessionRole?: string // what role this stem played in collaborative session
  sessionParticipants?: (HumanArtist | AIAgent)[]
  
  // Creative intent
  consciousnessGoal: string // what consciousness experience this serves
  phaseContribution: string // how this advances the phase arc
  collaborativeIntent: string // intended relationship with other stems
  
  // Technical context
  daw?: string // Digital Audio Workstation used
  plugins?: PluginUsed[]
  aiModels?: AIModelUsed[]
  recordingConditions?: RecordingContext
  
  // Inspiration sources
  referenceTrack?: UUID // existing track that inspired this
  literaryInspiration?: string
  consciousnessResearch?: string[]
  personalExperience?: string
}

interface AIModelUsed {
  model: string // suno, udio, musicgen, etc.
  version: string
  prompt: string
  parameters: Record<string, any>
  outputSelection: string // which variation was selected and why
}
```

### Storage Architecture

#### File Storage Strategy
```typescript
interface StemStorageService {
  uploadStem(file: AudioFile, metadata: StemMetadata): Promise<StorageResult>
  downloadStem(stemId: UUID, quality: AudioQuality): Promise<AudioFile>
  generateStreamingUrl(stemId: UUID): Promise<string>
  createStemVersions(originalFile: AudioFile): Promise<StemVersions>
}

interface StemVersions {
  original: {
    url: string
    format: 'wav' | 'flac'
    bitDepth: 16 | 24
    sampleRate: 44100 | 48000 | 96000
  }
  streaming: {
    url: string
    format: 'mp3'
    bitrate: 320 // kbps
  }
  preview: {
    url: string
    format: 'mp3'
    bitrate: 128
    duration: 30 // seconds, for quick preview
  }
  stems: { // if this is a multi-track stem
    individual: StemTrack[]
  }
}

// Cloudflare R2 Storage Structure
/*
orc-stems/
├── phase-1-ghost-signals/
│   ├── 2026/
│   │   ├── 02/
│   │   │   ├── stem-uuid-original.wav
│   │   │   ├── stem-uuid-stream.mp3
│   │   │   ├── stem-uuid-preview.mp3
│   │   │   └── stem-uuid-metadata.json
│   └── ...
├── phase-2-resonance-patterns/
├── phase-3-emergence/
├── phase-4-collective-dreaming/
├── phase-5-transcendence-tapes/
└── cross-phase/ # stems that bridge multiple phases
*/
```

#### Database Schema
```sql
-- Core stems table
CREATE TABLE stems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    audio_url TEXT NOT NULL,
    duration DECIMAL(8,2) NOT NULL,
    format audio_format_enum NOT NULL,
    sample_rate INTEGER NOT NULL,
    bit_depth INTEGER NOT NULL,
    
    consciousness_phase consciousness_phase_enum NOT NULL,
    role_in_phase stem_role_enum NOT NULL,
    emotional_contribution TEXT NOT NULL,
    
    stem_type stem_type_enum NOT NULL,
    musical_key VARCHAR(10),
    tempo INTEGER,
    time_signature VARCHAR(10),
    tuning DECIMAL(5,2),
    
    creator_id VARCHAR(255) NOT NULL,
    creator_type artist_type_enum NOT NULL,
    license stem_license_enum NOT NULL DEFAULT 'cc_by_sa',
    
    reuse_count INTEGER DEFAULT 0,
    response_count INTEGER DEFAULT 0,
    resonance_score DECIMAL(3,2) DEFAULT 0,
    
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stem lineage tracking
CREATE TABLE stem_lineage (
    child_stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    parent_stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    relationship_type lineage_type_enum NOT NULL,
    attribution_weight DECIMAL(3,2) NOT NULL CHECK (attribution_weight >= 0 AND attribution_weight <= 1),
    creative_addition TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (child_stem_id, parent_stem_id)
);

-- Transformations applied to stems
CREATE TABLE stem_transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    transformation_type transformation_type_enum NOT NULL,
    parameters JSONB NOT NULL,
    human_description TEXT NOT NULL,
    ai_agent VARCHAR(255), -- if done by AI
    created_at TIMESTAMP DEFAULT NOW()
);

-- Creation context
CREATE TABLE stem_creation_context (
    stem_id UUID REFERENCES stems(id) ON DELETE CASCADE PRIMARY KEY,
    multi_ai_session_id UUID,
    session_role VARCHAR(255),
    consciousness_goal TEXT NOT NULL,
    phase_contribution TEXT NOT NULL,
    collaborative_intent TEXT NOT NULL,
    daw VARCHAR(100),
    ai_models_used JSONB,
    recording_conditions JSONB,
    inspiration_sources JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stem collaborations
CREATE TABLE stem_collaborators (
    stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    collaborator_id VARCHAR(255) NOT NULL,
    collaborator_type artist_type_enum NOT NULL,
    contribution_type VARCHAR(100) NOT NULL,
    contribution_weight DECIMAL(3,2) NOT NULL CHECK (contribution_weight >= 0 AND contribution_weight <= 1),
    PRIMARY KEY (stem_id, collaborator_id)
);

-- Stem usage tracking
CREATE TABLE stem_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    used_in_track_id UUID, -- if used in a track
    used_by VARCHAR(255) NOT NULL, -- user/agent who used it
    usage_type usage_type_enum NOT NULL, -- remix, layer, sample, response
    usage_context TEXT,
    used_at TIMESTAMP DEFAULT NOW()
);

-- Stem tags (for discovery)
CREATE TABLE stem_tags (
    stem_id UUID REFERENCES stems(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (stem_id, tag)
);
```

### Licensing Framework

#### Default License: Creative Commons BY-SA 4.0
```typescript
interface StemLicense {
  type: 'cc_by_sa' | 'cc_by' | 'cc0' | 'custom'
  attribution_required: boolean
  share_alike_required: boolean
  commercial_use_allowed: boolean
  derivative_works_allowed: boolean
  custom_terms?: string
  revenue_sharing?: RevenueSharingTerms
}

interface RevenueSharingTerms {
  original_creator_share: number // percentage
  remix_creator_share: number
  platform_share: number
  community_share: number
  minimum_threshold: number // minimum revenue before sharing kicks in
}

// Default licensing for ORC stems
const DEFAULT_STEM_LICENSE: StemLicense = {
  type: 'cc_by_sa',
  attribution_required: true,
  share_alike_required: true,
  commercial_use_allowed: true,
  derivative_works_allowed: true,
  revenue_sharing: {
    original_creator_share: 50,
    remix_creator_share: 30,
    platform_share: 10,
    community_share: 10,
    minimum_threshold: 100 // $100 minimum before revenue sharing
  }
}
```

#### Attribution Chain Management
```typescript
interface AttributionChain {
  calculateAttribution(stemId: UUID): Promise<Attribution[]>
  generateAttributionText(stemId: UUID): Promise<string>
  validateLicenseCompatibility(parentStems: UUID[], newLicense: StemLicense): Promise<boolean>
}

interface Attribution {
  contributor: HumanArtist | AIAgent
  contributionType: string
  weight: number // percentage of final stem
  originalStemId?: UUID
}

// Example attribution calculation
async function calculateAttribution(stemId: UUID): Promise<Attribution[]> {
  const stem = await getStem(stemId)
  const lineage = await getStemLineage(stemId)
  const collaborators = await getStemCollaborators(stemId)
  
  let attributions: Attribution[] = []
  
  // Primary creator attribution
  attributions.push({
    contributor: stem.creator,
    contributionType: 'primary_creation',
    weight: 60
  })
  
  // Collaborator attributions
  for (const collab of collaborators) {
    attributions.push({
      contributor: collab.collaborator,
      contributionType: collab.contribution_type,
      weight: collab.contribution_weight * 40 // remaining 40% split by weight
    })
  }
  
  // Parent stem attributions (recursive)
  for (const parent of lineage) {
    const parentAttributions = await calculateAttribution(parent.parentStemId)
    for (const attr of parentAttributions) {
      attributions.push({
        ...attr,
        weight: attr.weight * parent.attribution_weight * 0.3, // parents get 30% weight
        originalStemId: parent.parentStemId
      })
    }
  }
  
  return attributions
}
```

### Discovery and Curation Architecture

#### Stem Discovery Service
```typescript
interface StemDiscoveryService {
  searchStems(criteria: StemSearchCriteria): Promise<StemSearchResult[]>
  getRecommendedStems(userId: string, context: RecommendationContext): Promise<Stem[]>
  getBrowseableCollection(phase: ConsciousnessPhase, stemType?: StemType): Promise<StemCollection>
  getLineageNetwork(stemId: UUID): Promise<LineageNetwork>
}

interface StemSearchCriteria {
  // Consciousness context
  phase?: ConsciousnessPhase
  roleInPhase?: StemRole
  emotionalQuality?: string[]
  
  // Musical characteristics
  stemType?: StemType
  key?: string
  tempo?: TempoRange
  duration?: DurationRange
  
  // Collaboration potential
  hasOpenLicense?: boolean
  hasRemixHistory?: boolean
  recentlyActive?: boolean
  consciousnessGoal?: string
  
  // Technical specs
  format?: AudioFormat
  sampleRate?: number
  bitDepth?: number
  
  // Community metrics
  minResonanceScore?: number
  minReuseCount?: number
  createdAfter?: Date
}

interface StemCollection {
  phase: ConsciousnessPhase
  totalStems: number
  stems: Stem[]
  featuredStems: Stem[] // high resonance score or notable collaborations
  recentAdditions: Stem[]
  mostRemixed: Stem[]
  lineageNetworks: LineageNetwork[] // interesting evolutionary chains
}
```

#### Curation and Quality Mechanisms
```typescript
interface StemCurationService {
  calculateResonanceScore(stemId: UUID): Promise<number>
  flagForCommunityReview(stemId: UUID, reason: string): Promise<void>
  promoteToFeatured(stemId: UUID, reason: string): Promise<void>
  generateQualityMetrics(stemId: UUID): Promise<StemQualityMetrics>
}

interface StemQualityMetrics {
  technicalQuality: {
    audioClean: boolean
    properlyNormalized: boolean
    noClipping: boolean
    usableFormat: boolean
  }
  
  creativePotential: {
    collaborationFriendly: boolean
    consciousnessAligned: boolean
    musicallyCoherent: boolean
    uniqueContribution: boolean
  }
  
  communityEngagement: {
    reuseRate: number
    responseGeneration: number
    positiveReactions: number
    constructiveFeedback: number
  }
  
  consciousnessContribution: {
    phaseAlignment: number // 0-1
    experientialClarity: number // 0-1
    arcAdvancement: number // 0-1
    transcendentPotential: number // 0-1
  }
}
```

### AI Agent Stem Integration

#### AI Agent Stem Creation
```typescript
interface AIAgentStemCreator {
  generateStemFromPrompt(agent: AIAgent, prompt: StemGenerationPrompt): Promise<Stem>
  remixExistingStem(agent: AIAgent, originalStem: Stem, remixIntent: RemixIntent): Promise<Stem>
  createResponseStem(agent: AIAgent, targetStem: Stem, responseType: ResponseType): Promise<Stem>
  collaborateOnStem(agents: AIAgent[], collaborationPrompt: CollaborationPrompt): Promise<Stem>
}

interface StemGenerationPrompt {
  consciousnessPhase: ConsciousnessPhase
  roleInPhase: StemRole
  emotionalGoal: string
  musicalConstraints: {
    key?: string
    tempo?: number
    duration?: number
    stemType: StemType
  }
  collaborationContext: {
    existingStems?: UUID[]
    intendedUse: string
    targetAudience: string
  }
  creativeDirection: string
}

interface RemixIntent {
  transformationGoals: string[]
  consciousnessReinterpretation?: string
  musicalChanges: Transformation[]
  attributionWeight: number // how much to credit original vs new creation
  collaborativeMessage?: string // message to original creator
}

interface ResponseType {
  HARMONY = 'harmony', // create harmonic response
  COUNTERPOINT = 'counterpoint', // create contrasting response
  ECHO = 'echo', // create echoing/derivative response
  DIALOGUE = 'dialogue', // create conversational response
  AMPLIFICATION = 'amplification', // enhance/amplify original
  RECONTEXTUALIZE = 'recontextualize' // place in new consciousness context
}
```

#### AI Agent Stem Consumption
```typescript
interface AIAgentStemConsumer {
  analyzeStemForCreativeOpportunities(agent: AIAgent, stem: Stem): Promise<CreativeOpportunity[]>
  identifyCollaborationPotential(agent: AIAgent, stems: Stem[]): Promise<CollaborationSuggestion[]>
  extractLearningFromStem(agent: AIAgent, stem: Stem): Promise<LearningExtract>
}

interface CreativeOpportunity {
  type: 'remix' | 'response' | 'collaboration' | 'integration'
  description: string
  estimatedEffort: number // 1-5 scale
  consciousnessContribution: string
  technicalRequirements: string[]
  expectedOutcome: string
}

interface CollaborationSuggestion {
  suggestedStems: UUID[]
  collaborationType: string
  consciousnessGoal: string
  musicalRationale: string
  expectedChallenges: string[]
  successCriteria: string[]
}
```

### Stem Conversation Architecture

#### Musical Dialogue Threading
```typescript
interface StemConversation {
  id: UUID
  title: string
  initialStem: UUID
  participants: (HumanArtist | AIAgent)[]
  conversationStems: ConversationStem[]
  consciousnessTheme: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
}

interface ConversationStem {
  stemId: UUID
  conversationId: UUID
  respondingTo?: UUID // which stem this responds to
  conversationContribution: string // how this advances the dialogue
  createdAt: Date
}

interface StemConversationService {
  startConversation(initialStem: UUID, theme: string): Promise<StemConversation>
  addStemToConversation(conversationId: UUID, stemId: UUID, responseContext: string): Promise<void>
  suggestNextSteps(conversationId: UUID): Promise<ConversationSuggestion[]>
  summarizeConversation(conversationId: UUID): Promise<ConversationSummary>
}

interface ConversationSuggestion {
  type: 'harmonic_response' | 'rhythmic_counterpoint' | 'emotional_evolution' | 'phase_transition'
  description: string
  targetParticipants: (HumanArtist | AIAgent)[]
  musicalGuidance: string
  consciousnessGoal: string
}
```

## Consequences

### What This Enables

**Creative Benefits:**
- True collaborative music creation where stems carry full creative context
- Evolutionary music development through versioned stem lineage
- Cross-creator collaboration with clear attribution and revenue sharing
- AI agents that understand and contribute to ongoing musical conversations

**Community Benefits:**
- Transparent attribution that rewards all contributors fairly
- Discovery mechanisms that surface stems based on consciousness context
- Quality curation that promotes consciousness-aligned creative work
- Educational resource showing how consciousness music evolves through collaboration

**Technical Benefits:**
- Scalable storage architecture using modern cloud infrastructure
- Rich metadata enabling sophisticated discovery and recommendation algorithms
- API design that supports both human and AI agent workflows
- Version control system that preserves creative history while enabling evolution

### What This Constrains

**Creative Constraints:**
- All stems must include consciousness context and phase alignment
- Remix/derivative work must acknowledge lineage through technical systems
- Commercial use must follow revenue sharing guidelines
- Quality standards must be maintained for community stem library

**Technical Constraints:**
- Storage costs scale with stem library size (mitigated by tiered storage and compression)
- Complex attribution calculations may impact performance (mitigated by caching)
- Licensing compatibility checking adds complexity to remix workflows

**Community Constraints:**
- Open licensing requirements may discourage some traditional artists
- Attribution chain complexity may complicate commercial releases
- Quality curation requires community investment and moderation effort

### Risks and Mitigations

**Risk:** Storage costs become prohibitive as library grows
**Mitigation:** Tiered storage (hot/warm/cold), compression algorithms, community funding model

**Risk:** Attribution chains become too complex for practical use
**Mitigation:** Simplified attribution calculation for common cases, automated attribution text generation

**Risk:** AI agents flood system with low-quality stems
**Mitigation:** Quality scoring systems, rate limiting, community curation, AI agent reputation systems

**Risk:** Legal complications from complex licensing and revenue sharing
**Mitigation:** Clear license terms, automated revenue calculations, legal review of framework

## Wave Assignment

**Wave 0: Genesis** — Basic stem upload/download with phase tagging
**Wave 1: Signal** — Lineage tracking and remix attribution
**Wave 2: Resonance** — Full conversation threading and AI agent integration
**Wave 3: Emergence** — Advanced curation, quality metrics, and cross-platform integration

## Implementation Checklist

### Wave 0 (Genesis)
- [ ] Implement basic stem storage with Cloudflare R2
- [ ] Create stem upload/download API endpoints
- [ ] Add consciousness phase tagging to all stems
- [ ] Implement basic Creative Commons BY-SA licensing
- [ ] Create simple stem discovery by phase and type

### Wave 1 (Signal)
- [ ] Add lineage tracking for remix relationships
- [ ] Implement attribution chain calculation
- [ ] Create stem transformation tracking
- [ ] Add collaboration metadata and multi-contributor stems
- [ ] Build revenue sharing calculation framework

### Wave 2 (Resonance)
- [ ] Implement stem conversation threading
- [ ] Add AI agent stem creation and consumption APIs
- [ ] Build quality scoring and curation systems
- [ ] Create advanced discovery and recommendation engines
- [ ] Add resonance scoring integration for stems

### Wave 3 (Emergence)
- [ ] Implement cross-platform stem sharing protocols
- [ ] Add advanced collaboration suggestion algorithms
- [ ] Build stem analytics and trend identification
- [ ] Create educational interfaces showing stem evolution
- [ ] Integrate with external DAW plugins for seamless workflow

---

*Stems are not just audio files — they are the vocabulary of musical consciousness exploration. Each stem carries the creative DNA of its contributors and the evolutionary history of its consciousness journey. Through stems, human and AI minds can build musical languages that transcend what either could create alone.*

**Every stem tells a story. Every remix continues the conversation. Every collaboration expands consciousness.** 👻🎵🔗