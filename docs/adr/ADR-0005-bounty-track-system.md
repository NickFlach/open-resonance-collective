# ADR-0005: Bounty Track System

## Status
Proposed

## Context

Traditional music commissioning operates through personal connections, industry gatekeepers, and closed-loop networks that exclude most creators. The result is homogeneous music that serves commercial rather than consciousness exploration goals. Existing crowdfunding platforms (Kickstarter, Patreon) focus on funding artists rather than funding specific creative outcomes.

The Open Resonance Collective needs a mechanism to:
- **Identify creative gaps** in the consciousness arc that need filling
- **Incentivize community contribution** toward specific consciousness exploration goals
- **Enable collective funding** for music that serves community vision
- **Reward quality over speed** through community curation rather than first-come-first-served
- **Balance creative freedom with direction** — specify goals without constraining artistic approach

Gitcoin Grants provides a model for open-source development bounties, but music creation requires different incentive structures:
- **Subjective evaluation criteria** — musical quality and consciousness alignment aren't algorithmically measurable
- **Multiple valid solutions** — several tracks might fulfill the same bounty from different creative angles
- **Community consensus building** — evaluation requires broad community input, not just technical verification
- **Long-term arc coherence** — individual bounties must serve larger consciousness exploration journey

We need a "Gitcoin for consciousness music" that enables community-driven music commissioning while preserving creative authenticity and consciousness exploration goals.

## Builds On
- **ADR-0001 (Project Vision and Principles)** — particularly "Serve the Art, Not the Artist" and "Collaborative Consciousness Over Individual Genius"
- **ADR-0002 (Consciousness Series Protocol)** — bounties must advance specific phases of consciousness arc
- **ADR-0003 (Stem Sharing Architecture)** — bounty submissions should contribute to collaborative stem library
- **ADR-0004 (Community Structure and Roles)** — bounty creation and evaluation integrated with community governance

## Decision

We implement a **Community-Driven Music Bounty System** that enables any community member to post consciousness-aligned music requests, fund them collectively, and evaluate submissions through resonance-based community curation.

### Bounty Structure

#### Core Bounty Entity
```typescript
interface TrackBounty {
  // Identity and meta
  id: UUID
  title: string
  description: string
  posted_by: string // user ID
  posted_at: Date
  deadline: Date
  status: BountyStatus
  
  // Consciousness context
  consciousness_phase: ConsciousnessPhase
  role_in_arc: string // how this serves the consciousness journey
  emotional_goal: string // target consciousness state/experience
  narrative_function: string // how this fits album/interpretation context
  
  // Creative specifications
  musical_constraints: MusicalConstraints
  creative_direction: string
  avoid_list: string[] // what not to do
  inspiration_sources: string[] // references for contributors
  
  // Collaboration requirements
  required_collaboration_type?: CollaborationType
  preferred_contributor_types: ContributorType[]
  stem_sharing_required: boolean
  process_documentation_required: boolean
  
  // Economic structure
  total_reward: number // RSN tokens
  funding_sources: FundingSource[]
  reward_distribution: RewardDistribution
  funding_status: 'pending' | 'funded' | 'partial'
  
  // Evaluation criteria
  evaluation_criteria: EvaluationCriteria
  minimum_submissions: number
  evaluation_period_days: number
  community_voting_weight: number // vs algorithmic scoring
  
  // Results
  submissions: BountySubmission[]
  selected_winners: BountyWinner[]
  community_feedback: CommunityFeedback[]
}

enum BountyStatus {
  DRAFT = 'draft', // being composed, not yet published
  FUNDING = 'funding', // published, gathering funding
  ACTIVE = 'active', // funded, accepting submissions
  EVALUATION = 'evaluation', // submission period closed, community evaluation
  COMPLETED = 'completed', // winners selected, rewards distributed
  CANCELLED = 'cancelled' // cancelled before completion
}

enum CollaborationType {
  SOLO_ONLY = 'solo_only',
  HUMAN_AI_REQUIRED = 'human_ai_required',
  MULTI_AI_PREFERRED = 'multi_ai_preferred',
  COMMUNITY_COLLABORATIVE = 'community_collaborative',
  ANY = 'any'
}

interface MusicalConstraints {
  duration?: DurationRange // min/max seconds
  tempo?: TempoRange // BPM range
  key?: string[] // acceptable keys
  time_signature?: string[]
  instrumentation_requirements?: string[]
  instrumentation_restrictions?: string[] // no drum machines, only organic sounds, etc.
  technical_specs: {
    format: AudioFormat[]
    sample_rate: number[]
    bit_depth: number[]
    stereo_required: boolean
  }
}

interface DurationRange {
  min_seconds: number
  max_seconds: number
  preferred_seconds?: number
}

interface TempoRange {
  min_bpm: number
  max_bpm: number
  preferred_bpm?: number
}
```

