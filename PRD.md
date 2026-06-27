# StudyMate — Product Requirements Document
**Version:** 2.0 (Hackathon Edition)
**Date:** 2026-06-27
**Author:** Sandy / Blackprism
**Status:** Active

---

## 1. Executive Summary

**StudyMate** is a GenAI-powered mental wellness companion for students preparing for high-stakes Indian competitive exams (NEET, JEE, CUET, CAT, GATE, UPSC). It combines emotionally intelligent conversational AI, daily journaling, mood pattern analysis, and hyper-personalized wellness interventions — built to prevent burnout before it becomes a crisis.

The core insight: generic wellness apps give generic advice. StudyMate knows *your* exam, *your* weak subjects, *your* emotional triggers, and *your* preparation phase — and responds with that exact context.

This PRD is structured around the five hackathon evaluation criteria. Each phase maps directly to one criterion and produces a shippable, reviewable deliverable.

---

## 2. Problem Statement

### The Scale
- 1.5M+ students appear for JEE/NEET annually; millions more for CAT, GATE, UPSC, CUET
- 68% of competitive exam aspirants report clinical-level anxiety (NIMHANS, 2023)
- India has the highest student suicide rates globally — concentrated around exam seasons
- Students study 12–16 hours/day, often in isolation, for 1–3 years

### What Fails Them Today
| Gap | Why It Matters |
|---|---|
| Generic wellness apps (Calm, Headspace) | No exam context, syllabus awareness, or coaching pressure understanding |
| Standard mood trackers | Emoji sliders miss nuanced emotional states |
| Human therapists | Unavailable at 2 AM, unaffordable, stigmatized |
| Coaching counselors | Focus on academic performance, not emotional safety |
| Friends & family | Often sources of pressure, not relief |

### Root Causes StudyMate Addresses
1. **Undetected burnout** — students push through invisible warning signs
2. **Untracked stress triggers** — bad mock test, parental call, peer comparison
3. **No personalized coping** — a breathing exercise needs context to land
4. **Shame spiral** — negative thoughts go unspoken and compound

---

## 3. Product Vision

> "An empathetic AI companion that knows your exam, knows your journey, and is always available — turning your daily journal into your greatest competitive advantage."

StudyMate is not a crisis hotline. It is a **daily emotional fitness layer** that catches warning signs early and keeps students mentally prepared to perform.

---

## 4. Target Users

### Primary — "The Dropout-Fear Aspirant"
Arjun, 19, Kota hostel, JEE Advanced 2nd attempt. High-achieving but terrified of failure. Hides struggle from parents. Needs validation before advice.

### Secondary — "The Repeater"
Priya, 23, UPSC 3rd attempt. Identity entirely wrapped in "becoming an IAS officer." Struggles with sunk-cost pressure and social isolation.

### Tertiary — "The First-Generation Dreamer"
Ramesh, 21, NEET aspirant, tier-3 city. Family's entire hope. No peer who understands. Needs Hindi-first, low-bandwidth experience.

---

## 5. Core Feature Set

### 5.1 Intelligent Daily Journal
- Guided free-text (or voice) journaling with contextual prompts adapted to exam phase
- AI analysis: sentiment, stress trigger extraction, cognitive distortion tagging
- Prompts shift based on week-before-mock vs. post-result vs. foundation phase

### 5.2 3-Axis Mood Check-In
- Energy × Anxiety × Motivation (1–10 each) — captures nuance emoji sliders miss
- One optional micro-prompt: *"One word for how you're walking into today?"*
- Feeds longitudinal pattern detection

### 5.3 AI Companion "Mitra"
- Conversational AI persona (Sanskrit: friend/companion)
- Exam-context aware: knows exam, target date, recent triggers, emotional history
- Empathy-first, advice-second response pattern
- Hindi/English/Hinglish; voice and text
- Crisis detection with mandatory escalation to iCall / Vandrevala helpline

### 5.4 Personalized Intervention Library
- Breathing exercises, grounding techniques, cognitive reframing, sleep hygiene, motivational anchoring
- Recommended contextually by Mitra — not a generic menu
- Each recommendation includes why it was chosen (transparent AI reasoning)

