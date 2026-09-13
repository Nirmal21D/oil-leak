# AegisSea (SIH PS 26143) — NTRO Jury Defense & Technical Q&A Playbook

**System Name**: AegisSea Maritime Intelligence & Tactical C2 Console  
**Problem Statement**: SIH PS 26143 — AI Marine Oil Spill Detection & Reconstructed Origin Attribution  
**Lead Agency**: National Technical Research Organisation (NTRO)  
**Document Purpose**: Dedicated technical defense reference, jury inquiry playbook, and methodological boundary audit covering all 50 operational, algorithmic, and scientific questions.  
**Classification**: Engineering Defense Reference (Internal Jury Preparation)  
**Date**: September 13, 2026  

---

## Strategic Jury Defense Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AEGISSEA JURY DEFENSE PRINCIPLES                     │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. ABSOLUTE SCIENTIFIC HONESTY: AegisSea is a working software          │
│    prototype for SIH PS 26143, demonstrating multi-criteria physical    │
│    and deep learning pipelines. We never claim fielded military status. │
│                                                                         │
│ 2. INVESTIGATIVE LEADS, NOT LEGAL GUILT: We produce an uncalibrated     │
│    "Investigative Priority Index" to focus manual Coast Guard boarding  │
│    inspections, preserving the presumption of innocence.                │
│                                                                         │
│ 3. RIGOROUS COMPLIANCE WITH PS 26143: Synthetic AIS with noise and     │
│    explicit SYN-AIS identifiers satisfies the problem statement while   │
│    avoiding legal entanglements with real commercial vessels.           │
│                                                                         │
│ 4. QUANTIFIED SENSITIVITY: Rather than claiming pinpoint origin truth,  │
│    our empirical sensitivity analysis proves that hydrodynamic drift is │
│    bounded within a ±3.5 km sensitivity envelope under ±20% variance.   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Master 50-Point Technical Defense Matrix

All 50 technical vulnerabilities and design questions are categorized into three operational execution tiers:
- **Tier 1: MUST FIX BEFORE SIH (Core Survival & Credibility)** — High-risk overclaims or UI misrepresentations directly resolved and corrected in code, UI, and documentation.
- **Tier 2: SHOULD FIX (Empirical Defense & Methodological Grounding)** — Scientific and analytical gaps addressed via empirical benchmark scripts, mathematical justifications, and UI visual disclosures.
- **Tier 3: FUTURE SCOPE (NTRO Production Roadmap & Q&A Armor)** — Long-term operational capabilities formatted as crisp, authoritative answers for jury inquiries.

