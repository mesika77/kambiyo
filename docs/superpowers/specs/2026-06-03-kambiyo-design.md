# Kambiyo — MVP Design Spec
Date: 2026-06-03

## Overview

A single-player web card game (Kambiyo, a variant of Cambio/Cabo) — one human vs 1–5 AI bots. Client-side only, no backend. Deployed as a static site on Vercel.

**Stack:** Vite + React + TypeScript, Zustand, Tailwind CSS, Framer Motion.

---

## 1. Project Structure

```
src/
  components/
    landing/
      LandingScreen.tsx       # Full landing page
      NameInput.tsx
      BotSelector.tsx         # Pill buttons 1–5
      DifficultySelector.tsx  # Easy / Medium / Hard pills
    game/
      Board.tsx               # Root layout: bots top / piles center / human bottom
      PlayerHand.tsx          # Human's 2×2 tappable card grid
      BotRow.tsx              # Bot strip: emoji avatar + name + 4 face-down cards
      Card.tsx                # Single card — animated, face-up/down, tappable
      DrawPile.tsx            # Deck stack
      DiscardPile.tsx         # Face-up discard pile
      PowerModal.tsx          # Multi-step power card chooser overlay
      ScoringScreen.tsx       # End-game flip-and-reveal leaderboard
    ui/
      SlapFX.tsx              # Screen-shake + lightning bolt overlay
      CambioButton.tsx
      Toast.tsx               # Floating feedback messages
  store/
    useGameStore.ts           # Single Zustand slice — all state + actions
  hooks/
    useBotAI.ts               # Difficulty-aware async bot decision engine
    useSlap.ts                # Real-time slap detection + race condition logic
  lib/
    deck.ts                   # Deck creation, shuffle, card value lookup
    scoring.ts                # End-game score tallying + Cambio penalty
    botNames.ts               # Gen-Z username + emoji avatar generator
    constants.ts              # Card values, power card IDs, timing constants
  types/
    game.ts                   # All shared TypeScript types
  App.tsx
  main.tsx
```

---

## 2. Card Values & Rules

| Card | Score Value | Power (on discard, player chooses to activate) |
|------|-------------|------------------------------------------------|
| Ace | 1 | None |
| 2–6 | Face value | None |
| 7 | 7 | Peek one of your own face-down cards |
| 8 | 8 | Peek one of your own face-down cards |
| 9 | 9 | Peek one opponent's face-down card |
| 10 | 10 | Peek one opponent's face-down card |
| Jack | 11 | Blind swap: pick one of your cards + one opponent card, swap without revealing |
| Queen | 12 | Peek any card (own or opponent), then optionally swap one of your cards with an opponent |
| Black King (♠K, ♣K) | 13 | Peek any two cards (own or opponents), then optionally swap one of your cards with an opponent |
| Red King (♥K, ♦K) | −1 | None |
| Joker | 0 | None |

**Deck:** Standard 52-card deck + 2 Jokers = 54 cards total.

**Power activation:** Power cards only trigger their special action when the player explicitly chooses "Use Power" in the `POWER_CHOICE` modal. Players may always choose "Discard Only" to skip the power.

**Discard pile draw rule:** If a player draws from the discard pile (taking the top face-up card), they **must** swap it with one of their hand cards — they cannot put it back. Drawing from the draw pile allows a free choice: swap into hand or discard it.

**Bot power usage:** Hard and Medium bots always choose "Use Power" if the power benefits their position (e.g., peek when they have unknown cards, swap when they can improve their score). Easy bots choose randomly (50% use, 50% discard only).

---

## 3. Game State Shape