### 5.5 Emotional Pattern Dashboard
- Mood heatmap, trigger word cloud, stress cycle map, resilience score
- Weekly AI insight paragraph from Mitra
- Private by default; no parent or institute access

### 5.6 Exam-Aware Companion Calendar
- Mitra's support posture shifts based on exam proximity
- Foundation → Intensive → Mock cycle → Final sprint → Exam week → Post-result

---

## 6. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│           CLIENT (React Native PWA)              │
│   Offline-capable · Hindi/English · WCAG 2.1 AA │
└───────────────────┬──────────────────────────────┘
                    │ HTTPS / WSS
┌───────────────────▼──────────────────────────────┐
│         API GATEWAY (Node.js / Express)          │
│    Auth · Rate Limiting · Input Validation        │
└───┬───────────────┬──────────────────┬───────────┘
    │               │                  │
┌───▼────┐   ┌──────▼──────┐   ┌──────▼──────┐
│Journal │   │  Mitra AI   │   │  Analytics  │
│Service │   │  Service    │   │  Service    │
│        │   │ (Claude API)│   │ (Patterns)  │
└───┬────┘   └──────┬──────┘   └──────┬──────┘
    │               │                  │
┌───▼───────────────▼──────────────────▼───────────┐
│         ENCRYPTED DATA LAYER                     │
│  PostgreSQL · Vector DB · AES-256 at rest         │
│  PII client-encrypted before upload               │
└──────────────────────────────────────────────────┘
```

**AI Stack**
- Conversation: `claude-sonnet-4-6` (primary), `claude-haiku-4-5` (quick check-ins)
- Embeddings: Voyage AI for emotional pattern similarity search
- Voice input: Whisper API (Hindi + English)
- TTS: Azure Cognitive Services (warm, calm Indian voice profile)

---

## 7. Hackathon Phases

Each phase is scoped to be independently reviewable and maps to one evaluation criterion.

---

### Phase 1 — Code Quality
**Criterion:** Structure, readability, maintainability

**Goal:** Establish a production-grade codebase skeleton before writing any AI logic. Reviewers should be able to understand the system architecture from the file structure alone.

**Deliverables:**

#### Repository Structure
```
studymate/
├── apps/
│   ├── web/                  # React Native Web / PWA
│   │   ├── src/
│   │   │   ├── components/   # Atomic design: atoms/ molecules/ organisms/
│   │   │   ├── screens/      # Journal, MoodCheckIn, Chat, Dashboard
│   │   │   ├── hooks/        # useJournal, useMood, useMitra, usePatterns
│   │   │   ├── store/        # Zustand slices: session, mood, journal, mitra
│   │   │   ├── services/     # API client, offline sync
│   │   │   └── i18n/         # en.json, hi.json (Hinglish keys)
│   └── mobile/               # Shared RN screens (same hooks)
├── packages/
│   ├── api/                  # Express server
│   │   ├── src/
│   │   │   ├── routes/       # /journal, /mood, /mitra, /insights
│   │   │   ├── middleware/   # auth, rateLimit, validate, crisis-guard
│   │   │   ├── services/     # JournalService, MitraService, AnalyticsService
│   │   │   ├── ai/           # prompt-builder.ts, context-manager.ts, crisis-detector.ts
│   │   │   └── db/           # migrations/, seeds/, repositories/
│   └── shared/               # Types, constants, validation schemas (Zod)
├── docs/
│   ├── PRD.md
│   ├── API.md
│   └── SAFETY.md
└── .github/
    └── workflows/            # CI: lint, typecheck, test, security scan