| # | Vulnerability / Review Issue | Category | Tier | Implemented Resolution & Defense Strategy |
|---|---|---|---|---|
| **1** | *"100% empirically verified" is too strong* | Critical | **Tier 1 (Fixed)** | Replaced across all reports and UI with "Internal Component Verification Passed (8/8 Suite)". We prove code execution correctness and Zenodo held-out validation, while acknowledging real-world maritime validation requires operational sea trials. |
| **2** | *AIS attribution demonstrated primarily with synthetic AIS* | Critical | **Tier 1 (Fixed)** | All candidates prefixed with `SYN-AIS-XXXX` and labeled `SYNTHETIC DEMO SCENARIO`. Disclose: PS 26143 explicitly permits synthetic AIS when live feeds are unavailable, eliminating legal liability against registered commercial vessels. |
| **3** | *93.1% score misunderstood as probability of guilt* | Critical | **Tier 1 (Fixed)** | Terminology changed throughout system to **Investigative Priority Score (Heuristic Index: 93.1)**. Explicitly disclaim that the score prioritizes manual Coast Guard boarding inspections and is not a calibrated Bayesian probability of guilt. |
| **4** | *Ground truth for spill origin not sufficiently demonstrated* | Drift | **Tier 3 (Future Scope)** | Open-source maritime datasets lack synchronized true release coordinates. Defend: Reconstructed trajectory is mathematically derived from validated 2D Lagrangian equations (current + windage + tide), and origin uncertainty is bounded to a $\pm 3.5\text{ km}$ sensitivity envelope. |
| **5** | *Drift model appears simplified* | Drift | **Tier 1 & 2 (Fixed/Defended)** | Acknowledged as 2D Lagrangian advection prototype. Executed `scripts/run_sensitivity_analysis.py` proving origin displacement remains $\le 3.18\text{ km}$ under $\pm 20\%$ oceanographic variance. |
| **6** | *No strong real-world end-to-end benchmark* | Critical | **Tier 3 (Future Scope)** | Prototype demonstrates complete end-to-end data pipeline: SAR GeoTIFF $\rightarrow$ ResNet34 U-Net $\rightarrow$ Polygon Georeferencing $\rightarrow$ Lagrangian Hindcasting $\rightarrow$ AIS spatio-temporal query $\rightarrow$ 3-term attribution. Real incident sea-trials are designated for Phase 2 with INCOIS/NTRO. |
| **7** | *Metrics look good but need geographical generalization* | SAR/AI | **Tier 2 (Defended)** | Model is evaluated on 1,615 held-out Zenodo validation samples ($67.25\%$ IoU, $90.5\%$ precision). Disclose: Architecture uses ImageNet ResNet34 feature priors and hybrid Focal+Dice loss to generalize across C-band SAR backscatter distributions. |
| **8** | *Dataset split may not prove scene-level holdout* | SAR/AI | **Tier 2 (Disclosed/Defended)** | Disclosed that Zenodo SOS consists of $256 \times 256$ localized crops (median oil coverage $11.3\%$). Cross-basin scene holdouts (e.g. Arabian Sea vs Bay of Bengal) are scheduled for the next retraining milestone. |
| **9** | *Three-class segmentation needs lookalike explanation* | SAR/AI | **Tier 2 (Documented)** | Explained physical radar mechanism: Biogenic films (Class 2) form monomolecular layers that dampen capillary ripples only, whereas mineral crude (Class 1) dampens gravity-capillary waves, causing persistent deep backscatter drops ($<-24\text{ dB}$) with high-aspect-ratio slick morphology. |
| **10** | *No clear false-positive analysis* | SAR/AI | **Tier 2 (Defended)** | ResNet34 U-Net achieved $90.5\%$ precision on held-out data. Low-wind false positives are suppressed by penalizing ambiguous lookalikes via the 3rd semantic class and CFAR target decoupling. |
| **11** | *Full-scene inference doesn't mean operational detection* | SAR/AI | **Tier 1 (Implemented)** | Implemented sliding-window tiling ($256 \times 256$, stride 128, $50\%$ overlap blending) in `unet_detector.py`. Empirically verified across $2048 \times 2048$ simulated SAR rasters in $2.513\text{ seconds}$ without tile boundary seams. |
| **12** | *Georeferencing needs stronger evidence* | SAR/AI | **Tier 1 (Implemented)** | `SlickPhysicsAnalyzer` applies affine transform matrices to convert pixel coordinates into WGS84 GeoJSON polygons, computing exact geographic centroid, perimeter ($5.96\text{ km}$), and surface area ($2.0\text{ km}^2$). |
| **13** | *Detection and characterization are not the same thing* | Characterization | **Tier 1 (Implemented)** | Multi-stage decoupled pipeline: Stage 1 = Deep learning pixel segmentation; Stage 2 = Classical physical morphology and Fay spreading theory weathering analysis. |
| **14** | *Spill area calculation needs uncertainty* | Characterization | **Tier 2 (Implemented)** | Incorporated an explicit $\pm 15\%$ uncertainty margin ($2.0 \pm 0.3\text{ km}^2$) reflecting SAR mixed-pixel edge ambiguity and spatial resolution limits. |
| **15** | *No clear oil-volume estimation (Area $\ne$ Volume)* | Characterization | **Tier 1 (Implemented)** | Implemented Fay surface spreading thickness calculation yielding estimated volume ($4.24\text{ m}^3$ / $3.69\text{ tons}$ for test fixture; $31.8\text{ m}^3$ for incident scenario). Explicitly disclosed as theoretical estimate requiring multi-spectral validation. |
| **16** | *The 3.5% windage assumption needs justification* | Drift | **Tier 2 (Justified)** | A 3.5% windage coefficient is used as a prototype assumption consistent with commonly used surface-oil drift parameterizations. Production calibration will use oil type, slick state, and observational data. |
| **17** | *Oil weathering isn't sufficiently represented* | Drift | **Tier 3 (Future Scope)** | Prototype computes kinematic advection and Fay spreading stage. Integration with full 3D chemical weathering engines (NOAA ADIOS2) for evaporation and emulsification is slated for production phase. |
| **18** | *Tide treatment appears limited to M2* | Drift | **Tier 2 (Justified)** | M2 is used as the dominant semi-diurnal tidal constituent in the prototype ($12.42\text{h}$ period); additional constituents such as K1, O1, and S2 are planned for operational deployment. |
| **19** | *Environmental data dependency isn't demonstrated* | Drift | **Tier 2 & 3 (Documented)** | Formally documented operational data schema: Copernicus Marine Service (CMEMS $0.083^\circ, 6\text{h}$) for surface currents and ECMWF ERA5 ($0.25^\circ, 1\text{h}$) for 10m winds, with bilinear spatio-temporal interpolation. |
| **20** | *Hindcast uncertainty isn't quantified* | Drift | **Tier 1 & 2 (Implemented)** | Added Leaflet C2 visualization rendering a dashed amber $\pm 3.5\text{ km}$ sensitivity envelope circle around the reconstructed release locus, scientifically justified by our empirical sensitivity analysis. |
| **21** | *The "27 waypoints" demonstration isn't validation* | Drift | **Tier 1 (Clarified)** | Documented that 27 waypoints demonstrate numerical trajectory integration at $\Delta t = 15\text{ min}$ intervals, whereas physical validity is supported by the empirical sensitivity envelope ($3.18\text{ km}$ maximum deviation). |
| **22** | *Synthetic AIS is a major demonstration limitation* | AIS | **Tier 1 (Disclosed)** | Transparently highlighted in UI and presentation. Complies fully with PS 26143 rules allowing synthetic data. |
| **23** | *AIS reconstruction needs stronger temporal methodology* | AIS | **Tier 2 (Formalized)** | Defined rigorous spatio-temporal candidate query: Temporal search window = $T_{\text{spill}} \pm 12\text{ hours}$; Spatial bounding box = Reconstructed origin locus $\pm 50\text{ km}$. |
| **24** | *AIS gaps can produce misleading conclusions* | AIS | **Tier 1 (Mitigated)** | AIS transponder gaps are not treated as proof of guilt; they serve as one of three components within the auxiliary anomaly sub-score ($S_{\text{anomaly}}$), balanced against course and proximity. |
| **25** | *Speed drop isn't necessarily suspicious* | AIS | **Tier 1 (Contextualized)** | Speed reductions are evaluated in conjunction with spatial coincidence at the release point. Benign vessels slowing for traffic receive low overall scores if their track does not align with the reconstructed drift origin. |
| **26** | *Draft change isn't necessarily pollution evidence* | AIS | **Tier 1 (Grounded)** | Replaced hardcoded checks with dynamic data fields: $\Delta \text{draft} = \text{initial\_draft} - \text{current\_draft}$. Disclosed as circumstantial evidence indicating potential liquid deballasting or cargo discharge. |
| **27** | *Scoring weights appear manually selected (Why 45/30/25?)* | Attribution | **Tier 1 (Documented)** | Documented as expert heuristic weights reflecting investigative utility: Spatial proximity acts as the primary physical gate ($45\%$), trajectory direction confirms intersection with the drift track ($30\%$), and behavioral telemetry flags suspicious anomalies ($25\%$). |
| **28** | *No calibration of attribution scores* | Attribution | **Tier 1 (Corrected)** | Replaced all "probability of guilt" wording with "Investigative Priority Score (Uncalibrated Heuristic Index)". |
| **29** | *Proximity can dominate attribution* | Attribution | **Tier 2 (Benchmarked)** | Executed controlled 100-trial Monte Carlo benchmark showing proximity-only ranking fails in $48\%$ of trials when innocent ships pass nearby, while AegisSea's 3-term criteria achieves $100\%$ accuracy by evaluating heading alignment and telemetry anomalies. |
| **30** | *Trajectory similarity needs careful definition* | Attribution | **Tier 1 (Defined)** | Formally defined mathematically as directional cosine similarity between the candidate vessel's SOG/COG motion vector and the forward drift corridor from release locus to observed slick: $\cos(\theta) = \max(0, \cos(\theta_{\text{vessel}} - \theta_{\text{drift}}))$. |
| **31** | *No baseline/control comparison demonstrated* | Attribution | **Tier 2 (Benchmarked)** | Executed `scripts/attribution_baseline_benchmark.py`: Random Baseline ($23.0\%$ measured / $25.0\%$ theoretical), Proximity-Only Baseline ($52.0\%$), AegisSea 3-term engine ($100.0\%$ Rank-1 identification on this controlled synthetic benchmark). |
| **32** | *Dark target $\ne$ oil (CFAR confusion)* | CFAR/Radar | **Tier 1 (Clarified)** | Clarified physical distinction: CFAR detects high-RCS metallic vessel hulls ($>14.2\text{ dB}$ backscatter peak), whereas U-Net detects low-backscatter oil slicks ($<-24\text{ dB}$). Decoupled in system architecture. |
| **33** | *CFAR false positives need demonstration* | CFAR/Radar | **Tier 2 (Documented)** | Documented dual-polarization (VV/VH) clutter filtering and morphological thresholding to eliminate sea-clutter spikes and breaking wave crests. |
| **34** | *Responder routing appears downstream of detection* | Operations | **Tier 1 (Subordinated)** | Framed responder routing as a downstream tactical decision-support feature, keeping primary jury focus on core detection, hindcast, and attribution. |
| **35** | *"Optimal route" needs environmental constraints* | Operations | **Tier 3 (Future Scope)** | Current module implements Great Circle geodesic vectoring and boom deployment estimation. Incorporation of sea-state-constrained isochrone weather routing is designated for production integration. |
| **36** | *Documented architecture stronger than actual persistence layer* | Architecture | **Tier 1 (Separated)** | Report explicitly distinguishes between the current in-memory/JSON prototype persistence layer and the production PostGIS/TimescaleDB enterprise specification. |
| **37** | *Raw satellite imagery should not be in PostgreSQL* | Architecture | **Tier 1 (Decoupled)** | Documented production storage strategy: Cloudflare R2 / AWS S3 for raster GeoTIFF and NetCDF arrays, PostgreSQL/PostGIS strictly for vector geometries, metadata, and attribution logs. |
| **38** | *AIS database design needs partitioning/indexing* | Architecture | **Tier 2 (Designed)** | Documented production database schema utilizing TimescaleDB hypertables partitioned by time (1-day chunks) and indexed with PostGIS GiST spatial indexes on vessel geometries. |
| **39** | *No clear data lineage* | Architecture | **Tier 1 & 2 (Implemented)** | Implemented cryptographic SHA-256 digital fingerprinting in the Evidence Dossier; documented full lineage: Scene ID $\rightarrow$ Preprocessing $\rightarrow$ Model Weights $\rightarrow$ Spill Polygon $\rightarrow$ Hindcast Run $\rightarrow$ AIS Candidate $\rightarrow$ Dossier ID. |
| **40** | *Model versioning isn't sufficiently detailed* | Reproducibility | **Tier 1 (Documented)** | Recorded exact model metadata: Architecture (ResNet34 U-Net), Checkpoint (`sos_unet_resnet34.pth`, 84.3 MB), input normalization, and PyTorch 2.6.0 (CUDA 12.4) runtime. |
| **41** | *Dataset versioning needs stronger treatment* | Reproducibility | **Tier 1 (Documented)** | Documented Zenodo DOI: `10.5281/zenodo.15298010`, split counts (6,455 train / 1,615 val), patch dimensions ($256 \times 256$), and class encoding. |
| **42** | *Environmental-data reproducibility is critical* | Reproducibility | **Tier 1 & 2 (Documented)** | Dossier output permanently timestamps and preserves the exact oceanographic snapshot parameters (current vectors, wind vectors, tidal amplitude) utilized during the hindcast run. |
| **43** | *8/8 tests passing doesn't establish system accuracy* | Testing | **Tier 1 (Clarified)** | Clarified in documentation and presentations that the 8/8 test suite verifies internal software execution and pipeline integration, while algorithmic accuracy is established via the $67.25\%$ Zenodo IoU benchmark. |
| **44** | *Need negative/adversarial test cases* | Testing | **Tier 2 (Tested)** | Documented model behavior on zero-slick ocean scenes, biogenic lookalikes, high sea-state noise, and vessels transiting without telemetry gaps. |
| **45** | *Need sensitivity analysis* | Testing | **Tier 2 (Benchmarked)** | Executed `scripts/run_sensitivity_analysis.py`, evaluating $\pm 20\%$ current/wind variances and $2.5\% - 4.5\%$ windage factor spread, establishing a maximum origin displacement of $3.18\text{ km}$. |
| **46** | *No sufficiently detailed security architecture* | Security/NTRO | **Tier 3 (Future Scope)** | Documented production defense-in-depth architecture: TLS 1.3, JWT RBAC, AES-256 encryption at rest, and air-gapped NTRO deployment guidelines. |
| **47** | *Evidence integrity isn't addressed sufficiently* | Security/NTRO | **Tier 1 (Implemented)** | Incident Evidence Dossier computes an automated SHA-256 cryptographic hash providing a tamper-evident integrity fingerprint of all scenario parameters and findings. |
| **48** | *Dashboard looks more operational than evidence warrants* | UI/Demo | **Tier 1 (Truth-in-Labeling)**| Implemented strict UI truth-in-labeling: Added visual tags distinguishing `OBSERVED`, `MODEL-DERIVED`, `PREDICTED`, and `SYNTHETIC / DEMONSTRATION`. |
| **49** | *Synthetic vessel should be visually obvious* | UI/Demo | **Tier 1 (Implemented)** | Added amber `SYNTHETIC DEMO` badges to all candidate vessel cards, map popups, and the correlation matrix table. |
| **50** | *"Responsible vessel" is potentially too strong* | UI/Demo | **Tier 1 (Implemented)** | Renamed all UI headers, tooltips, and dossier sections from "Responsible Vessel" to **"Primary Investigative Lead"** and **"Top Attribution Candidate"**. |

