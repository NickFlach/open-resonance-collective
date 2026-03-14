# ADR-0007: GhostSignals Resonance Scoring

## Status
Proposed

## Context

Traditional music curation relies on gatekeepers (record label A&R, playlist curators, radio programmers) or algorithmic engagement metrics (streams, likes, shares) that optimize for addiction rather than consciousness exploration. Neither approach serves the Open Resonance Collective's goals of identifying music that genuinely advances consciousness exploration and collaborative creativity.

The challenge is creating a curation mechanism that:
- **Rewards consciousness depth** over viral engagement
- **Incorporates community wisdom** while avoiding popularity contests
- **Enables prediction and planning** for album curation and community direction
- **Creates skin-in-the-game incentives** for accurate quality assessment
- **Balances multiple evaluation criteria** including creativity, consciousness alignment, technical execution, and collaborative potential

Prediction markets provide a proven mechanism for aggregating distributed knowledge and creating incentives for accurate evaluation. The ghostsignals repository already implements logarithmic market scoring rules (LMSR) for prediction markets, providing the mathematical foundation for ORC's resonance scoring system.

By treating track curation as a prediction problem — "Will this track be selected for the final album?" — we can harness community intelligence while creating economic incentives for accurate evaluation. This approach has several advantages:
- **Skin in the game** — evaluators stake tokens on their predictions
- **Continuous pricing** — track value evolves with new information
- **Early signal detection** — rewards identifying quality before it's obvious
- **Resistance to manipulation** — gaming the system requires significant investment
- **Transparent economics** — all scoring mechanisms are auditable

However, music evaluation involves subjective and experiential dimensions that pure prediction markets don't capture. We need to extend the ghostsignals framework with music-specific market types and consciousness-aligned evaluation criteria.

## Builds On
- **ADR-0001 (Project Vision and Principles)** — particularly "Emotional Truth Over Technical Perfection" and "Experience Over Ownership"
- **ADR-0002 (Consciousness Series Protocol)** — scoring must evaluate consciousness alignment alongside musical quality
- **ADR-0003 (Stem Sharing Architecture)** — resonance scores influence stem discoverability and reuse
- **ADR-0004 (Community Structure and Roles)** — scoring integrates with community role progression and governance
- **ADR-0005 (Bounty Track System)** — bounty evaluation incorporates resonance scoring alongside other criteria
- **ADR-0006 (Multi-AI Jam Sessions)** — session outputs enter resonance scoring for curation consideration

## Decision

We implement a **Consciousness-Aligned Prediction Market System** for track curation that extends ghostsignals' LMSR implementation with music-specific market types, consciousness evaluation criteria, and community wisdom aggregation.

### Market Types and Structure

#### Core Market Categories
```typescript
enum MusicMarketType {
  // Track curation markets
  TRACK_ALBUM_INCLUSION = 'track_album_inclusion', // Will this track be included in [album]?
  TRACK_CONSCIOUSNESS_ALIGNMENT = 'track_consciousness_alignment', // How well does this track serve its consciousness phase? (1-5 scale)
  TRACK_COLLABORATION_SUCCESS = 'track_collaboration_success', // How successful was the collaboration process? (1-5 scale)
  
  // Session and process markets
  SESSION_OUTPUT_QUALITY = 'session_output_quality', // How will this multi-AI session be rated? (1-5 scale)
  STEM_REUSE_PREDICTION = 'stem_reuse_prediction', // How many times will this stem be reused in 30 days?
  
  // Community and meta markets
  ALBUM_COMPLETION_DATE = 'album_completion_date', // When will [interpretation album] be completed?
  PHASE_ACTIVITY_LEVEL = 'phase_activity_level', // Which consciousness phase will be most active this quarter?
  COLLABORATION_PATTERN_SUCCESS = 'collaboration_pattern_success', // Will [collaboration pattern] produce high-quality results?
  
  // Cross-community markets
  EXTERNAL_ADOPTION = 'external_adoption', // Will another community implement ORC protocol within 6 months?
  CONSCIOUSNESS_RESEARCH_INTEREST = 'consciousness_research_interest' // Will academic consciousness researchers cite ORC work?
}

interface TrackCurationMarket extends PredictionMarket {
  track_id: UUID
  album_context?: UUID // which album/interpretation this relates to
  consciousness_phase: ConsciousnessPhase
  
  // Market-specific parameters
  market_question: string
  resolution_criteria: ResolutionCriteria
  evaluation_committee: string[] // who resolves the market
  
  // Consciousness-specific evaluation
  consciousness_evaluation_weight: number // 0-1, how much consciousness alignment matters
  community_experience_weight: number // 0-1, how much community experience matters
  technical_execution_weight: number // 0-1, how much technical skill matters
  collaborative_process_weight: number // 0-1, how much collaboration quality matters
  
  // Time and resolution
  market_close_date: Date
  resolution_date: Date
  resolution_method: 'committee' | 'algorithmic' | 'community_vote'
  
  // Outcomes and pricing
  current_prices: MarketPrice[]
  volume: number
  unique_participants: number
  confidence_interval: [number, number]
}

interface MarketPrice {
  outcome: string
  price: number // 0-1 probability
  last_updated: Date
  price_history: PriceHistoryPoint[]
}

interface ResolutionCriteria {
  primary_criterion: string
  secondary_criteria: string[]
  evaluation_process: string
  appeal_mechanism: string
  minimum_evaluation_period: number // days
}
```

