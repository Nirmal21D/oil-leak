# Build Roadmap
### 4-Day Solo Sprint + Team Scaling Plan for the Final Round

---

## 1. Context this roadmap assumes

- Currently: **solo**, ~3-4 days available.
- Later: **team joins** if selected for the actual SIH final round — some architecture decisions (see `02_Tech_Stack_and_Decisions.md`) were deliberately made to minimize rewrite cost at that point (e.g., local Postgres+PostGIS now → Neon later, same engine).
- This round's actual bar is very likely: a compelling, well-argued submission backed by a demonstrable *slice* of working code — not a fully working end-to-end system. Scope accordingly; don't try to build all 13 PRD features solo in 4 days.

---

## 2. What gets built as real, running code (the demo core)

1. **Detection** — fine-tune the 3-class U-Net (oil/lookalike/no-oil) on `sos_refined` first, then Part I. Target: clean mask output on 2-3 known-good sample images, not maximum accuracy.
2. **One deterministic OpenDrift run** — single backward hindcast from the chosen demo scene. No Monte Carlo ensemble yet.
3. **Synthetic AIS + basic correlation** — proximity + trajectory scoring only.
4. **Next.js + Leaflet dashboard** — map, detection overlay, drift animation (pre-rendered frames are fine, doesn't need to compute live), ranked suspect list.

## 3. What stays as designed architecture / pitch-deck material (not code, for now)

- F7 — AIS trust scoring
- F8 — Dark-vessel flagging (SAR ship detection)
- F9's infra-proximity check
- F10 — Evidence dossier automation
- F12 — Synthetic benchmark generator
- F13 — Response coordination

These are the project's actual novelty claims (see `04_Competitive_Landscape_and_Novelty_Notes.md`) — present them as clearly-designed architecture with reasoning, since that's exactly where the gap analysis and differentiation from other teams (e.g. MARITRACE) earns its keep, even without a single line of code behind them yet.

---

## 4. Day-by-day plan

| Day | Focus |
|---|---|
| **Day 1** | Install local PostgreSQL + PostGIS (first task, before any pipeline code). Set up monorepo skeleton (`/frontend`, `/backend`, `/data`, `/docs`). Start fetching `sos_refined` dataset. Get detection model producing masks on the fixed demo scene. |
| **Day 2** | Continue detection training on Part I subset if time allows. Run single OpenDrift backward hindcast on the chosen demo scene using Copernicus Marine + GFS data. Build the synthetic AIS scenario around the chosen coastline. **Checkpoint at end of Day 2** (see risk flag below). |
| **Day 3** | Basic correlation/scoring logic (proximity + trajectory). Wire up FastAPI endpoints connecting detection output, drift output, and AIS scoring. Start Next.js dashboard skeleton. |
| **Day 4** | Finish Next.js dashboard (map, overlay, ranked list). End-to-end stitch. Cache the full pipeline run as static JSON (resilience plan). Build pitch deck from PRD content. Rehearse. |

## 5. Risk management

- **Day 2 checkpoint is a hard decision point:** if detection or drift isn't producing clean output by end of Day 2, switch immediately to hand-curated/hardcoded output for the demo rather than losing Day 3-4 to debugging. A believable, honestly-labeled "here's our architecture, here's real output from one working scene" beats a broken live demo.
- **Live-demo resilience:** pre-run the full pipeline once on the chosen demo scene, cache output as static JSON, and add a visible "cached vs. live" toggle in the UI — protects against network/inference flakiness without misrepresenting cached results as live.
- **Pretrained-model-in-hand strategy:** train ahead of the actual event; don't plan to train live at the venue.

---

## 6. Decisions that must be locked before/at Day 1 start

These block downstream work and are not yet decided as of this document:

1. **Demo scenario** — which specific real Zenodo scene is the case study.
2. **Demo coastline** — which Indian coastal region the synthetic AIS/infra scenario is staged around.
3. **Project name and pitch tagline** — needed before slides/UI copy.

---

## 7. Team-scaling plan (for if/when selected for the final round)

- **Database:** migrate local PostgreSQL+PostGIS → Neon (same engine, connection-string swap only) — Neon's team-collaboration advantage (unlimited free team members, shared concurrent access) becomes relevant once multiple people are hitting the same data.
- **Role split:** detection (ML) / drift modeling (OpenDrift + data pipeline) / AIS-attribution logic / frontend-dashboard as separate parallel tracks, integrated late — matches the PRD's original multi-person assumption.
- **Feature buildout order** (highest novelty-to-effort first): F7 (AIS trust scoring) and F8 (dark-vessel flagging) before F12/F13, since these are the most direct answer to "how do you handle a vessel that went dark" — the exact question competing teams may not have a good answer to.
- **Stakeholder validation:** pursue an informal letter of interest or conversation with a port authority/Coast Guard contact before the final round if possible — meaningfully differentiates the submission.
- **Post-win path:** SIH's own process gives winning teams 6-12 months working directly with the owning ministry (NTRO) — have a concrete first-90-days plan ready to present as part of the "feasibility/scalability" judging criterion.