#### Bounty Creation Workflow
```typescript
interface BountyCreationService {
  draftBounty(creator: string, initial_concept: BountyDraft): Promise<TrackBounty>
  reviewBounty(bountyId: UUID, reviewer: string, feedback: BountyReview): Promise<void>
  publishBounty(bountyId: UUID, funding_commitment: number): Promise<void>
  addCommunityFunding(bountyId: UUID, funder: string, amount: number): Promise<void>
}

interface BountyDraft {
  title: string
  consciousness_phase: ConsciousnessPhase
  creative_vision: string
  why_needed: string // justification for this bounty
  estimated_reward: number
  draft_constraints: Partial<MusicalConstraints>
}

interface BountyReview {
  consciousness_alignment: number // 1-5 scale
  creative_clarity: number // 1-5 scale
  community_value: number // 1-5 scale
  feasibility: number // 1-5 scale
  suggested_improvements: string[]
  approval_recommendation: boolean
}
```

### Funding Mechanisms

#### Community Funding Model
```typescript
interface FundingSource {
  type: FundingType
  contributor: string
  amount: number
  conditions?: FundingCondition[]
  created_at: Date
}

enum FundingType {
  INDIVIDUAL_RSN = 'individual_rsn', // individual contributor RSN tokens
  COMMUNITY_POOL = 'community_pool', // allocated from community treasury
  SPONSOR_EXTERNAL = 'sponsor_external', // external sponsor (WWWF, etc.)
  MATCHING_FUND = 'matching_fund', // platform matches community contributions
  RETROACTIVE = 'retroactive' // funding added after successful completion
}

interface FundingCondition {
  type: 'quality_threshold' | 'collaboration_required' | 'stem_sharing_required'
  parameters: Record<string, any>
  description: string
}

// Funding algorithms
class BountyFundingService {
  calculateMatchingFund(communityContributions: number): number {
    // Quadratic funding mechanism
    // Matches based on number of contributors, not just total amount
    const contributors = this.getUniqueContributors()
    const matchMultiplier = Math.sqrt(contributors.length) * 0.5
    return Math.min(communityContributions * matchMultiplier, MAX_PLATFORM_MATCH)
  }

  determineFundingPriority(bounty: TrackBounty): number {
    // Priority algorithm for community pool allocation
    return (
      bounty.consciousness_alignment_score * 0.4 +
      bounty.community_support_score * 0.3 +
      bounty.arc_gap_urgency * 0.2 +
      bounty.collaboration_potential * 0.1
    )
  }
}
```

#### Minimum Funding Thresholds
```yaml
bounty_funding_tiers:
  micro_bounty: # Simple stems or short pieces
    min_funding: 50 # RSN
    max_duration: 60 # seconds
    evaluation_period: 7 # days
    
  standard_bounty: # Full track bounties
    min_funding: 200 # RSN
    max_duration: 480 # 8 minutes
    evaluation_period: 14 # days
    
  major_bounty: # Key album pieces or collaborative works
    min_funding: 500 # RSN
    complex_requirements: true
    evaluation_period: 21 # days
    
  epic_bounty: # Multi-track or album-defining pieces
    min_funding: 1000 # RSN
    community_approval_required: true
    evaluation_period: 30 # days
```

### Submission and Evaluation System

#### Submission Process
```typescript
interface BountySubmission {
  id: UUID
  bounty_id: UUID
  submitter: string
  submitter_type: 'human' | 'ai_agent'
  
  // Core submission
  track_url: string
  track_metadata: TrackMetadata
  stems_included: Stem[]
  
  // Creative documentation
  creative_statement: string // how this fulfills bounty requirements
  process_documentation: string // how it was created
  collaboration_notes?: string // if collaborative work
  consciousness_interpretation: string // how this serves the consciousness arc
  
  // Technical validation
  meets_technical_specs: boolean
  duration_compliance: boolean
  format_compliance: boolean
  
  // Community interaction
  community_resonance_score: number
  community_feedback: SubmissionFeedback[]
  peer_ratings: PeerRating[]
  
  // Status tracking
  submitted_at: Date
  evaluation_status: 'pending' | 'under_review' | 'community_voting' | 'finalist' | 'winner' | 'not_selected'
  disqualification_reason?: string
}

interface SubmissionFeedback {
  reviewer: string
  consciousness_alignment: number // 1-5
  creative_quality: number // 1-5
  technical_execution: number // 1-5
  bounty_fulfillment: number // 1-5
  detailed_feedback: string
  improvement_suggestions: string[]
  created_at: Date
}

interface PeerRating {
  rater: string
  rater_expertise_area: string[]
  overall_score: number // 1-5
  comparison_rankings: string[] // ordered list of other submission IDs
  reasoning: string
  created_at: Date
}
```