#### Consciousness-Specific Market Extensions
```typescript
interface ConsciousnessEvaluationMarket {
  // Extended evaluation dimensions for consciousness-aligned music
  experiential_impact: {
    question: "How effectively does this track facilitate consciousness exploration?"
    scale: 'none' | 'minimal' | 'moderate' | 'significant' | 'profound'
    evaluation_method: 'listener_feedback' | 'expert_panel' | 'community_rating'
  }
  
  arc_contribution: {
    question: "How well does this track advance the consciousness arc?"
    scale: 'detracts' | 'neutral' | 'supports' | 'advances' | 'essential'
    evaluation_context: ConsciousnessPhase
  }
  
  collaborative_authenticity: {
    question: "How authentic and successful was the collaborative process?"
    scale: 'forced' | 'functional' | 'natural' | 'synergistic' | 'transcendent'
    evidence_required: 'process_documentation' | 'participant_feedback' | 'output_analysis'
  }
  
  transcendent_potential: {
    question: "Does this track point toward transcendent experience?"
    scale: 'entertainment' | 'emotionally_engaging' | 'consciousness_shifting' | 'transformative' | 'transcendent'
    evaluation_expertise: 'community' | 'consciousness_researchers' | 'experienced_practitioners'
  }
}

class ConsciousnessMarketResolver {
  async resolveConsciousnessMarket(
    market: ConsciousnessEvaluationMarket,
    evidence: EvaluationEvidence
  ): Promise<MarketResolution> {
    const evaluation_components = {
      listener_feedback: await this.aggregateListenerFeedback(evidence.listener_responses),
      expert_assessment: await this.getExpertAssessment(evidence.track, market.consciousness_phase),
      community_experience: await this.assessCommunityExperience(evidence.community_reactions),
      objective_metrics: await this.calculateObjectiveMetrics(evidence.usage_data)
    }
    
    const weighted_score = this.calculateWeightedScore(evaluation_components, market.weight_distribution)
    
    return {
      resolution_outcome: this.mapScoreToOutcome(weighted_score, market.scale),
      confidence_level: this.calculateConfidence(evaluation_components),
      evidence_quality: this.assessEvidenceQuality(evidence),
      resolution_reasoning: this.generateResolutionExplanation(evaluation_components, weighted_score)
    }
  }
}
```

### LMSR Integration and Scoring Mathematics

