# Marine Oil Spill Detection & Vessel Attribution System
### Product Requirements Document — SIH PS 26143 (NTRO)

---

## 1. Problem Statement

**Title:** Leveraging satellite imagery to determine oil spills at sea along with AIS data correlations to identify the vessel responsible for the spill.

**Owning organization:** National Technical Research Organisation (NTRO)
**Theme:** Disaster Management | **Category:** Software

### 1.1 The problem in plain terms

Marine oil spills cause severe, often irreversible damage to marine ecosystems — coral reefs, fisheries, coastal economies. The core enforcement failure isn't detecting *that* a spill happened; satellites already see it. The failure is **attribution** — proving *which vessel* caused it, so the polluter can be held accountable. Today, most spills go unattributed because:

- By the time a spill is imaged, the responsible vessel may be far away.
- There is no automated system that connects "a slick exists here" to "this specific ship's historical track passed through this origin point at this time."
- Investigators currently do this manually and slowly, if at all, using disconnected tools.

### 1.2 What NTRO is asking for

An automated pipeline that:
1. **Detects and characterizes** oil slicks from SAR/EO satellite imagery (location, area, shape, and — if feasible — age).
2. **Reconstructs the slick's origin** in space and time by modeling ocean current/wind-driven drift backward, and predicts its future spread forward.
3. **Attributes** the spill to a specific vessel by cross-referencing historical AIS (Automatic Identification System) traffic against the reconstructed origin window, filtering irrelevant traffic and scoring suspect vessels by proximity, trajectory match, and behavioral anomalies.
4. Presents all of this through a **visual interface** an analyst can actually use.

### 1.3 Why this matters beyond the hackathon

Oil spill attribution today functions on manual correlation, informal intelligence, and — when it works at all — international cooperation between coast guards and satellite agencies. A working automated pipeline reduces the time from "spill detected" to "suspect list generated" from days/weeks to hours, which matters because evidence (AIS tracks, vessel logs) degrades in usefulness the longer attribution takes.

---

## 2. Existing Solutions & Prior Art

Nothing here is being invented from zero — the value is in synthesis, not reinvention. Cite these explicitly in your submission; NTRO evaluators will already know them, and citing them signals maturity rather than naivety.

### 2.1 Operational systems (already running, at scale)

| System | What it does | Relevance |
|---|---|---|
| **CleanSeaNet (EMSA)** | EU satellite-based oil spill detection + SafeSeaNet AIS correlation, operational since 2007 | The direct benchmark architecture for this exact problem |
| **NOAA GNOME / WebGNOME** | US operational spill trajectory model using wind/current data, visualizes uncertainty | Reference for Stage 2 (drift modeling) |
| **MEDSLIK-II** | Mediterranean open-source operational drift model, auto-ingests CleanSeaNet SAR detections | Reference architecture connecting detection → drift automatically |
| **Global Fishing Watch — Dark Vessel Detection** | SAR-based vessel detection cross-matched against 100B+ AIS points to catch vessels that go dark | Directly solves the "vessel isn't in AIS" sub-problem |

### 2.2 Open-source code

- **OpenDrift / OpenOil** (GitHub, GPL, peer-reviewed in *Geoscientific Model Development*, 2018) — Lagrangian drift modeling; runs backward for hindcasting by flipping timestep sign.
- **chashmishcoder/Oil-Spill-Detection** — DBSCAN on AIS features (SOG/COG) + U-Net SAR segmentation, structurally close to this PS.
- **Harsha0112/Oil-Spill-Detection** — U-Net/DeepLabV3 detection + separate vessel anomaly detection, uses marinecadastre.gov (same AIS source as the PS).
- **d-elicio/Oil-Spill-Detection-in-SAR-images** — classical (non-DL) baseline for comparison.

### 2.3 Datasets

| Dataset | Content | Access |
|---|---|---|
| Krestenitis et al. (MKLab) | ~1000 SAR images, 5-class ground truth (oil/look-alike/land/ship/sea) | Request-based |
| Sentinel-1 SAR Oil Spill Dataset (Zenodo, Parts I–III) | 1200+ SAR images with pixel masks | Fully open |
| Refined Deep-SAR Oil Spill (SOS) | Cleaned/corrected version of above | Open |
| xView3-SAR | 991 scenes, 243K verified maritime objects, SAR+AIS fusion, NeurIPS 2022 | Open |
| marinecadastre.gov AIS sample | Reference AIS data format | Open |