```typescript
// Top-level phases
type GamePhase = 'LANDING' | 'SETUP_PEEK' | 'PLAYING' | 'CAMBIO_CALLED' | 'SCORING'

// Sub-phases within PLAYING
type TurnPhase =
  | 'WAITING_FOR_DRAW'
  | 'HOLDING_DRAWN_CARD'
  | 'POWER_CHOICE'
  | 'EXECUTING_POWER'
  | 'END_TURN'

interface Card {
  id: string            // e.g. "hearts-7"
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker'
  rank: string          // '2'–'10', 'J', 'Q', 'K', 'A', 'JOKER'
  value: number
  isRevealed: boolean   // animation flip state
  knownBy: number[]     // player indices who have peeked this card
}

interface Player {
  id: number
  name: string
  isBot: boolean
  avatar: string        // emoji
  hand: Card[]          // always 4 cards (until slapped out)
  memory: Map<string, { value: number; learnedAtTurn: number }>  // bots only
}

interface PowerAction {
  type: 'PEEK_OWN' | 'PEEK_OPPONENT' | 'BLIND_SWAP' | 'PEEK_AND_SWAP' | 'DOUBLE_PEEK_SWAP'
  step: number
  selections: { playerIndex: number; cardIndex: number }[]
}

interface GameState {
  phase: GamePhase
  humanName: string
  botCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  players: Player[]
  currentPlayerIndex: number
  drawPile: Card[]
  discardPile: Card[]       // top = last element
  drawnCard: Card | null    // card currently "in hand" after drawing
  turnPhase: TurnPhase
  activeAction: PowerAction | null
  setupPeeksRemaining: number
  cambioCalledBy: number | null
  finalRoundRemaining: number
  slapLockUntil: number | null  // timestamp in ms — bots blocked until this time
  turnNumber: number
}
```

---

## 4. Bot AI

All bot logic lives in `useBotAI.ts`, watching `currentPlayerIndex` and firing via `setTimeout`. Non-blocking — never freezes the UI.

### Easy ("chaotic gremlin")
- **Memory:** Forgets a random known card each turn (40% wipe chance per card per turn)
- **Turn delay:** 2–4s
- **Slap:** 30% chance to attempt, 3–6s delay (always outside human grace window)
- **Cambio threshold:** Estimated score < 10
- **Draw logic:** Sometimes picks worse card from discard (random noise)

### Medium ("casual player")
- **Memory:** Retains peeked cards for 8 turns, then forgets
- **Turn delay:** 1–2s
- **Slap:** 55% chance to attempt, 1.5–3s delay
- **Cambio threshold:** Estimated score ≤ 6
- **Draw logic:** Optimal for known cards, random for unknown

### Hard ("shark")
- **Memory:** Perfect — tracks every card revealed by any means (peek, slap, discard)
- **Turn delay:** 0.3–0.8s
- **Slap:** 85% chance to attempt, 0.8–1.4s delay (may beat human grace window)
- **Cambio threshold:** Estimated score ≤ 4 or when calculated to be winning
- **Draw logic:** Always mathematically optimal swap decisions

---

## 5. Slap (Out-of-Turn Burn) Mechanic

1. A card lands on the discard pile → `slapLockUntil = Date.now() + 600`
2. During the grace window, only the human can tap to slap
3. After 600ms, bots roll their chance + delay per difficulty
4. **Valid slap** (face-down card rank matches discard top): card rockets to discard pile + screen shake + lightning bolt FX. That card is removed from the player's hand.
5. **Invalid slap**: slapper draws one penalty card from the draw pile. Red flash + toast: "–1 card".
6. First slap wins; `slapLockUntil` is set far into the future to block others.

---

## 6. Power Card Multi-Step Flows

| Card | Step 1 | Step 2 | Step 3 |
|------|--------|--------|--------|
| 7/8 | Tap one of your own face-down cards | Card flips for 2s then hides | — |
| 9/10 | Tap any opponent's face-down card | Card flips for 2s (only visible to you) | — |
| J | Tap one of your cards | Tap one opponent's card | Cards swap silently |
| Q | Tap any card to peek (2s reveal) | Tap your card + opponent card to swap, or "Skip" | — |
| Black K | Peek any card (2s) | Peek a second card (2s) | Tap your card + opponent card to swap, or "Skip" |

**UI during execution:**
- Non-selectable cards have a dimmed overlay
- Selectable cards pulse with a neon glow ring
- Step indicator shows "Step 1 of 2" etc.
- Bots execute power flows automatically after their turn delay