---

## Detailed Jury Defense Playbook (Category-by-Category)

### Category A: Critical Credibility & Scoping (Issues 1–6)

#### Q1: "Your report claims 100% verification. Have you actually proven this works on real-world oil spills?"
**Defense Response**:
> *"No, and we want to be completely transparent about that. Our 8/8 test suite verifies internal software execution and component contract satisfaction. Algorithmic segmentation accuracy is established at 67.25% IoU on held-out Zenodo Sentinel-1 data. However, real-world maritime operational reliability requires sea-trial validation with NTRO and INCOIS, which is our designated Phase 2 milestone."*

#### Q2: "You identified MT Ocean Pioneer with a 93.1% score. Are you accusing this ship of illegal dumping?"
**Defense Response**:
> *"Not at all. MT Ocean Pioneer (SYN-AIS-9482) is a synthetic scenario generated strictly in accordance with PS 26143 rules to avoid legal liability on real vessels. Furthermore, 93.1 is an uncalibrated heuristic Investigative Priority Score designed to help Coast Guard watch officers prioritize manual reconnaissance assets. It preserves the presumption of innocence and does not represent a calibrated probability of legal guilt."*

#### Q3: "How do you know your backward drift model actually reaches the true origin of a spill?"
**Defense Response**:
> *"True discharge ground truth (the exact second and GPS point of an illegal open-water dump) is virtually non-existent in public satellite catalogs. Therefore, we evaluate our 2D Lagrangian advection engine using numerical integration stability and an empirical sensitivity analysis. Under ±20% oceanographic current and wind perturbations, the reconstructed locus shifts by at most 3.18 km, justifying our ±3.5 km sensitivity envelope."*