### 2.4 Key research

- *A Review of AI and Remote Sensing for Marine Oil Spill Detection* (MDPI Remote Sensing, 2025) — survey of detection methods and limitations.
- *A new ship tracing technology from oil spills based on multi-source data* (Marine Policy, 2024) — proposes **forward** AIS simulation instead of backward-only slick tracing, specifically to resolve ambiguity in busy shipping lanes.
- *Space-based Global Maritime Surveillance Part II* (arXiv) — Ornstein-Uhlenbeck anomaly detection model for AIS behavioral deviation.
- ISRO precedent: EOS-4/RISAT-1 SAR imagery already used for oil-spill detection near Kerala (2025) via Bhuvan GIS.

---

## 3. Gaps in Existing Solutions

| # | Gap | Stage | Why it exists |
|---|---|---|---|
| G1 | Detection datasets are small, imbalanced (~2% oil pixels), and regionally narrow (no Indian Ocean/Arabian Sea coverage) | Detection | Spills are rare events; most labeled data comes from EU waters (CleanSeaNet source) |
| G2 | "Look-alikes" (biogenic slicks, low-wind zones) still misclassified as oil | Detection | Models treat each SAR image independently, no temporal/cross-sensor context |
| G3 | Age/thickness estimation has no ground-truth benchmark | Detection | No sensor directly measures oil thickness; physics estimates carry large uncertainty |
| G4 | Drift forecasts reliable only ~12–48 hrs before compounding wind/current errors dominate | Drift | Ocean current/wind fields, especially for the Indian Ocean, are lower-resolution than in EU/US waters |
| G5 | Backward-only hindcasting gives ambiguous multi-vessel matches in busy shipping lanes | Drift | Many ships plausibly overlap a single origin window |
| G6 | **AIS-reliant attribution is weakest exactly where it matters most** — vessels intentionally polluting have every incentive to go dark or spoof position | Attribution | 1,900+ active "dark tankers" reported industry-wide; AIS spoofing/GNSS jamming is large and growing |
| G7 | No public dataset pairs a confirmed spill with confirmed attribution ground truth | Attribution | Real attribution cases are legally sensitive (litigation/enforcement), never released for research |
| G8 | Correlation output can be mistaken for legal proof | Attribution | Even CleanSeaNet frames its output as narrowing suspects, not verdicts |
| G9 | No one has integrated all three stages end-to-end in one open pipeline | Cross-cutting | Each existing tool was built by a different institution solving its own mandate |
| G10 | Real Indian AIS/SAR feeds aren't publicly accessible to a student team | Cross-cutting | India lacks a marinecadastre.gov-equivalent; ISRO imagery isn't openly downloadable at volume |

---

## 4. How We Fix These Gaps

| Gap | Our fix | What it looks like in the product |
|---|---|---|
| G1 | Synthetic augmentation + transfer learning + a local fine-tuning adapter module | Model architecture explicitly supports swapping in Indian-coast data later without retraining from scratch |
| G2 | Temporal multi-pass comparison + optional optical (Sentinel-2) fusion where cloud-free imagery coincides | A "look-alike confidence" score, not a binary oil/no-oil call |
| G3 | Report age/thickness as a *relative* trend indicator (elongation, fragmentation) with explicit uncertainty bounds, never a precise figure | UI shows "estimated 6–18 hrs old" with a confidence band, not "12 hours" |
| G4 | Ensemble/Monte Carlo drift runs (perturbed wind/current inputs) | Origin shown as a probability heatmap over space-time, not a single point |
| G5 | **Bidirectional fusion**: backward-hindcast the slick AND forward-simulate every AIS-visible candidate vessel's plume, score by shape/position match | Suspect ranking uses two independent signals, not one |
| G6 | **AIS trust scoring**: cross-check every AIS track against independent SAR ship-detection (not oil detection) in the same scenes; tracks with no SAR corroboration get down-weighted | A visible "AIS reliability" indicator per vessel in the dashboard |
| G6b | **Dark-vessel flagging**: any SAR-detected ship with *no* matching AIS track becomes an automatic high-priority suspect | Separate "unidentified vessel" panel — the system's answer to spoofing, instead of failing silently |
| G7 | Build our own **synthetic benchmark generator**: real Sentinel-1 spill + OpenDrift forward-simulated "true" source + synthetic AIS with injected dark periods | Lets us report actual precision/recall for the attribution model — nobody else can |
| G8 | Every output is an **evidence dossier**, not a verdict: confidence score + full provenance chain (which SAR pass, which AIS points, which drift run) | Explicit "investigative lead" framing in UI copy and exported reports |
| G9 | Ship the full three-stage pipeline integrated end-to-end, open-source | This integration is itself the novelty claim |
| G10 | Design every data-ingestion point as a swappable adapter (Sentinel-1 today, ISRO/RISAT feed later; synthetic AIS today, licensed/Coast-Guard feed later) | A named "Data Partnership Roadmap" section in the submission, not a hidden assumption |

