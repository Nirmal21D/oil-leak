# Competitive Landscape & Novelty Notes
### SIH PS 26143 — Differentiation strategy

---

## 1. Known competing project: MARITRACE

**What it is:** another SIH 2026 team's prototype for the same PS 26143, publicly presented on YouTube as "AI-Powered Maritime Intelligence for Oil Spill Detection, Vessel Attribution & Response."

**Their stated capabilities:**
- Satellite/SAR-based oil spill detection
- Spill extent & geospatial analysis
- AIS-based vessel attribution (correlates vessel tracks with detected spill)
- Risk assessment (trajectory, proximity, heading, speed)
- Oil spill drift prediction
- Response coordination (responder selection, intercept planning)
- Evidence & investigation dossier

**Their stated workflow banner:** `DETECT → ATTRIBUTE → PREDICT → RESPOND → PRESERVE THE EVIDENCE`

**Assessment (from their public description only — not their actual technical internals, since the video content itself could not be directly reviewed; treat the gaps below as a hypothesis to verify against, not a confirmed fact):**

Conspicuously absent from their description:
- No mention of AIS spoofing, dark vessels, or trust-scoring — "correlates vessel tracks with the detected spill" reads as straightforward proximity/trajectory matching against AIS treated as ground truth.
- No mention of look-alike/false-positive handling (biogenic slicks, low-wind zones, natural seepage).
- No mention of uncertainty/confidence framing — language throughout is deterministic ("estimates," "maps," "predicts"), no stated confidence bands or "investigative lead, not verdict" framing.
- No mention of a validation methodology given the well-known absence of any public ground-truth-paired attribution dataset.

## 2. Our differentiators (if the above holds up)

| Our feature | Why it matters if MARITRACE lacks it |
|---|---|
| F7 — AIS trust scoring (cross-check AIS against independent SAR ship detection) | Directly answers the case where the responsible vessel went dark/spoofed — exactly where naive AIS-only attribution fails |
| F8 — Dark-vessel flagging | Surfaces vessels that are physically present but invisible to AIS — a real gap in any AIS-only system |
| F2 — Multi-signal look-alike discrimination | Addresses false positives from biogenic slicks, natural seepage, etc. — a well-documented, unsolved-in-practice problem |
| Explicit uncertainty quantification (F4/F9) + evidence dossier framing (F10) | Frames output as an investigative lead with confidence bands, not an automated verdict — matches how even the most mature real system (CleanSeaNet) frames its own output |
| F12 — Synthetic benchmark generator | Lets us report actual precision/recall for the attribution model against self-generated ground truth — something no public system or competing team can currently do |
| F9 — Infrastructure-proximity check | Resolves a whole class of spills (rig/pipeline sources) without needing AIS at all — simpler, higher-confidence attribution path most teams likely haven't considered |

## 3. Practical implication for team prep

Since another team is demonstrably building a working prototype on this exact PS, **execution polish and demo reliability now matter as much as the underlying idea**. Prepare explicit answers for the judge questions most likely to separate the two approaches:

- "How do you handle a vessel that went dark before the discharge?"
- "How do you avoid mistaking a natural phenomenon for an oil spill?"
- "How do you know your attribution model is actually accurate, given there's no public ground truth?"
- "Is this a verdict or a lead — what happens if you're wrong?"

If a competing team doesn't have a good answer to these, that's the moment this project separates from theirs.

## 4. Our own pitch identity (still to be finalized)

- MARITRACE's `DETECT → ATTRIBUTE → PREDICT → RESPOND → PRESERVE EVIDENCE` banner is a clean five-word presentation device, worth designing our own equivalent for — not copying theirs.
- Note: our actual pipeline order is technically more correct than a strict linear read of that banner — origin reconstruction (drift/hindcast) has to happen before or alongside attribution, not strictly after, since the AIS search window depends on the hindcast result.
- **Still open:** project name and final tagline (tracked in `01_Build_Roadmap.md` §6 as a blocking decision).

---

## 5. Broader gap analysis this project is built to answer

(Full detail in `PS26143_Oil_Spill_Attribution_PRD.md` §3–4 — summarized here for quick reference.)

| Gap | Our answer |
|---|---|
| Small/imbalanced detection datasets, no Indian Ocean coverage | Transfer learning + swappable local fine-tuning adapter |
| Look-alike confusion | Multi-signal cross-referencing (F2) |
| Drift forecast skill decays fast | Ensemble/Monte Carlo uncertainty bands (roadmap), single deterministic run for now |
| Backward-only attribution ambiguity in busy lanes | Bidirectional fusion — backward hindcast + forward vessel-plume simulation (F9) |
| AIS spoofing/dark fleet | AIS trust scoring + dark-vessel flagging (F7/F8) |
| No attribution ground truth | Synthetic benchmark generator (F12) |
| Correlation ≠ proof | Evidence dossier framing, "investigative lead" language throughout (F10) |
| No one has integrated all three stages end-to-end | This integration is itself the core novelty claim |