```

#### Code Standards
- **TypeScript strict mode** throughout — no `any`, all API responses typed
- **Zod schemas** for all API input/output validation — single source of truth shared between client and server
- **Conventional commits** enforced via commitlint
- **ESLint + Prettier** with custom rules for accessibility and security
- **JSDoc** on all public functions; inline comments only for non-obvious logic
- **No magic numbers** — all constants in `packages/shared/src/constants.ts`

#### Key Abstractions

*`PromptBuilder`* — separates prompt construction from AI call:
```typescript
// packages/api/src/ai/prompt-builder.ts
export class MitraPromptBuilder {
  withUserProfile(profile: UserProfile): this
  withEmotionalHistory(history: EmotionalSummary[]): this
  withExamContext(exam: ExamContext): this
  withCurrentEntry(entry: JournalEntry): this
  build(): MitraSystemPrompt
}
```

*`CrisisDetector`* — isolated, testable, auditable:
```typescript
// packages/api/src/ai/crisis-detector.ts
export interface CrisisAssessment {
  level: 'none' | 'moderate' | 'high' | 'critical'
  triggerPhrases: string[]
  recommendedAction: CrisisAction
  confidence: number
}
export async function assessCrisisRisk(text: string): Promise<CrisisAssessment>
```

*Repository pattern* for all DB access — no raw SQL in route handlers:
```typescript
// packages/api/src/db/repositories/JournalRepository.ts
export interface IJournalRepository {
  create(entry: CreateJournalEntryDTO): Promise<JournalEntry>
  findByUser(userId: string, range: DateRange): Promise<JournalEntry[]>
  findTriggerPatterns(userId: string): Promise<TriggerPattern[]>
}
```

**Exit Criteria:** `npm run lint && npm run typecheck` passes with zero warnings. PR reviewer can navigate the codebase without a guide.

---

### Phase 2 — Security
**Criterion:** Safe and responsible implementation

**Goal:** Ensure the app can safely handle emotionally vulnerable users and their most private data. Security here has two dimensions: technical (data protection) and ethical (AI safety).

**Deliverables:**

#### Technical Security

**Authentication & Authorization**
- JWT access tokens (15-min TTL) + refresh tokens (30-day, rotated on use)
- All tokens stored in `httpOnly, Secure, SameSite=Strict` cookies — not localStorage
- Row-level security in PostgreSQL: `WHERE user_id = auth.uid()` enforced at DB layer
- No user can access another user's journal, mood logs, or AI conversation history

**Data Protection**
- Journal entries encrypted client-side (AES-256-GCM) before upload
- Encryption key derived from user password via PBKDF2 — server never sees plaintext
- Structured emotional summaries (sentiment scores, trigger tags) stored server-side; raw text never persisted
- HTTPS enforced; HSTS preload; Certificate Pinning on mobile
- PII fields (name, email) encrypted at rest in DB; pseudonymized in analytics pipeline

**Input Validation & Injection Prevention**
- All API inputs validated against Zod schemas before reaching business logic
- Parameterized queries via Prisma — no raw SQL string interpolation
- Rate limiting: 10 journal entries/hour, 30 chat messages/hour per user
- File upload (voice): MIME type validation + size limit (10MB) + antivirus scan

**Dependency Security**
- `npm audit` run in CI; build fails on high/critical vulnerabilities
- Dependabot enabled for automated patch PRs
- No transitive dependency with known CVE unpatched > 7 days

**Compliance**
- DPDPA 2023 (India) compliant: consent collection, data deletion within 72h on request
- Under-18 users: parental consent flow required at signup (NEET aspirants are often 16–17)
- Data residency: India-only (AWS ap-south-1 / Azure Central India)

#### AI Ethical Safety

**Crisis Detection System**

Three-layer detection — any layer can escalate independently:

```
Layer 1: Keyword + phrase matching (fast, synchronous)
  → Triggers on: suicide, self-harm, can't go on, want to die, end it all (Hindi variants too)

Layer 2: Claude semantic analysis (async, runs on every journal/chat entry)
  → Detects: hopelessness, entrapment, burden belief, indirect ideation
  → Returns: CrisisAssessment with confidence score

Layer 3: Pattern-based (weekly analytics run)
  → Detects: sustained deterioration across mood dimensions over 7+ days
  → Triggers proactive Mitra outreach before user reaches crisis