---

## 5. Product Requirements (PRD)

### 5.1 Product goal

Given a satellite image showing a suspected slick, produce (a) a validated slick characterization, (b) a probabilistic origin reconstruction, and (c) a ranked, evidence-backed list of candidate responsible vessels — all inside one visual dashboard, in near-real-time relative to satellite revisit cadence.

### 5.2 Users / personas

- **Primary:** Maritime enforcement analyst (Coast Guard / NTRO) reviewing a detected slick and needing a ranked suspect list with evidence.
- **Secondary:** Environmental/disaster-response coordinator needing the forward drift forecast to plan containment.
- **Tertiary:** Researcher/auditor reviewing the model's reasoning trail after the fact.

### 5.3 Features & implementation

#### F1 — Slick Detection & Segmentation
- **What:** Given a SAR scene, output a pixel-level mask of candidate oil slick regions.
- **Implementation:** U-Net or DeepLabV3+ trained on Zenodo Sentinel-1 SAR Oil Spill dataset (+ Krestenitis if access granted). Tile large scenes into patches for training/inference given GPU memory limits. Focal loss / class-weighted loss to counter the ~2% positive-pixel imbalance.
- **Output:** Binary/multi-class mask (oil / look-alike / land / ship / sea).

#### F2 — Look-alike Discrimination (Multi-Signal)
- **What:** Reduce false positives from biogenic slicks, low-wind zones, rain cells, internal waves, current fronts, and natural seepage — treated as a physics-based cross-referencing problem, not a single-image classification problem.
- **Implementation:** Layer independent signals on top of the base segmentation output, since no single SAR image contains enough information to disambiguate on its own:
  - **Wind field cross-check** (reusing the GFS wind data already pulled for F4/F5): a broad, diffuse dark region matching a known low-wind area at image time is flagged as a wind artifact, not oil — real spills have sharp edges within a normal wind field.
  - **Ocean-color cross-check** (Sentinel-3/MODIS chlorophyll, where a coincident pass exists): biogenic slicks carry a chlorophyll signature that oil never does.
  - **Weather-radar/rain-nowcast cross-check**: rain cells are diffuse, round, and move with a weather system rather than a point source.
  - **Texture/frequency-domain check**: internal waves show a distinctive periodic banded texture (not a blob), distinguishable via GLCM or frequency-domain features rather than shape alone.
  - **Known-feature climatology overlay**: static masks of known seep sites, biogenic bloom zones, and current fronts/eddies (built from historical detections and bathymetric/current data) — a detection matching a cataloged site almost exactly is downweighted as recurring, not incident.
  - **Multi-temporal persistence check**: true spills evolve (spread, thin, drift with current) across consecutive passes; look-alikes tied to fixed geology or fronts either don't move or move with a signature (tidal, not wind+oil physics) that doesn't match.
- **Output:** A confidence-weighted "true spill" probability per detected region, with the specific look-alike hypothesis (if any) attached — not a bare binary oil/no-oil call.
- **Honesty note:** This does not fully solve the look-alike problem — it moves from single-image guessing to multi-signal cross-validation, which is a real, demonstrable improvement over every SAR-only, single-pass repo in the prior-art list, but it's still probabilistic disambiguation, not certainty. State this plainly in the submission.

#### F3 — Geometric & Age Characterization
- **What:** Compute area, perimeter, elongation, fragmentation from the mask; estimate a relative age band.
- **Implementation:** OpenCV/GDAL geometry extraction directly from the mask. Age estimate via simplified Fay spreading-theory heuristic on elongation/area ratio, always reported as a range with explicit "approximate" labeling.
- **Output:** Structured metadata object per slick.