---

### Category B: SAR & Computer Vision Rigor (Issues 7–15)

#### Q4: "Why is your oil spill IoU 67.25% and not 95%?"
**Defense Response**:
> *"In marine SAR oil spill detection, raw accuracy is a misleading metric because open water comprises >98% of any scene. A trivial model predicting 'Sea Water everywhere' achieves 99% accuracy but 0% IoU. 67.25% IoU on held-out Sentinel-1 C-band data reflects high intersection strictly on true mineral oil slicks, trained with a hybrid Focal and Dice loss specifically designed to overcome extreme class imbalance."*

#### Q5: "How does your U-Net distinguish true mineral oil from biogenic lookalikes or low-wind slicks?"
**Defense Response**:
> *"Mineral crude dampens both capillary ripples and short gravity waves, producing persistent, steep radar backscatter drops (typically <-24 dB) and sharp, high-aspect-ratio filamentous contours. In contrast, biogenic natural films form monomolecular layers that dampen capillary ripples only, exhibiting diffuse gradients and higher minimum backscatter. Our 3-class architecture explicitly penalizes lookalike confusion."*

#### Q6: "Why did your preset demonstration report 84% oil coverage?"
**Defense Response**:
> *"The preset image is a 256×256 localized patch cropped directly from the core of an offshore slick in the Zenodo SOS dataset. Ground-truth manual annotation for that specific patch is 79.72% oil; our model segmented 84.03% (IoU = 81.4%). Across the full held-out dataset, median oil coverage is 11.3%. In an uncropped Sentinel-1 scene, oil occupies <1-3%."*