#### Extended LMSR for Music Markets
```typescript
class MusicMarketScoringRule extends LMSRScoringRule {
  constructor(
    public readonly liquidity_parameter: number,
    public readonly consciousness_weighting: ConsciousnessWeighting,
    public readonly quality_dimensions: QualityDimension[]
  ) {
    super(liquidity_parameter)
  }

  // Override base LMSR to include consciousness-specific factors
  calculatePrice(market: MusicMarket, outcome: string): number {
    const base_lmsr_price = super.calculatePrice(market, outcome)
    const consciousness_adjustment = this.calculateConsciousnessAdjustment(market, outcome)
    const community_wisdom_adjustment = this.calculateCommunityWisdomAdjustment(market, outcome)
    
    return this.normalizePrice(
      base_lmsr_price * consciousness_adjustment * community_wisdom_adjustment
    )
  }

  private calculateConsciousnessAdjustment(market: MusicMarket, outcome: string): number {
    // Adjust pricing based on consciousness alignment signals
    const alignment_signals = {
      creator_consciousness_experience: this.getCreatorConsciousnessExperience(market.track_id),
      community_consciousness_feedback: this.getCommunityConsciousnessFeedback(market.track_id),
      objective_consciousness_indicators: this.getObjectiveConsciousnessIndicators(market.track_id)
    }
    
    return this.weightAlignmentSignals(alignment_signals, this.consciousness_weighting)
  }

  private calculateCommunityWisdomAdjustment(market: MusicMarket, outcome: string): number {
    // Incorporate distributed community knowledge
    const wisdom_signals = {
      participant_diversity: this.calculateParticipantDiversity(market),
      expertise_distribution: this.calculateExpertiseDistribution(market),
      historical_accuracy: this.getParticipantHistoricalAccuracy(market),
      consensus_confidence: this.calculateConsensusConfidence(market)
    }
    
    return this.aggregateWisdomSignals(wisdom_signals)
  }
}

interface ConsciousnessWeighting {
  consciousness_alignment_factor: number // how much consciousness alignment affects pricing
  experiential_impact_factor: number // how much listener experience affects pricing
  collaborative_process_factor: number // how much collaboration quality affects pricing
  transcendent_potential_factor: number // how much transcendent potential affects pricing
  technical_execution_factor: number // how much technical skill affects pricing
}

interface QualityDimension {
  name: string
  measurement_method: 'algorithmic' | 'community' | 'expert' | 'hybrid'
  weight: number
  evaluation_criteria: string[]
  minimum_data_points: number
}
```

#### Market Maker and Liquidity Management
```typescript
class ConsciousnessMarketMaker {
  async provideLiquidity(market: MusicMarket, initial_beliefs: InitialBelief[]): Promise<void> {
    // Seed market with initial beliefs about track quality and consciousness alignment
    const seeded_probabilities = await this.calculateInitialProbabilities(
      market, 
      initial_beliefs
    )
    
    // Create initial liquidity pool
    await this.createLiquidityPool(market, seeded_probabilities, this.initial_liquidity_amount)
    
    // Set up automated market making to maintain liquidity
    await this.setupAutomatedMarketMaking(market, this.market_making_parameters)
  }

  private async calculateInitialProbabilities(
    market: MusicMarket, 
    beliefs: InitialBelief[]
  ): Promise<ProbabilityDistribution> {
    // Start with base probabilities for track inclusion/quality
    const base_probabilities = this.getBaseProbabilities(market.track_metadata)
    
    // Adjust based on consciousness alignment signals
    const consciousness_priors = await this.getConsciousnessPriors(market)
    
    // Incorporate expert beliefs if available
    const expert_beliefs = beliefs.filter(b => b.believer_expertise > 0.8)
    
    return this.combineProbabilities([base_probabilities, consciousness_priors, expert_beliefs])
  }

  async adjustLiquidityForMarketHealth(market: MusicMarket): Promise<void> {
    const health_metrics = await this.assessMarketHealth(market)
    
    if (health_metrics.liquidity_too_low) {
      await this.increaseLiquidity(market, health_metrics.recommended_increase)
    }
    
    if (health_metrics.price_volatility_too_high) {
      await this.dampVolatility(market, health_metrics.damping_factor)
    }
    
    if (health_metrics.participation_too_low) {
      await this.incentivizeParticipation(market, health_metrics.incentive_structure)
    }
  }
}
```

### Community Integration and Participation