#### F4 — Backward Hindcast (Origin Reconstruction)
- **What:** Trace the slick backward in time to estimate origin point/time window.
- **Implementation:** OpenDrift/OpenOil, seeded with slick position/timestamp, driven by Copernicus Marine / HYCOM currents and GFS/ECMWF winds. Run as a Monte Carlo ensemble (perturbed inputs) rather than a single deterministic run.
- **Output:** Probability heatmap over space-time (origin ellipse with confidence contours), not a point.

#### F5 — Forward Forecast (Spread Prediction)
- **What:** Predict future slick spread for response planning.
- **Implementation:** Same OpenDrift setup run forward from current detection. Confidence explicitly decays and is displayed as widening past ~48 hrs, per known forecast-skill limits.
- **Output:** Animated forward-drift projection with a stated validity window.

#### F6 — AIS Traffic Reconstruction & Filtering
- **What:** Pull all AIS tracks within the origin space-time window; discard irrelevant traffic.
- **Implementation:** Query historical AIS (marinecadastre.gov format / synthetic for demo) via PostGIS spatial-temporal query. Filter out anchored/moored vessels and tracks with zero spatial overlap with the origin ellipse.
- **Output:** Filtered candidate vessel list.

#### F7 — AIS Trust Scoring (novel)
- **What:** Score each remaining AIS track for reliability before trusting its position.
- **Implementation:** Run SAR ship-detection (separate from oil-segmentation model — a standard bright-target detector) on the same SAR scenes; compare detected ship positions against AIS-claimed positions in space/time. Tracks with no corroborating SAR detection, unexplained gaps, or implausible jumps get a lower trust weight.
- **Output:** Trust-weighted AIS track set.

#### F8 — Dark Vessel Flagging (novel)
- **What:** Surface vessels physically present (SAR-detected) but absent from AIS.
- **Implementation:** Set difference between SAR-detected ships and AIS-matched ships within the origin window.
- **Output:** A distinct "unidentified vessel" list, ranked highest by default (matches the real-world pattern that intentional polluters go dark).

#### F9 — Bidirectional Attribution Scoring (novel), with Infrastructure-Proximity Check
- **What:** Combine backward-hindcast proximity with forward-simulated plume matching for each candidate vessel — and first check whether the origin traces to known fixed infrastructure rather than a moving vessel at all.
- **Implementation:**
  - **Infrastructure-proximity check (run first, before the vessel search):** overlay a static layer of known rig, pipeline, and refinery-outflow locations (public charted positions — ONGC platform data where available, OSM offshore-infrastructure datasets as fallback) onto the reconstructed origin window. If the slick's traced origin matches a charted rig or pipeline route, attribute to the infrastructure directly — this is higher-confidence and far simpler than vessel-based attribution, and resolves a whole class of spills (rig blowouts, pipeline leaks) in one step without needing AIS at all.
  - **Vessel-based scoring (if no infrastructure match):** for each trust-weighted AIS candidate (F7), run a forward OpenDrift simulation from its position/course at the estimated origin time; score similarity between the simulated plume and the observed slick shape/position (IoU or centroid-distance metric). Combine with proximity, trajectory consistency, and behavioral-anomaly score (speed/course deviation, AIS gap history) into a single weighted suspect score.
- **Output:** Either a direct infrastructure attribution, or a ranked vessel suspect list with sub-scores broken out (not just a single number).
- **Caveat:** infrastructure-proximity data has the same access gap as everything else in this project — full-resolution ONGC platform coordinates may not be public for Indian waters, so use whatever charted positions are genuinely available and state the gap honestly rather than assume complete coverage. Don't let this check bias detection effort toward known infrastructure either — deliberate illegal discharge disproportionately happens in open transit lanes specifically because they're less monitored, so the vessel-based path (F6–F8) must stay equally weighted, not treated as a fallback.

#### F10 — Evidence Dossier Generation
- **What:** Auto-generate a structured, exportable report per suspect vessel.
- **Implementation:** Template-driven report (PDF/HTML) pulling in: SAR scene reference, mask overlay, AIS trust score, drift run parameters and confidence, sub-scores, and a plain-language disclaimer framing the output as an investigative lead.
- **Output:** Shareable dossier per suspect, suitable for handoff to an investigator.

#### F11 — Visualization Dashboard
- **What:** Single-pane operator interface tying everything together.
- **Implementation:** Map-based frontend (Leaflet or deck.gl) showing SAR overlay, drift animation, AIS tracks color-coded by trust score, and the ranked suspect table with drill-down into each dossier.
- **Output:** Interactive web dashboard.

