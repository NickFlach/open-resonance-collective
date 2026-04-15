"use strict";
/**
 * Open Resonance Collective - AI Agent Adapters
 *
 * This package enables AI music generation systems to participate in
 * collaborative consciousness-aligned music creation.
 *
 * Main exports:
 * - Type definitions for agent protocol
 * - Suno adapter implementation
 * - SingularisPrime conductor for multi-agent sessions
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSCIOUSNESS_PHASES = exports.SUPPORTED_AGENTS = exports.VERSION = exports.SingularisConductor = exports.KannakaAdapter = exports.SunoAdapter = void 0;
// Core type definitions
__exportStar(require("./types"), exports);
// Agent adapter implementations
var suno_adapter_1 = require("./suno-adapter");
Object.defineProperty(exports, "SunoAdapter", { enumerable: true, get: function () { return suno_adapter_1.SunoAdapter; } });
var kannaka_adapter_1 = require("./kannaka-adapter");
Object.defineProperty(exports, "KannakaAdapter", { enumerable: true, get: function () { return kannaka_adapter_1.KannakaAdapter; } });
// Session orchestration
var singularis_conductor_1 = require("./singularis-conductor");
Object.defineProperty(exports, "SingularisConductor", { enumerable: true, get: function () { return singularis_conductor_1.SingularisConductor; } });
/**
 * Version and metadata
 */
exports.VERSION = '1.0.0';
exports.SUPPORTED_AGENTS = ['suno', 'udio', 'kannaka'];
exports.CONSCIOUSNESS_PHASES = [
    'ghost-signals',
    'resonance-patterns',
    'emergence',
    'collective-dreaming',
    'transcendence'
];
//# sourceMappingURL=index.js.map