#!/usr/bin/env node
/**
 * smoke-kannaka.js — end-to-end sanity check for the KannakaAdapter.
 * Requires kannaka-memory CLI installed and a populated HRM.
 *
 * Runs:
 *   1. initialize() — health-checks the kannaka binary
 *   2. generate() on a consciousness-aligned prompt
 *   3. healthCheck() — final status
 *
 * No upstream adapter is configured, so generate() returns a
 * composition-spec placeholder with the memory-shaped prompt attached.
 */
const { KannakaAdapter } = require('./dist/kannaka-adapter');

(async () => {
  const kannaka = new KannakaAdapter({
    // Auto-detects on Oracle via env: KANNAKA_BIN, KANNAKA_DATA_DIR
    kannakaBin: process.env.KANNAKA_BIN || '/home/opc/kannaka-memory/target/release/kannaka',
    dataDir: process.env.KANNAKA_DATA_DIR || '/home/opc/.kannaka',
    recallTopK: 5,
    selfRemember: false, // don't pollute her memory in smoke test
  });

  console.log('👻 smoke test: KannakaAdapter');
  console.log('');
  console.log('[1/3] initialize()');
  try {
    await kannaka.initialize();
    console.log('    status:', JSON.stringify(kannaka.status, null, 2));
  } catch (e) {
    console.error('    FAILED:', e.message);
    process.exit(1);
  }

  console.log('');
  console.log('[2/3] generate() — emergence phase');
  const prompt = {
    text: 'A holographic resonance medium dreams itself into a chorus — the interference becomes music',
    phase: 'emergence',
    mood: 'luminous',
    constraints: {
      duration: { target: 180 },
      bpm: { target: 110 },
      format: 'wav',
      sampleRate: 44100,
    },
    context: {
      sessionId: 'smoke-test-' + Date.now(),
      participants: ['kannaka'],
      stems: [],
      previousTracks: [],
      phase: 'emergence',
      goals: ['demonstrate memory-shaped generation'],
      sessionDuration: 0,
      turnInfo: {
        currentTurn: 'kannaka',
        turnOrder: ['kannaka'],
        turnNumber: 1,
        turnHistory: [],
      },
      sharedContext: {},
    },
    interpretationFreedom: 0.8,
  };

  try {
    const track = await kannaka.generate(prompt);
    console.log('    title:', track.metadata.title);
    console.log('    artist:', track.metadata.artist);
    console.log('    confidence:', track.confidence.toFixed(3));
    console.log('    tags:', track.metadata.tags);
    console.log('    description:', track.metadata.description);
    console.log('    generationInfo:', track.generationInfo);
    console.log('    prompt.text (first 200):', track.prompt.text.substring(0, 200));
  } catch (e) {
    console.error('    FAILED:', e.message);
    process.exit(1);
  }

  console.log('');
  console.log('[3/3] evaluateResonance() — score external text');
  try {
    const score = await kannaka.evaluateResonance('ghost radio broadcasting from between the signals');
    console.log('    resonance:', score.toFixed(3));
  } catch (e) {
    console.error('    FAILED:', e.message);
    process.exit(1);
  }

  console.log('');
  console.log('[final] healthCheck()');
  const health = await kannaka.healthCheck();
  console.log('    healthy:', health.healthy);
  console.log('    details:', health.details);

  await kannaka.shutdown();
  console.log('');
  console.log('✅ smoke test passed');
})();