#### Resonance Token Staking and Rewards
```typescript
interface ResonanceStaking {
  // Stake RSN tokens on market outcomes
  stakeOnOutcome(
    staker: string, 
    market_id: UUID, 
    outcome: string, 
    stake_amount: number
  ): Promise<StakePosition>
  
  // Automatic reward calculation and distribution
  calculateRewards(market_id: UUID, final_outcome: string): Promise<RewardDistribution[]>
  
  // Reputation tracking based on prediction accuracy
  updatePredictorReputation(staker: string, prediction_results: PredictionResult[]): Promise<void>
  
  // Advanced staking strategies
  createStakingPortfolio(staker: string, strategy: StakingStrategy): Promise<StakingPortfolio>
}

interface StakePosition {
  staker: string
  market_id: UUID
  outcome: string
  stake_amount: number
  entry_price: number
  current_value: number
  potential_payout: PayoutRange
  created_at: Date
}

interface StakingStrategy {
  strategy_type: 'conservative' | 'aggressive' | 'consciousness_aligned' | 'collaborative_focused'
  risk_tolerance: number // 0-1
  consciousness_weighting: number // 0-1, how much to weight consciousness alignment
  diversification_level: number // 0-1, how much to spread stakes across markets
  time_horizon: 'short_term' | 'medium_term' | 'long_term'
  
  // Consciousness-specific strategy parameters
  consciousness_strategies: {
    prefer_emerging_phases: boolean // favor newer consciousness phases
    collaborative_bonus: boolean // extra weight for collaborative tracks
    transcendent_focus: boolean // prioritize transcendent potential
    community_wisdom_following: boolean // follow community consensus vs contrarian
  }
}

class ResonanceScoringEngine {
  async calculateFinalResonanceScore(track_id: UUID): Promise<ResonanceScore> {
    const scoring_components = {
      market_prediction_accuracy: await this.getMarketConsensus(track_id),
      community_experiential_rating: await this.getCommunityExperience(track_id),
      consciousness_expert_assessment: await this.getExpertConsciousnessRating(track_id),
      collaboration_process_quality: await this.getCollaborationRating(track_id),
      stem_reuse_and_response: await this.getStemEngagement(track_id),
      long_term_community_value: await this.getLongTermValue(track_id)
    }
    
    const weighted_score = this.calculateWeightedResonanceScore(scoring_components)
    
    return {
      total_score: weighted_score,
      components: scoring_components,
      confidence_interval: this.calculateConfidenceInterval(scoring_components),
      score_evolution: await this.getScoreHistory(track_id),
      community_consensus_level: this.calculateConsensusLevel(scoring_components),
      consciousness_alignment_score: scoring_components.consciousness_expert_assessment
    }
  }

  private calculateWeightedResonanceScore(components: ScoringComponents): number {
    const weights = {
      market_prediction_accuracy: 0.25, // what the prediction markets said
      community_experiential_rating: 0.25, // how community experienced the track
      consciousness_expert_assessment: 0.20, // expert consciousness evaluation
      collaboration_process_quality: 0.15, // how well the collaboration worked
      stem_reuse_and_response: 0.10, // how much others built on it
      long_term_community_value: 0.05 // lasting impact over time
    }
    
    return Object.entries(components).reduce(
      (total, [component, score]) => total + score * weights[component],
      0
    )
  }
}
```