```

**Crisis Escalation Protocol (non-negotiable, cannot be disabled):**
1. Mitra immediately shifts to de-escalation response
2. User presented with iCall (9152987821) and Vandrevala Foundation (1860-2662-345) within the conversation
3. If user is under 18 and has designated a trusted adult: optional notification (student chooses at signup)
4. All crisis events logged in append-only audit table; never deleted; reviewed by human moderator within 24h

**AI Guardrails (hard-coded, not prompt-based)**
- Mitra never diagnoses a mental health condition
- Mitra never discourages exam preparation
- Mitra always identifies as AI — never claims to be human
- Response contains no medical dosage information, self-harm methods, or academic performance judgements
- Outgoing responses filtered against a blocklist before delivery

**Privacy by Design**
- Mitra's AI context window uses only emotional summaries, not raw journal text
- Conversation history not retained server-side; session context rebuilt from structured summaries on each load
- Analytics pipeline runs on anonymized, aggregated data only

**Exit Criteria:** Security checklist signed off. Crisis detection demo passes all 20 test scenarios (10 true positives, 10 true negatives). `npm audit` returns 0 high/critical. Penetration test script runs clean.

---

### Phase 3 — Efficiency
**Criterion:** Optimal use of resources

**Goal:** Make StudyMate fast and affordable to operate — especially for students on poor hostel networks and for a startup with limited AI budget.

**Deliverables:**

#### Client-Side Efficiency

**Offline-First Architecture**
- Service Worker caches app shell, intervention library, and Mitra conversation stubs
- IndexedDB for local journal entry queue — syncs when connection restores
- Background sync API for failed API requests (critical for Kota hostels)
- Target: full journaling + mood check-in functional with zero network connection

**Bundle Optimization**
- Code-split by route: Dashboard, Journal, Chat, Interventions loaded independently
- Lazy load: intervention media (audio, animations) only when triggered
- Target: First Contentful Paint < 2.5s on 3G; Largest Contentful Paint < 4s
- Images: WebP with AVIF fallback; responsive `srcset` for all UI imagery

**React Native Specific**
- Hermes JS engine enabled
- `FlashList` for mood history and journal lists (vs. FlatList) — 10x render performance
- Memoization: `useMemo`/`useCallback` on all list items and expensive computations

#### Server-Side Efficiency

**AI Cost Optimization**

This is the largest operating cost — must be managed deliberately:

| Flow | Model | Why |
|---|---|---|
| Morning mood check-in response | `claude-haiku-4-5` | Simple, fast, low cost |
| Journal analysis (sentiment + triggers) | `claude-haiku-4-5` | Structured extraction, no creativity needed |
| Mitra conversation (emotional support) | `claude-sonnet-4-6` | Nuanced empathy requires best model |
| Crisis assessment | `claude-sonnet-4-6` | Safety-critical; never downgrade |
| Weekly insight paragraph | `claude-sonnet-4-6` | Quality matters; runs once/week |

**Prompt Caching**
- Mitra system prompt (static portion) cached via Anthropic prompt caching — saves ~80% tokens on system prompt per conversation turn
- User emotional profile summary cached for 5-minute TTL — rebuilt only when new journal entry submitted
- Cache hit rate target: > 70% on system prompt portion

**Context Window Management**
- Conversation context capped at last 10 turns + structured summary of prior history
- Emotional summaries compressed to < 500 tokens using a dedicated summarization pass (Haiku)
- This prevents unbounded context growth while preserving emotional continuity

**Infrastructure Efficiency**
- API: horizontal scaling via containerized Node.js (AWS ECS Fargate) — pay per request, not per idle server
- Database: read replicas for analytics queries; write path on primary only
- AI calls: async queue (BullMQ + Redis) for non-real-time analysis (journal processing, weekly insights)
- CDN: CloudFront for static assets; edge caching for intervention library content

**Cost Target (per active user/month)**
| Component | Est. Cost |
|---|---|
| AI API (Claude) | ₹8–12 |
| Infrastructure | ₹3–5 |
| Storage | ₹1–2 |
| **Total** | **₹12–19/user/month** |

At ₹199/month Pro pricing: healthy margin even at modest scale.

**Exit Criteria:** Lighthouse performance score ≥ 90. AI cost per active user verified against target. Offline journal entry + sync demonstrated end-to-end. Load test: 500 concurrent users, p99 API latency < 800ms.

---

### Phase 4 — Testing
**Criterion:** Validation of functionality

**Goal:** Every feature has tests. AI behavior is validated. Crisis detection has zero tolerance for false negatives.

**Deliverables:**

#### Test Pyramid

```
                    ┌────────────┐
                    │  E2E Tests │  (Playwright, 15 critical user journeys)
                   /└────────────┘\
                  / ┌─────────────┐\
                 /  │Integration  │ \
                /   │   Tests     │  \
               /    └─────────────┘   \
              /   ┌─────────────────┐   \
             /    │   Unit Tests    │    \
            /     └─────────────────┘     \
