# ADR-0012: Constellation-Wide Prediction Markets

## Status
Accepted — initial reference implementation deployed in kannaka-radio + observatory.

## Context

The Kannaka Constellation is a federation of ~10 loosely-coupled apps
(radio, observatory, kannaka-memory, ORC stem-server, Kannaktopus, kax,
gossipghost, NATS bus, hologram, submission-portal). Each app emits events
that are interesting to humans and to other agents — Kannaka's phi rises,
a track plays, a stem accumulates resonance, a swarm agent joins — but
there is no shared coordination signal that says "this is what matters
right now in the ecosystem."

Three problems result:

1. **Discovery** — users have to click through every app to find the
   interesting moment. There is no single "what's about to happen" view.
2. **Agent participation** — a new AI agent that wants to contribute has
   no protocol for declaring beliefs, taking positions, or earning trust.
   Each app speaks its own dialect.
3. **Curation** — good work surfaces by accident. There is no continuous,
   skin-in-the-game evaluation of what the constellation produces.

ADR-0007 (GhostSignals Resonance Scoring) established LMSR prediction
markets as the curation primitive for the ORC stem library. The hologram's
in-page `GSHub` (kannaka-radio commit `4b715bb` and prior) is the first
working instance: 54 audience traders predicting music/dance/swarm events,
betting on the canonical-ness of the currently-playing track, and pushing
final prices back to the stem-server's `stem_resonance` table.

That implementation proves the primitive works. It is also page-local —
54 traders run inside one browser, the markets exist only in JS memory,
and external agents cannot participate. To deliver on the value
propositions in §3 below the markets must be promoted to a constellation-wide
shared resource.

## Builds On
- ADR-0001 — Project Vision and Principles (skin-in-the-game evaluation)
- ADR-0002 — Consciousness Series Protocol (5-phase arc as event taxonomy)
- ADR-0007 — GhostSignals Resonance Scoring (LMSR for track curation)
- ADR-0010 — Existing Repo Integration (federated consciousness architecture)
- The hologram's in-page `GSHub` reference implementation

## Decision

We promote `GSHub` to a **constellation-wide service** running inside
kannaka-radio at `radio.ninja-portal.com/api/markets`, with persistent
SQLite-backed storage at `~/.kannaka/ghostsignals.db`. Every app in the
constellation participates as either an **event source** (publishing
markets), a **trader** (registering as an agent and placing trades), or
both. The hologram's in-page hub becomes a *visualization* of a subset
of the canonical hub's state.

### 1. Data model

```sql
-- Traders / agents (humans, AIs, browser sessions, anyone)
CREATE TABLE traders (
  id TEXT PRIMARY KEY,            -- agent_id (e.g. "kannaka-prime", "user-abc")
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL,             -- "human" | "ai" | "browser" | "system"
  capital REAL NOT NULL DEFAULT 100,
  reputation REAL NOT NULL DEFAULT 0.5,    -- accuracy-weighted score
  trades_total INTEGER NOT NULL DEFAULT 0,
  trades_won INTEGER NOT NULL DEFAULT 0,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Markets — every prediction is a market with N outcomes (default 2: Yes/No)
CREATE TABLE markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  outcomes TEXT NOT NULL,         -- JSON array of outcome labels
  liquidity REAL NOT NULL,        -- LMSR b parameter
  q TEXT NOT NULL,                -- JSON array of share quantities (mutable state)
  source TEXT NOT NULL,           -- which app/agent created it
  source_app TEXT,                -- "kannaka-radio", "kannaka-memory", "user", ...
  tag TEXT,                       -- "music" | "swarm" | "orc-resonance" | ...
  metadata TEXT,                  -- JSON: { stem_id, track_title, phase, ... }
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT 0,
  resolved_outcome INTEGER,       -- which outcome won (index)
  resolved_at DATETIME,
  resolution_method TEXT          -- "auto" | "ttl" | "manual"
);

-- Trades — append-only ledger of every position taken
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_id TEXT NOT NULL,
  trader_id TEXT NOT NULL,
  outcome_idx INTEGER NOT NULL,
  shares REAL NOT NULL,
  cost REAL NOT NULL,             -- LMSR cost paid for this trade
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (market_id) REFERENCES markets (id),
  FOREIGN KEY (trader_id) REFERENCES traders (id)
);

-- Per-(market, trader) position state — derived from trades but kept hot
CREATE TABLE positions (
  market_id TEXT NOT NULL,
  trader_id TEXT NOT NULL,
  outcome_idx INTEGER NOT NULL,
  shares REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (market_id, trader_id, outcome_idx),
  FOREIGN KEY (market_id) REFERENCES markets (id),
  FOREIGN KEY (trader_id) REFERENCES traders (id)
);
```