#### F12 — Synthetic Benchmark & Validation Harness (novel, submission asset)
- **What:** A reusable tool to generate ground-truth-paired scenarios for evaluating the whole pipeline.
- **Implementation:** Combine a real Zenodo SAR spill + OpenDrift forward-simulated "true" source vessel + synthetic AIS with configurable dark-period/spoofing injection rates.
- **Output:** Precision/recall numbers for the attribution model — the thing no existing public work can report, and the basis for your feasibility claims.

#### F13 — Response Coordination & Intercept Planning
- **What:** Extend the pipeline past analysis into operational decision support — recommend which responder asset (Coast Guard vessel, port authority craft) is best positioned to intercept the slick or the suspect vessel.
- **Implementation:** Maintain a responder-asset layer (known Coast Guard/port authority vessel positions — real if accessible, illustrative/synthetic for the demo). Given the forward drift forecast (F5) and suspect vessel's projected course, compute proximity/ETA for each responder asset using standard routing/distance calculations, and rank by fastest feasible intercept.
- **Output:** A ranked responder recommendation with estimated time-to-intercept, surfaced alongside the suspect dossier — shifts the tool from "analysis" to "operational decision support," which matters directly for the Disaster Management theme.
- **Note:** This closes the gap between our pipeline (which previously ended at attribution/evidence) and a full operational workflow. Competing teams on this PS (e.g. MARITRACE) already pitch a `DETECT → ATTRIBUTE → PREDICT → RESPOND → PRESERVE EVIDENCE` workflow — design our own equivalent narrative banner for the pitch, built around our actual pipeline order (drift/origin reconstruction has to happen before or alongside attribution, not strictly after).

### 5.4 Non-functional requirements

- **Explainability:** Every score must be traceable to its inputs (no black-box suspect ranking).
- **Honesty of confidence:** No output should imply certainty the underlying stage doesn't support (age, origin point, attribution).
- **Modularity:** Every data source (SAR provider, AIS provider, current/wind provider) must be swappable via a clean adapter interface — this is what makes the "path to real deployment" story credible.
- **Latency:** End-to-end pipeline run should complete within minutes for a demo scene, not hours — matters for a live SIH demo.

---

## 6. Tech Stack

### 6.1 Detection (Stage 1)

| Component | Options | Recommendation |
|---|---|---|
| Framework | PyTorch vs TensorFlow | **PyTorch** — better ecosystem for segmentation (segmentation-models-pytorch), more community SAR-specific code to reference |
| Architecture | U-Net, DeepLabV3+, Mask R-CNN | **U-Net** (via `segmentation-models-pytorch`) — best accuracy/compute tradeoff for a 6GB VRAM GPU; DeepLabV3+ is heavier for marginal gains at this scale |
| Geo-processing | GDAL, rasterio | **rasterio** — more Pythonic API, sufficient for this scope; drop to raw GDAL only if you hit a rasterio limitation |
| Image processing | OpenCV | OpenCV, standard choice |

### 6.2 Drift modeling (Stage 2)

| Component | Options | Recommendation |
|---|---|---|
| Drift engine | OpenDrift/OpenOil vs custom Lagrangian model | **OpenDrift** — peer-reviewed, purpose-built, free, actively maintained; building custom here wastes time on a solved problem |
| Ocean currents | Copernicus Marine Service, HYCOM, OSCAR | **Copernicus Marine** — free registration, best documented API, good global coverage including Indian Ocean |
| Wind | GFS, ECMWF | **GFS** — fully free and open (NOAA); ECMWF's free tier is more restricted |

### 6.3 AIS processing (Stage 3)

| Component | Options | Recommendation |
|---|---|---|
| Data processing | Pandas/GeoPandas | **GeoPandas** — native spatial joins needed for filtering by origin ellipse |
| Spatial DB | PostGIS vs plain PostgreSQL vs SQLite/SpatiaLite | **PostGIS** if you want a real deployment story; **SQLite/SpatiaLite** is fine and zero-infra for a hackathon demo — don't over-engineer this for the 36-hour build |
| AIS data (demo) | marinecadastre.gov real samples + your own synthetic generator | Use real US sample data to prove the pipeline works, synthetic Indian-waters data (clearly labeled) to show the applied scenario |
| Responder-asset data (F13) | Real Coast Guard/port authority positions (likely inaccessible) vs illustrative synthetic fleet | Synthetic responder fleet for the demo, clearly labeled — same honesty pattern as the AIS data |
| Rig/pipeline position data (F9) | ONGC platform data (likely gated) vs OSM offshore-infrastructure layer | OSM offshore-infrastructure data as the open fallback; note the same access-gap honestly rather than assume full ONGC coverage |