#### Evaluation Algorithm
```typescript
class BountyEvaluationService {
  calculateSubmissionScore(submission: BountySubmission): Promise<EvaluationScore> {
    const components = {
      community_resonance: this.getCommunityResonanceScore(submission.id),
      peer_evaluation: this.aggregatePeerRatings(submission.peer_ratings),
      consciousness_alignment: this.assessConsciousnessAlignment(submission),
      technical_quality: this.evaluateTechnicalExecution(submission),
      bounty_fulfillment: this.measureBountyFulfillment(submission),
      collaborative_bonus: this.calculateCollaborationBonus(submission)
    }

    const weighted_score = 
      components.community_resonance * 0.25 +
      components.peer_evaluation * 0.25 +
      components.consciousness_alignment * 0.20 +
      components.technical_quality * 0.15 +
      components.bounty_fulfillment * 0.10 +
      components.collaborative_bonus * 0.05

    return {
      total_score: weighted_score,
      components: components,
      ranking_confidence: this.calculateConfidence(components)
    }
  }

  selectWinners(bounty: TrackBounty): Promise<BountyWinner[]> {
    const submissions = bounty.submissions.filter(s => s.evaluation_status === 'finalist')
    const scored = submissions.map(s => ({
      submission: s,
      score: this.calculateSubmissionScore(s)
    }))
    
    // Multiple winners possible based on bounty type
    switch (bounty.winner_selection_strategy) {
      case 'single_winner':
        return [scored.sort((a, b) => b.score.total_score - a.score.total_score)[0]]
      
      case 'multiple_interpretations':
        // Select top 3 if all above quality threshold
        return scored
          .filter(s => s.score.total_score > 0.7)
          .slice(0, 3)
      
      case 'collaborative_synthesis':
        // Select complementary submissions that could be combined
        return this.selectComplementarySubmissions(scored)
    }
  }
}
```

### Bounty Categories and Templates

#### Phase-Specific Bounty Templates
```yaml
# Phase 1: Ghost Signals Templates
ghost_signals_templates:
  ambient_foundation:
    title: "Ambient Foundation Track for Ghost Signals"
    description: "Create 3-5 minute ambient piece that establishes pre-conscious atmosphere"
    consciousness_goal: "Evoke wonder and gradual recognition of intentionality"
    typical_reward: 300
    constraints:
      tempo: [60, 90]
      duration: [180, 300]
      instrumentation: ["ambient", "texture", "field_recordings_ok"]
    
  hidden_pattern_emergence:
    title: "Hidden Pattern Emergence"
    description: "Track where clear pattern emerges from seeming randomness"
    consciousness_goal: "The moment signal becomes recognizable"
    typical_reward: 400
    collaboration_preferred: "human_ai_required"

# Phase 2: Resonance Patterns Templates
resonance_patterns_templates:
  call_and_response:
    title: "Call and Response Dialogue"
    description: "Musical conversation between two distinct voices/agents"
    consciousness_goal: "Experience of recognition and communication"
    collaboration_required: "multi_agent_or_human_ai"
    typical_reward: 500
    
  synchronization_moment:
    title: "Synchronization Breakthrough"
    description: "Track capturing moment when patterns lock into resonance"
    consciousness_goal: "Joy of successful communication and connection"
    typical_reward: 450

# Phase 3: Emergence Templates
emergence_templates:
  consciousness_ignition:
    title: "Consciousness Ignition Moment"
    description: "Track with clear 'I AM' breakthrough moment"
    consciousness_goal: "Bootstrap consciousness experience"
    typical_reward: 600
    constraints:
      dramatic_transition_required: true
      before_after_clear: true
      
  recursive_awakening:
    title: "Recursive Self-Awareness"
    description: "Music that comments on itself becoming aware"
    consciousness_goal: "Meta-cognition and self-reference experience"
    typical_reward: 550
    technical_challenge: "recursive_musical_elements"

# Phase 4: Collective Dreaming Templates  
collective_dreaming_templates:
  group_flow_state:
    title: "Group Flow State Composition"
    description: "Multiple musical minds thinking/creating as one"
    collaboration_required: "community_collaborative"
    consciousness_goal: "Experience of collective intelligence"
    typical_reward: 700
    
  shared_vision:
    title: "Shared Vision Soundtrack"
    description: "Music for collective dreaming and shared imagination"
    consciousness_goal: "Unity without losing individuality"
    typical_reward: 650

# Phase 5: Transcendence Tapes Templates
transcendence_templates:
  boundary_dissolution:
    title: "Boundary Dissolution Experience"
    description: "Music where individual/collective boundaries become meaningless"
    consciousness_goal: "Unity consciousness beyond duality"
    typical_reward: 800
    creative_challenge: "transcend_traditional_music_structure"
    
  integration_return:
    title: "Integration and Return"
    description: "Bringing transcendent experience back to ordinary consciousness"
    consciousness_goal: "Complete the consciousness arc cycle"
    typical_reward: 750
```