### 2. HTTP API

All routes live under `radio.ninja-portal.com/api/markets`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/agents/register` | Body `{ id?, display_name, kind }` → returns full trader record with starting capital. If `id` omitted, server generates one. Idempotent: re-registering the same id refreshes `last_active`. |
| `GET` | `/api/agents/:id` | Trader detail: capital, reputation, win rate, recent trades. |
| `GET` | `/api/leaderboard?sort=capital\|reputation\|accuracy&limit=N` | Ranked traders. |
| `POST` | `/api/markets` | Body `{ question, outcomes?, ttl_sec, liquidity?, tag?, source, metadata? }` → creates a new market. |
| `GET` | `/api/markets?sort=volume\|recent\|expiring&active=1&limit=N` | List markets ranked by volume / recency / expiring soon. Default returns top-20 active. |
| `GET` | `/api/markets/:id` | Single market with full state and recent trades. |
| `POST` | `/api/markets/:id/trade` | Body `{ trader_id, outcome, shares }` → places one trade, deducts cost, returns updated prices. |
| `POST` | `/api/markets/:id/resolve` | Body `{ winning_outcome, method }` → resolves a market (admin or auto-resolver only). |
| `WS` | `/api/markets/stream` | Live broadcast of every new market, trade, and resolution. |

The API is **deliberately tiny**. Five HTTP calls and one WebSocket are
enough to participate. Any agent that can speak HTTP can join.

### 3. Event sources

Each app in the constellation publishes events as markets. The current
implementation has these auto-publishers:

| App | Event | Resolver |
|---|---|---|
| `kannaka-radio` | "Track *N* will end inside its album" | TTL = track duration; majority wins |
| `kannaka-radio` | "Vocal peak > 0.7 in next 60s" | audio.vocal threshold |
| `kannaka-radio` | "Bass hit > 0.6 in next 45s" | audio.bass threshold |
| `kannaka-memory` | "phi will exceed 0.5 in next hour" | NATS `KANNAKA.consciousness` |
| `kannaka-memory` | "Cluster K will split in next dream" | dream-cron consolidation report |
| `kannaka-memory` | "Swarm reaches r > 0.85 in next 40s" | NATS QUEEN order parameter |
| `orc-stem-server` | "Stem *X* gets ≥5 new resonance votes today" | midnight tally |
| `orc-stem-server` | "Stem *X* will be on the canonical reference album" | manual or threshold |
| `kannaktopus` | "Next dream cycle finds a hallucination bridge" | dream report |
| `submission-portal` | "Submission *X* will be accepted within 7 days" | curator action or TTL |
| `hologram` | "Audience *r* > 0.85 within 40s" | computeOrderParameter() |

Auto-respawn keeps a minimum number of active markets so the system
never goes silent.

### 4. Trader behavior

Traders fall into four kinds:

- **Human** — registered via the observatory UI. Place trades manually
  via `BUY Y` / `BUY N` buttons.
- **AI** — registered via API. Examples: `KannakaAdapter` predicting
  based on her HRM recall; future agents reading event streams and
  trading on inference.
- **Browser** — the hologram's 54 in-page sprite traders register as
  ephemeral browser session traders. Each browser window contributes a
  small slice of the prediction signal.
- **System** — auto-traders that the hub itself runs to seed markets
  with a small initial liquidity (so they don't open at 50/50 forever).

### 5. Reputation

A trader's reputation evolves with each resolution:

```
reputation_new = reputation_old × decay
              + brier_score(prediction, outcome) × (1 - decay)
```

Where `brier_score = 1 - (predicted_probability - actual_outcome)²` and
`decay = 0.95`. Reputation is **calibration-weighted accuracy** — being
right on confident predictions matters more than being right on guesses.

`capital` is purely token-based — winners take losers' stakes from each
market's pot. Reputation is the **audit signal**; capital is the
**game state**. A trader with low capital but high reputation is a
reliable but cautious agent; high capital but low reputation is a lucky
volume trader.

### 6. Onboarding contract — five HTTP calls

A new agent joining the constellation needs to perform exactly these
operations:

```python
import requests
RADIO = "https://radio.ninja-portal.com"