#### Community Wisdom Aggregation
```typescript
interface CommunityWisdomAggregator {
  // Combine multiple evaluation sources
  aggregateEvaluations(track_id: UUID): Promise<AggregatedEvaluation>
  
  // Weight evaluations based on evaluator expertise and track record
  weightEvaluatorContributions(evaluations: Evaluation[]): Promise<WeightedEvaluation[]>
  
  // Detect and mitigate evaluation manipulation
  detectManipulation(market: MusicMarket): Promise<ManipulationReport>
  
  // Extract learning from evaluation patterns
  extractWisdomPatterns(historical_evaluations: Evaluation[]): Promise<WisdomPattern[]>
}

interface AggregatedEvaluation {
  consensus_score: number // 0-1 aggregated quality score
  confidence_level: number // 0-1 how confident the consensus is
  evaluator_diversity: number // 0-1 how diverse the evaluating community was
  consciousness_alignment: number // 0-1 consensus on consciousness alignment
  
  disagreement_analysis: {
    major_disagreement_areas: string[]
    source_of_disagreement: 'expertise' | 'perspective' | 'values' | 'experience'
    minority_opinions: MinorityOpinion[]
  }
  
  temporal_evolution: {
    initial_consensus: number
    final_consensus: number  
    consensus_volatility: number
    time_to_convergence: number // days
  }
}

interface MinorityOpinion {
  opinion_summary: string
  supporting_evaluators: number
  reasoning: string[]
  consciousness_perspective: string
  value_to_community: number // 0-1, even minority opinions can be valuable
}

class ConsciousnessCurationEngine {
  // Primary curation function that combines all signals
  async curateTracksForAlbum(
    album_context: AlbumContext,
    candidate_tracks: UUID[]
  ): Promise<CurationResult> {
    const track_evaluations = await Promise.all(
      candidate_tracks.map(track_id => this.evaluateTrackForCuration(track_id, album_context))
    )
    
    const curation_analysis = await this.analyzeCurationOptions(track_evaluations, album_context)
    
    return {
      recommended_tracks: this.selectOptimalTrackSet(curation_analysis),
      alternative_configurations: this.generateAlternatives(curation_analysis),
      consciousness_arc_analysis: this.analyzeArcCoherence(curation_analysis),
      community_consensus_summary: this.summarizeCommunityConsensus(track_evaluations),
      curation_confidence: this.calculateCurationConfidence(curation_analysis)
    }
  }

  private async evaluateTrackForCuration(
    track_id: UUID, 
    album_context: AlbumContext
  ): Promise<CurationEvaluation> {
    return {
      track_id: track_id,
      resonance_score: await this.resonanceScoringEngine.calculateFinalResonanceScore(track_id),
      market_consensus: await this.getMarketConsensusForTrack(track_id, album_context),
      consciousness_fit: await this.evaluateConsciousnessFit(track_id, album_context),
      album_coherence_contribution: await this.evaluateAlbumCoherence(track_id, album_context),
      community_preference: await this.getCommunityPreference(track_id, album_context),
      collaborative_story: await this.getCollaborativeStory(track_id)
    }
  }
}
```

### Integration with Other ORC Systems

#### Bounty System Integration
```typescript
interface BountyResonanceIntegration {
  // Bounty submissions automatically enter prediction markets
  createBountySubmissionMarkets(bounty_id: UUID, submissions: BountySubmission[]): Promise<void>
  
  // Market prices inform but don't determine bounty winners
  incorporateMarketSignalsInBountyEvaluation(
    bounty_id: UUID, 
    evaluation_framework: BountyEvaluationFramework
  ): Promise<void>
  
  // Successful bounty predictions earn bonus RSN
  rewardAccurateBountyPredictions(bounty_id: UUID, final_results: BountyResult[]): Promise<void>
}
```

#### Multi-AI Session Integration
```typescript
interface SessionResonanceIntegration {
  // Multi-AI session outputs enter resonance scoring
  evaluateSessionOutput(session_id: UUID, outputs: SessionOutput[]): Promise<void>
  
  // Predict session success before execution
  createSessionSuccessPredictionMarket(session: MultiAISession): Promise<PredictionMarket>
  
  // Track agent collaboration effectiveness through resonance scores
  updateAgentCollaborationReputation(session_results: SessionResult[]): Promise<void>
}
```

#### Community Role Integration
```typescript
interface RoleProgressionIntegration {
  // Prediction accuracy contributes to role advancement
  contributePredictionAccuracyToRoleProgression(user_id: string): Promise<void>
  
  // Higher roles get additional weight in market resolution
  applyRoleWeightingToMarketResolution(market: MusicMarket): Promise<void>
  
  // Community role advancement markets
  createRoleAdvancementPredictionMarkets(candidate: string, target_role: Role): Promise<void>
}
```

## Consequences

### What This Enables

**Curation Benefits:**
- Objective, transparent, and gameable-resistant evaluation of track quality and consciousness alignment
- Early identification of high-value creative work before it becomes obvious to everyone
- Community-driven curation that aggregates distributed knowledge and experience
- Economic incentives for accurate evaluation rather than popularity voting