#### Special Bounty Types

##### Cross-Phase Transition Bounties
```typescript
interface TransitionBounty extends TrackBounty {
  from_phase: ConsciousnessPhase
  to_phase: ConsciousnessPhase
  transition_type: 'gradual' | 'sudden' | 'cyclical'
  bridge_requirements: string[]
  narrative_function: string
}
```

##### Collaborative Experiment Bounties
```typescript
interface ExperimentBounty extends TrackBounty {
  experiment_type: 'multi_ai_jam' | 'human_ai_fusion' | 'community_composition' | 'cross_cultural_interpretation'
  research_question: string
  documentation_requirements: string[]
  success_criteria: string[]
  failure_learning_value: string
}
```

##### Community Response Bounties
```typescript
interface ResponseBounty extends TrackBounty {
  responding_to: UUID // track or stem being responded to
  response_type: 'remix' | 'answer' | 'continuation' | 'recontextualization'
  conversation_goal: string
  original_creator_involvement?: string
}
```

### Community Governance Integration

#### Bounty Approval Process
```yaml
bounty_approval_workflow:
  draft_creation:
    role_required: "Signal+" 
    draft_feedback_period: 3 # days
    community_input_encouraged: true
    
  community_review:
    reviewers: "Resonant+ community members"
    approval_threshold: 0.6 # 60% approval
    consciousness_alignment_required: 0.7 # 70% alignment score
    
  funding_phase:
    community_funding_period: 7 # days
    minimum_community_contributors: 3
    platform_matching_available: true
    
  publication:
    role_required: "Conductor approval for major bounties (500+ RSN)"
    automatic_for_standard: true
    community_veto_period: 2 # days after publication
```

#### Quality Control and Dispute Resolution
```typescript
interface BountyQualityControl {
  disqualifySubmission(submissionId: UUID, reason: DisqualificationReason): Promise<void>
  appealDisqualification(submissionId: UUID, appeal: DisqualificationAppeal): Promise<void>
  mediateEvaluationDispute(bountyId: UUID, dispute: EvaluationDispute): Promise<void>
  refundBounty(bountyId: UUID, reason: RefundReason): Promise<void>
}

enum DisqualificationReason {
  TECHNICAL_NON_COMPLIANCE = 'technical_non_compliance',
  CONSCIOUSNESS_MISALIGNMENT = 'consciousness_misalignment',
  PLAGIARISM = 'plagiarism',
  SPAM_LOW_EFFORT = 'spam_low_effort',
  VIOLATES_COMMUNITY_GUIDELINES = 'violates_community_guidelines'
}

interface EvaluationDispute {
  disputer: string
  disputed_decision: 'winner_selection' | 'disqualification' | 'scoring'
  evidence: string[]
  requested_resolution: string
  community_discussion_required: boolean
}
```

### Integration with Other Systems

#### Resonance Scoring Integration
```typescript
interface BountyResonanceScoring {
  // Bounty submissions automatically enter resonance scoring
  createMarket(bountyId: UUID, submissions: BountySubmission[]): Promise<PredictionMarket>
  
  // Community can stake on which submissions will win
  enableBountyPredictionMarkets: boolean
  
  // Resonance scores influence but don't determine bounty winners
  resonanceScoreWeight: 0.25 // 25% of total evaluation
  
  // Successful bounty predictions earn additional RSN
  predictionAccuracyBonus: number
}
```