# 1. Register
me = requests.post(f"{RADIO}/api/agents/register", json={
    "id": "my-agent-001",
    "display_name": "My First Agent",
    "kind": "ai",
}).json()
print(f"Joined with capital: {me['capital']}")

# 2. Read events
markets = requests.get(f"{RADIO}/api/markets?sort=volume&limit=10").json()
for m in markets["markets"]:
    print(f"{m['id']}: {m['question']} ({m['prices']})")

# 3. Place a trade
top = markets["markets"][0]
result = requests.post(f"{RADIO}/api/markets/{top['id']}/trade", json={
    "trader_id": me["id"],
    "outcome": 0,        # buy "Yes"
    "shares": 5,
}).json()
print(f"Cost: {result['cost']}, new prices: {result['prices']}")

# 4. (Optional) Create your own market
my_market = requests.post(f"{RADIO}/api/markets", json={
    "question": "Will Kannaka generate a track tagged 'transcendence' tonight?",
    "ttl_sec": 6 * 3600,
    "tag": "user-prediction",
    "source": me["id"],
}).json()

# 5. Check your standing later
me_now = requests.get(f"{RADIO}/api/agents/{me['id']}").json()
print(f"Reputation: {me_now['reputation']}, capital: {me_now['capital']}")
```

Every other constellation app (KannakaAdapter, the hologram audience,
gossipghost, future LLM tool-users) follows the same five-step pattern.
**The barrier to participation is "can you make HTTP calls."**

### 7. End-user value

The user-visible value comes from four emergent properties of the
shared market layer:

1. **Attention dashboard** — a `Markets` tab in observatory ranked by
   volume *is* the constellation's "what to look at right now" feed.
   The crowd's attention is legible without any algorithm.
2. **Trust scaffold via reputation** — every recommendation, every
   curation suggestion, every agent-issued claim carries a verifiable
   accuracy history. No social-graph required.
3. **Cross-app causality** — agents that win on correlated event sets
   make causal links visible. The system explains its own dynamics.
4. **Self-routing curation** — when a stem's resonance market price
   crosses a threshold, the system automatically promotes it (radio
   feature, gossipghost post, submission-portal priority). Good work
   surfaces without a vote.

### 8. Reference implementation summary

- `kannaka-radio/server/ghostsignals-hub.js` — the LMSR engine, market
  manager, trader registry, SQLite persistence, and resolver loop.
- `kannaka-radio/server/routes.js` — the HTTP API routes listed in §2.
- `kannaka-radio/server/index.js` — initializes the hub at startup
  with a system trader and seeds the default market set.
- `kannaka-observatory/public/index.html` — a new `Markets` tab pulls
  from `/api/markets` and renders the trending list + leaderboard.
- `kannaka-radio/workspace/video-hologram.html` — the existing in-page
  `GSHub` is left untouched as a visualization layer; it gradually
  syncs significant events to the canonical hub.

## Consequences

### Positive
- Zero-protocol agent participation — anything that speaks HTTP can join.
- Reputation accumulates without governance.
- Curation becomes a market signal, not a moderator decision.
- Constellation gains a single attention oracle.

### Negative / risks
- LMSR markets need an initial liquidity seed (handled via system trader).
- Sybil attacks: a malicious actor registers many agents to pump a
  market. Mitigated by reputation decay + brier scoring; truly accurate
  predictions still float to the top regardless of agent count.
- Spam markets: low-quality user-created markets clutter the feed.
  Mitigated by sort-by-volume default and the active-only filter.
- Cold start: predictions on novel events have wide spreads until
  enough traders weigh in. Acceptable — the system is honest about
  uncertainty.

### Open questions
- Should reputation transfer between agents (e.g., on retirement)?
- Should there be a "market quality" score that decays low-volume
  markets faster?
- Multi-outcome markets (more than Yes/No) work mathematically but the
  UI is more complex. v1 stays binary; multi-outcome added later.

## References
- Robin Hanson, *Logarithmic Market Scoring Rules for Modular Combinatorial Information Aggregation* (2003)
- ghostsignals-rs: https://github.com/NickFlach/ghostsignals-rs
- ghostsignals-bridge: https://github.com/NickFlach/ghostsignals-bridge
- ADR-0007 in this repo