---

### Category C: Physical Drift & Hindcast Dynamics (Issues 16–21)

#### Q7: "Why did you use a 3.5% windage factor, and what happens if the wind varies?"
**Defense Response**:
> *"A 3.5% windage coefficient is used as a prototype parameter consistent with standard marine surface-drift literature. Because surface windage depends on crude oil API gravity and slick weathering, we executed an empirical sensitivity benchmark: varying windage between 2.5% and 4.5% causes only 0.46 to 1.37 km of origin displacement. The total coupled variance remains well within our ±3.5 km sensitivity envelope."*

#### Q8: "Why did you only include the M2 tide?"
**Defense Response**:
> *"The M2 principal lunar semi-diurnal constituent (period 12.42 hours) is the dominant astronomical tidal component in the Arabian Sea and Mumbai High shelf, responsible for the characteristic trajectory curvature. For production deployment, our architecture is designed to ingest the complete TPXO9 tidal harmonic atlas (incorporating S2, K1, and O1)."*

---

### Category D: AIS Correlation & Attribution Scoring (Issues 22–31)

#### Q9: "Why did you choose 45%, 30%, and 25% for your scoring weights?"
**Defense Response**:
> *"These weights are expert-defined heuristic weights based on operational maritime investigative practice: Spatial proximity acts as the primary physical gate (45%), course alignment verifies whether the vessel's track intersects the drift corridor (30%), and behavioral anomalies provide circumstantial corroboration (25%). They are not presented as learned statistical coefficients."*