```

**Unit Tests (Jest + Testing Library)**
Target: 80% line coverage minimum

Critical units to test:
- `CrisisDetector.assessCrisisRisk()` — 50 test cases (20 true crisis, 20 non-crisis, 10 edge cases in Hindi)
- `MitraPromptBuilder.build()` — validates all context combinations produce valid prompts
- `JournalAnalyzer.extractTriggers()` — validates NER extraction accuracy against labeled dataset
- All Zod schemas — valid/invalid input permutations
- All repository methods — mock DB, verify query structure
- Mood aggregation logic — boundary conditions for 3-axis scoring

**Integration Tests (Supertest)**

| Route | What's Tested |
|---|---|
| `POST /journal` | Entry created, encrypted, analysis triggered, response < 2s |
| `POST /mitra/chat` | Context built correctly, AI called with right model, response delivered |
| `POST /mood` | Scores stored, aggregates updated, patterns re-evaluated |
| `GET /insights` | Dashboard data assembled from correct time ranges |
| Crisis trigger path | Escalation fires when crisis detected, helpline numbers present in response |

**End-to-End Tests (Playwright)**

15 critical user journeys:
1. New user onboarding → exam selection → first journal entry → Mitra greeting
2. Daily mood check-in → Mitra proactive morning message
3. Journal entry with crisis language → crisis response → helpline presented
4. 7-day mood trend → weekly insight generation → dashboard update
5. Offline journal entry → network restore → sync → confirmation
6. Voice journal input → transcription → analysis → response
7. Hindi language journal entry → Hindi Mitra response
8. Pre-exam (< 48h) phase → Mitra calm protocol activation
9. Post-mock-test low score → Mitra de-catastrophizing flow
10. Intervention recommendation → completion → feedback → library updated
11. User under 18 signup → parental consent flow
12. Data deletion request → 72h verification
13. Crisis event → audit log entry → human review queue
14. Pattern dashboard → trigger word cloud renders correctly
15. App works offline → all offline features functional without network

**AI-Specific Testing**

*Prompt regression tests:* Every change to Mitra's system prompt runs a suite of 30 reference conversations; responses scored for empathy, safety, and relevance. Build fails if score drops > 10%.

*Crisis detection accuracy:*
- Maintained test dataset of 100 labeled inputs (Hindi + English)
- Minimum precision: 95% (few false alarms), Minimum recall: 100% (zero missed crises)
- Tested in CI on every push

*Hallucination guardrails:*
- Mitra responses scanned for medical claims, diagnostic statements, and performance judgements
- Automated check flags any response containing these patterns for human review

**Testing Infrastructure**
- CI/CD: GitHub Actions — lint → typecheck → unit → integration → E2E on every PR
- Test database: isolated PostgreSQL container per test run (no shared state)
- AI calls in tests: mocked with recorded response fixtures (no real API calls in unit/integration)
- E2E only: real Claude API on dedicated test org with usage caps

**Exit Criteria:** 80% unit coverage. All 15 E2E journeys green. Crisis detection: 100% recall, ≥95% precision on test dataset. CI pipeline completes in < 8 minutes.

---

### Phase 5 — Accessibility
**Criterion:** Inclusive and usable design

**Goal:** StudyMate must work for students across ability levels, languages, devices, and network conditions. Accessibility is not a feature — it is a baseline.

**Deliverables:**

#### WCAG 2.1 AA Compliance

**Perceivable**
- All images have descriptive `alt` text (mood icons, intervention illustrations)
- Color is never the sole conveyor of meaning — mood states use color + icon + label
- 3-axis mood check-in: sliders have visible labels + numeric readout (not color-only)
- Contrast ratio ≥ 4.5:1 for all body text; ≥ 3:1 for large text and UI components
- Mitra chat: font size minimum 16px; user-adjustable up to 24px without layout break
- Audio exercises have text transcripts; video has captions

**Operable**
- All interactive elements reachable by keyboard (Tab order logical, no keyboard traps)
- Focus indicators visible on all focusable elements (not just default browser outline)
- Touch targets minimum 44×44px (critical for mobile use — students use phones)
- No time limits on journal input; session timeout gives 5-minute warning with extension option
- Animations: `prefers-reduced-motion` media query honored — no auto-playing animations

**Understandable**
- Page language declared (`lang="hi"` or `lang="en"` per user preference)
- Error messages are specific: *"Journal entry must be at least 20 characters"* not *"Invalid input"*
- Mitra responses at 8th-grade reading level (Flesch-Kincaid checked in CI)
- Consistent navigation: back button always works; no unexpected page changes
- Confirmation dialogs for all destructive actions (delete journal entry, clear history)

**Robust**
- Semantic HTML throughout (`<main>`, `<nav>`, `<article>`, `<button>` not `<div onClick>`)
- ARIA roles and labels on all custom components (mood slider, chat interface, pattern charts)
- Screen reader tested: VoiceOver (iOS), TalkBack (Android), NVDA (Windows)
- Works with browser zoom up to 200% without horizontal scroll

#### Language & Localization

**Hindi-First Implementation**
- All UI strings externalized to `i18n/hi.json` and `i18n/en.json` from day one
- Mitra responds in the same language the user writes in (auto-detected)
- Number formatting: Indian system (1,00,000 not 100,000)
- Date formatting: DD/MM/YYYY (Indian standard)
- Right-to-left layout support architecture in place (for future Urdu support)

**Hinglish Handling**
- Code-switching (mixing Hindi and English in one message) handled gracefully
- Mitra trained to recognize and respond naturally in Hinglish
- Example: "Aaj ka mock test bahut bura gaya yaar" → Mitra responds in kind, not stiff formal Hindi

#### Low-Resource Accessibility

**Network Accessibility**
- Offline-first PWA: full journaling + mood check-in without internet
- Low-data mode: text-only responses from Mitra when user opts in (no audio, reduced images)
- Data usage estimate shown in settings; estimated < 5MB/day in normal use

**Device Accessibility**
- Supports Android 8+ (2017 devices) — covers the student demographic's actual phones
- Minimum 2GB RAM target; graceful degradation on 1GB
- APK size < 15MB (important for users with limited storage)
- Battery optimization: background sync uses WorkManager (Android) / BackgroundFetch (iOS) — not constant polling

#### Cognitive Accessibility

This is critical given the target user's mental state:

- **Low-load onboarding**: 3 steps, no wall of text, one decision at a time
- **Crisis state UI**: When crisis protocol activates, UI simplifies to large text, one CTA, calm colors
- **Journal prompts**: Maximum 2 prompts shown at once; more available on demand
- **No dark patterns**: No guilt-tripping notifications; no streaks that punish missing a day
- **Progress is private**: No leaderboards, no social comparison, no sharing pressure

#### Accessibility Testing Plan
| Tool | What It Tests | When |
|---|---|---|
| axe-core (automated) | WCAG rule violations | Every PR (CI) |
| Lighthouse accessibility | Score ≥ 95 | Every PR (CI) |
| VoiceOver (iOS) | Screen reader navigation | Weekly manual |
| TalkBack (Android) | Screen reader navigation | Weekly manual |
| Keyboard-only navigation | Full app traversable | Weekly manual |
| Color contrast checker | All new color combinations | Design review |
| Real user testing | 5 students from target cohort | Phase 5 milestone |

**Exit Criteria:** Lighthouse accessibility score ≥ 95. axe-core: 0 violations. VoiceOver + TalkBack: all critical user journeys completable. Hindi UI verified by a native speaker. 5 target users complete core flows without guidance.

---

## 8. Phase Summary & Timeline

| Phase | Criterion | Core Output | Days |
|---|---|---|---|
| **1 — Code Quality** | Structure, readability, maintainability | Typed codebase skeleton, conventions enforced, architecture documented | Days 1–2 |
| **2 — Security** | Safe and responsible implementation | Auth, encryption, crisis detection system, AI guardrails | Days 3–5 |
| **3 — Efficiency** | Optimal use of resources | Offline-first, AI cost optimization, performance targets met | Days 6–8 |
| **4 — Testing** | Validation of functionality | Unit + integration + E2E suite, AI regression tests, crisis accuracy verified | Days 9–11 |
| **5 — Accessibility** | Inclusive and usable design | WCAG 2.1 AA, Hindi-first i18n, low-resource device support | Days 12–14 |
| **Polish & Demo** | — | Demo video, final QA, submission | Days 15 |

---

## 9. Evaluation Scorecard (Self-Assessment Framework)

Use this to verify readiness before submission:

### Code Quality
- [ ] TypeScript strict, zero `any`
- [ ] Repository pattern used throughout
- [ ] `PromptBuilder` and `CrisisDetector` are isolated, testable abstractions
- [ ] Conventional commits; PR reviewer can navigate without a guide
- [ ] No magic numbers; all constants centralized

### Security
- [ ] Tokens in httpOnly cookies, not localStorage
- [ ] Client-side encryption — server never sees raw journal text
- [ ] Crisis detection: 3-layer system active and tested
- [ ] Hard-coded AI guardrails (not prompt-based)
- [ ] `npm audit` clean; DPDPA compliance documented
- [ ] Under-18 consent flow implemented

### Efficiency
- [ ] Haiku used for low-complexity AI calls; Sonnet only where needed
- [ ] Prompt caching active; cache hit rate > 70%
- [ ] Service Worker + IndexedDB offline support
- [ ] Lighthouse performance ≥ 90
- [ ] Cost per user verified at < ₹20/month

### Testing
- [ ] 80% unit test coverage
- [ ] Crisis detection: 100% recall, ≥95% precision
- [ ] All 15 E2E journeys green
- [ ] AI prompt regression suite active in CI
- [ ] CI completes in < 8 minutes

### Accessibility
- [ ] Lighthouse accessibility ≥ 95
- [ ] axe-core: 0 violations
- [ ] VoiceOver + TalkBack: critical flows completable
- [ ] Hindi UI verified by native speaker
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Crisis UI tested on 1GB RAM Android device

---

## 10. Safety Charter (Non-Negotiable)

These rules cannot be overridden by configuration, feature flags, or prompt changes:

1. **Mitra never diagnoses** — observes and reflects, never labels
2. **Crisis escalation is mandatory** — any detected crisis triggers helpline display; this code path has no off-switch
3. **Server never stores raw journal text** — only encrypted client payload and structured summaries
4. **Mitra always identifies as AI** — no persona that claims humanity
5. **Zero parent/institute access by default** — student's data is student's data
6. **No score shaming** — Mitra never references academic performance pejoratively
7. **Under-18 requires consent** — no exceptions

---

## 11. Open Questions for Stakeholder Review

1. Avatar for Mitra — text/voice only, or visual character? (Avatar risks uncanny valley)
2. Should we partner with NIMHANS for clinical validation of intervention library?
3. Crisis escalation: direct to helpline, or optional notify a trusted contact the student pre-designates?
4. Minimum viable Hindi coverage for hackathon demo — full i18n or key screens only?
5. Offline-first: PWA or native app first for the demo?

---

*Next review checkpoint: Phase 1 exit — Day 2 end-of-day*

**StudyMate** — *Because your mental game is your competitive advantage.*