---

## 7. Layout & Visual Theme

**Layout (portrait, max-width 430px, centered on desktop with dark surround):**
```
┌───────────────────────────┐
│  BOT STRIP (~35%)         │  BotRow × N, scroll if >3 bots
│  emoji + name + 4 cards   │
├───────────────────────────┤
│  CENTER (~15%)            │  Draw pile + Discard pile + CAMBIO button
├───────────────────────────┤
│  HUMAN HAND (~50%)        │  2×2 tappable card grid
│  drawn card tray          │
│  swap / discard buttons   │
└───────────────────────────┘
```

**Color palette:**
- Background: `#080810`
- Primary neon: `#9B5DE5` (purple), `#00F5FF` (cyan)
- Aggressive accent: `#FF006E` (hot pink) — slap, burn, penalties
- Card face: `#1A1A2E` with neon border
- Text: `#F0F0FF`

**Typography:** Space Grotesk (headers) + Inter (body) — Google Fonts

---

## 8. Animation Inventory (Framer Motion)

| Event | Animation |
|-------|-----------|
| Deal cards | Staggered slide-in from center, 0.08s between cards |
| Card flip (peek) | `rotateY` 0→180, backface-hidden, 0.4s spring |
| Draw from deck | Card pops up, slides to drawn-card tray |
| Discard | Card arcs to discard pile |
| **Slap / burn** | Card rockets to pile + 4px translate screen shake (3 cycles) + pink lightning bolt overlay fades over 0.6s |
| Cambio call | Full-screen white flash + "CAMBIO 🔥" scales in |
| Score reveal | Cards flip one-by-one, 0.15s stagger, score numbers count up |
| Bot thinking | Pulsing neon ring around bot avatar |
| Invalid slap | Red flash + "–1 card" toast floats up |

---

## 9. Landing Screen & Setup Flow

1. Hero: "KAMBIYO" title in neon typography, animated card-shuffle BG
2. Name input: casual lowercase prompt "what's your name?"
3. Bot count: pill buttons 1 / 2 / 3 / 4 / 5
4. Difficulty: pill buttons EASY / MEDIUM / HARD with one-liner descriptions
5. "DEAL ME IN" CTA — triggers deal animation

**Setup peek (after dealing):**
- All cards dealt face-down with stagger animation
- Overlay: "tap 2 of your cards to peek — remember them"
- Tapped card flips face-up for 3s then flips back
- After 2 peeks: overlay fades, game enters PLAYING with human going first

**Gen-Z bot username generator:**
```
prefixes:  ['itz_', 'xX', 'ok_', 'ur_', 'not_', 'lil', 'main_', 'the_']
cores:     ['vibe', 'slay', 'chaos', 'ghost', 'rizz', 'drip', 'snack', 'shade', 'flex', 'era']
suffixes:  ['99', '2k', 'xx', 'irl', '_', '4real', 'btw']
```
Each bot also gets a randomly assigned emoji avatar from this set:
`['🦊','🐺','🐸','👾','🤖','💀','🎭','🦋','🔥','⚡','🌙','🎪','🦄','🐙','👻']`

---

## 10. End-Game & Scoring

**Calling Cambio:**
- Button visible only on human's `WAITING_FOR_DRAW` turn phase
- Bots call Cambio when their estimated score hits their threshold
- On call: `phase → CAMBIO_CALLED`, all other players get one final turn

**Scoring:**
- Sum all card values in hand
- Cambio caller penalty: if caller does NOT have the lowest score, +5 added to their total
- Leaderboard: sorted lowest → highest

**Edge cases:**
- Draw pile empty: shuffle discard (except top card) into new draw pile
- Player slaps all 4 cards out of hand: auto-win (score = 0)
- Tie: both players shown as co-winners
- "PLAY AGAIN" resets store, returns to landing with settings pre-filled

---

## 11. Deployment

- Vite static build: `npm run build` → `dist/`
- `vercel.json` with SPA rewrites (all routes → `index.html`)
- Deploy command: `vercel --prod`
- No environment variables required (fully client-side)