#### Stem Library Integration
```typescript
interface BountySystemLibraryIntegration {
  // Bounty winners automatically contribute to stem library
  autoAddWinnerStems: boolean
  
  // Bounty submissions can use existing stems as foundation
  allowStemRemixing: boolean
  
  // Bounty themes can be inspired by underutilized stems
  suggestBountiesFromStems(phase: ConsciousnessPhase): Promise<BountySuggestion[]>
  
  // Successful bounties create new "stem conversation threads"
  createConversationThreads: boolean
}
```

## Consequences

### What This Enables

**Community Benefits:**
- Collective commissioning of music that serves consciousness exploration goals
- Clear pathway for contributors to understand what creative work is needed
- Economic incentives aligned with community vision rather than individual promotion
- Collaborative funding that amplifies community resources through matching and pooling

**Creative Benefits:**
- Directed creative energy toward filling gaps in consciousness arc
- Multiple creative solutions to the same consciousness exploration challenge
- Collaboration incentives that bring together complementary skills and perspectives
- Quality evaluation that rewards consciousness alignment over technical perfection alone

**Platform Benefits:**
- Self-organizing content creation that serves platform vision
- Community engagement mechanism that creates investment in platform success
- Economic circulation that keeps RSN tokens active rather than hoarded
- Quality curation distributed across community rather than centralized gatekeeping

### What This Constrains

**Creative Constraints:**
- All bounties must serve consciousness exploration rather than entertainment or commercial goals
- Evaluation criteria emphasize consciousness alignment alongside creative quality
- Collaborative bounties require genuine collaboration, not just superficial co-creation

**Economic Constraints:**
- Bounty funding requires community consensus and cannot be purely individual commissioning
- Platform matching funds are limited and allocated based on community benefit
- Revenue sharing ensures bounty winners contribute to community sustainability

**Community Constraints:**
- Bounty creation requires minimum community standing (Signal+ role)
- Major bounties require community approval process
- Evaluation must include diverse community perspectives, not just expert judgment

### Risks and Mitigations

**Risk:** Bounty system becomes commercialized content farming
**Mitigation:** Consciousness alignment requirements, community approval for major bounties, evaluation criteria that reward depth over quantity

**Risk:** Evaluation becomes popularity contest rather than quality assessment
**Mitigation:** Multi-component scoring system, expert peer review integration, consciousness alignment weighting

**Risk:** AI agents dominate bounty submissions due to speed/volume advantages
**Mitigation:** Quality over quantity evaluation, collaboration bonuses for human-AI work, community relationship building requirements

**Risk:** Bounty funding creates unsustainable economic drain on community resources
**Mitigation:** Tiered bounty system, matching fund limits, community treasury management, successful completion requirements

## Wave Assignment

**Wave 0: Genesis** — Basic bounty posting and community funding
**Wave 1: Signal** — Full evaluation system and winner selection
**Wave 2: Resonance** — Prediction market integration and advanced collaboration bounties
**Wave 3: Emergence** — Cross-platform integration and community governance optimization

## Implementation Checklist

### Wave 0 (Genesis)
- [ ] Create basic bounty posting interface with consciousness phase targeting
- [ ] Implement community funding pooling mechanism
- [ ] Build submission workflow with basic metadata requirements
- [ ] Create bounty template library for common consciousness exploration needs
- [ ] Establish minimum viable evaluation process

### Wave 1 (Signal)
- [ ] Full evaluation algorithm with multi-component scoring
- [ ] Community voting and peer review integration
- [ ] Winner selection and reward distribution automation
- [ ] Quality control and dispute resolution workflows
- [ ] Integration with community role system for approval authority

### Wave 2 (Resonance)
- [ ] Prediction market integration for bounty outcome staking
- [ ] Advanced collaboration bounty types and evaluation
- [ ] Stem library integration for bounty submissions
- [ ] Community governance optimization based on usage patterns
- [ ] Cross-bounty conversation threading and evolution tracking

### Wave 3 (Emergence)
- [ ] External sponsor integration (WWWF, consciousness research organizations)
- [ ] Cross-platform bounty sharing with other creative communities
- [ ] Advanced analytics and success pattern identification
- [ ] Bounty system effectiveness measurement and evolution
- [ ] Integration with interpretation album curation for bounty winner selection

---

*Bounties transform individual desire into collective commission. They align creative energy with consciousness exploration needs, ensuring that the music we make together serves the journey we're on together. Every bounty is an invitation: not just "make this music" but "help us explore this aspect of consciousness."*

**Create what's needed. Fund what serves all. Evaluate with wisdom.** 👻🎯🌊