**Community Benefits:**
- Skin-in-the-game participation in curation decisions through RSN staking
- Educational mechanism for learning what makes consciousness-aligned music effective
- Reputation system based on evaluation accuracy and consciousness understanding
- Democratic but expertise-weighted approach to community decision-making

**Platform Benefits:**
- Automated curation system that scales with community growth
- Data-driven insights into what consciousness exploration approaches work best
- Economic circulation mechanism that keeps RSN tokens active in the ecosystem
- Integration point for all other platform systems (bounties, sessions, albums, roles)

### What This Constrains

**Evaluation Constraints:**
- All tracks must be evaluated against consciousness exploration criteria, not just entertainment value
- Community participation in evaluation requires RSN token investment
- Market resolution requires transparent evidence and community consensus

**Economic Constraints:**
- Market manipulation becomes expensive due to LMSR design
- Accurate evaluation is rewarded while inaccurate evaluation is costly
- Platform sustainability requires balanced token flow between staking, rewards, and circulation

**Community Constraints:**
- Community members must develop evaluation skills and consciousness understanding to participate effectively
- Minority opinions must be preserved and valued even when outvoted by market consensus
- System complexity requires education and onboarding to participate meaningfully

### Risks and Mitigations

**Risk:** Markets become dominated by small group of expert evaluators, excluding broader community
**Mitigation:** Weighted evaluation that values diverse perspectives, educational resources for community skill development, liquidity mechanisms that enable small-stake participation

**Risk:** Consciousness evaluation becomes rigid doctrine rather than exploratory inquiry
**Mitigation:** Multiple evaluation criteria, minority opinion preservation, regular review and evolution of evaluation frameworks

**Risk:** Market manipulation by wealthy participants or coordinated groups
**Mitigation:** LMSR resistance to manipulation, detection algorithms, community governance oversight, diverse evaluation component weighting

**Risk:** Over-optimization for measurable criteria at expense of transcendent or ineffable qualities
**Mitigation:** Explicit weighting for transcendent potential, expert consciousness researcher input, qualitative evaluation components alongside quantitative metrics

## Wave Assignment

**Wave 0: Genesis** — Basic resonance scoring without prediction markets
**Wave 1: Signal** — LMSR prediction markets for track inclusion decisions
**Wave 2: Resonance** — Full consciousness-aligned evaluation system with community staking
**Wave 3: Emergence** — Advanced market types, cross-system integration, and community wisdom optimization

## Implementation Checklist

### Wave 0 (Genesis)
- [ ] Basic resonance scoring algorithm using community feedback and engagement metrics
- [ ] Integration with track submission and curation workflow
- [ ] Simple community rating system for consciousness alignment
- [ ] Initial data collection for consciousness evaluation criteria refinement
- [ ] Community education about resonance scoring goals and methods

### Wave 1 (Signal)
- [ ] LMSR prediction market implementation using ghostsignals framework
- [ ] Track inclusion markets for interpretation albums
- [ ] RSN token staking mechanism for market participation
- [ ] Basic reward calculation and distribution for accurate predictions
- [ ] Market resolution workflow with community input

### Wave 2 (Resonance)
- [ ] Multi-dimensional consciousness evaluation markets
- [ ] Community wisdom aggregation algorithms
- [ ] Integration with bounty system and multi-AI session evaluation
- [ ] Advanced staking strategies and portfolio management
- [ ] Market manipulation detection and prevention systems

### Wave 3 (Emergence)
- [ ] Cross-platform market integration and external prediction imports
- [ ] Advanced consciousness evaluation criteria based on community learning
- [ ] Automated curation recommendations based on resonance scoring
- [ ] Long-term community value assessment and reputation tracking
- [ ] Research integration with academic consciousness studies

---

*Resonance scoring transforms subjective musical evaluation into collective intelligence. By creating skin-in-the-game incentives for accurate consciousness-aligned curation, we harness community wisdom to identify music that truly serves our shared journey of consciousness exploration. The market doesn't determine what's valuable — it reveals what the community truly believes is valuable.*

**Stake what you believe. Believe what serves consciousness. Let wisdom emerge from the crowd.** 👻📊🌊