#### Q10: "If an innocent vessel transits near the spill origin, won't proximity-only scoring falsely blame it?"
**Defense Response**:
> *"Exactly—and that is why our 3-term engine is essential. In our controlled 100-trial benchmark with an innocent vessel passing within 1.44–2.20 km of the origin, proximity-only ranking failed in 48% of trials. AegisSea achieved 100% Rank-1 discrimination by evaluating course divergence and checking for telemetry anomalies like cargo draft drops and transponder blackouts."*

---

### Category E: Big Data, Security & Architecture (Issues 36–47)

#### Q11: "How will your database handle 100 million AIS pings per day?"
**Defense Response**:
> *"Our production architecture implements a 2-stage decoupling: High-volume AIS streams are ingested into TimescaleDB hypertables partitioned by time (1-day chunks) and spatially indexed using PostGIS GiST. When a spill is detected, Stage 1 executes a spatio-temporal bounding box query filtering 100M pings down to ~15 candidate vessels within ±50 km and ±12 hours. Stage 2 evaluates the intensive Lagrangian 3-term scoring strictly on those 15 candidates."*

#### Q12: "Where are satellite images stored, and how do you ensure evidence integrity?"
**Defense Response**:
> *"Multi-gigabyte Sentinel-1 GeoTIFF rasters and NetCDF grids are stored in distributed object storage (Cloudflare R2 / AWS S3), while PostGIS strictly persists vector geometries, centroids, and attribution records. To ensure chain of custody, our Incident Evidence Dossier computes an automated SHA-256 tamper-evident integrity fingerprint sealing the raw inputs, model weights, and attribution findings."*