### 6.4 Backend / API

| Component | Options | Recommendation |
|---|---|---|
| Framework | FastAPI vs Flask vs Django | **FastAPI** — async support matters for long-running model/drift jobs, built-in OpenAPI docs help judges understand your API surface fast |
| Task orchestration | Celery vs simple background tasks | For hackathon scope: **FastAPI BackgroundTasks** is enough; only reach for Celery/Redis if you need real job queuing for demo reliability |

### 6.5 Frontend / visualization

| Component | Options | Recommendation |
|---|---|---|
| Framework | React + Leaflet/deck.gl vs Streamlit | **React + Leaflet** if your team has frontend bandwidth (you do — you've shipped several React/Next.js projects) for a polished demo; **Streamlit** only as a fallback if time runs critically short |
| Charting | Recharts, D3 | **Recharts** for score breakdowns — simpler, sufficient |

### 6.6 Infrastructure (given your existing setup)

| Component | Recommendation |
|---|---|
| Model training | Your RTX 3050 (6GB VRAM) — train at reduced tile resolution (e.g., 256×256 patches), gradient accumulation if batch size needs padding out |
| Backend/dashboard hosting | Your Oracle Cloud ARM VM (2 OCPU/12GB RAM) — sufficient for FastAPI + OpenDrift runs (drift modeling is CPU/numerically bound, not GPU-bound, so this fits your existing free-tier VM well) |
| Storage | Local disk for hackathon scope; no need for cloud object storage given data volumes involved |

### 6.7 Overall recommended stack summary

```
Detection:    PyTorch + segmentation-models-pytorch (U-Net) + rasterio + OpenCV
Drift:        OpenDrift/OpenOil + Copernicus Marine (currents) + GFS (wind)
AIS:          GeoPandas + SQLite/SpatiaLite (demo) → PostGIS (production path)
Backend:      FastAPI
Frontend:     React + Leaflet + Recharts
Infra:        RTX 3050 (training) + Oracle Cloud ARM VM (serving/demo)
```

This entire stack is achievable at zero recurring cost on hardware you already own.

---

## 7. Additional Things to Implement / Consider

1. **Data Partnership Roadmap section** (for the submission, not the code): name the specific MoUs needed (Indian Coast Guard AIS feed, ISRO Bhuvan SAR access) and what a 6–12 month post-win development plan looks like — SIH's own process explicitly gives winning teams this window with the owning ministry, so show you already understand and are ready for it.
2. **Explicit limitations slide/section**: age/thickness estimation uncertainty, forecast validity window, "investigative lead not verdict" framing — stated upfront, not discovered by judges during Q&A.
3. **Synthetic benchmark generator as a standalone open-source release** (independent of the SIH submission) — gives the project a citation trail and life beyond the hackathon outcome.
4. **Stakeholder validation before the hackathon**: even an informal letter of interest or conversation with a port authority / Coast Guard contact meaningfully differentiates the submission.
5. **Live demo resilience plan**: pre-run and cache at least one full pipeline pass on a known-good scene in case live inference is slow or network-dependent APIs (Copernicus, GFS) are unavailable during judging.
6. **Cost/scalability slide**: rough estimate of compute cost to run this at a national monitoring scale (satellite revisit cadence × coastline coverage) — judges explicitly reward teams who can answer "what would this cost to actually run."
7. **Team task split**: assign detection (ML), drift modeling (OpenDrift/data pipeline), AIS/attribution logic, and frontend/dashboard as separate tracks that can be built in parallel and integrated late — reduces integration risk given three genuinely different subsystems.
8. **Competitive-landscape awareness**: other teams (e.g. "MARITRACE") are building working prototypes on this exact PS with a similar DETECT → ATTRIBUTE → PREDICT → RESPOND workflow. Their public description does not mention AIS trust scoring, dark-vessel detection, look-alike/false-positive handling, uncertainty quantification, or a validation methodology against ground truth — treat these as our differentiators, and explicitly prepare answers for judge questions like "how do you handle a vessel that went dark before the discharge?" since a competing team without a good answer to that is exactly where ours should separate.

---

*Document prepared for SIH PS 26143 (NTRO) — Marine Oil Spill Detection & Vessel Attribution.*
