# AegisSea

> **Maritime Intelligence & Tactical C2 Console for Autonomous SAR Oil Spill Detection, Hydrodynamic Hindcasting, and Multi-Signal Vessel Attribution**  
> Developed for **Smart India Hackathon (SIH) Problem Statement 26143** (Lead Organization: *National Technical Research Organisation — NTRO*).

[![Frontend: Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014.2.5-black?style=flat-square&logo=next.js)](frontend/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115.0-009688?style=flat-square&logo=fastapi)](backend/)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](backend/)
[![Deep Learning: PyTorch](https://img.shields.io/badge/Deep%20Learning-PyTorch%202.0%2B%20%7C%20SMP-EE4C2C?style=flat-square&logo=pytorch)](backend/app/models/)
[![Geospatial: PostGIS & GDAL](https://img.shields.io/badge/Geospatial-PostGIS%20%7C%20GeoPandas-336791?style=flat-square&logo=postgresql)](backend/app/db.py)
[![Radar: Sentinel--1 SAR](https://img.shields.io/badge/Radar-Sentinel--1%20C--Band%20SAR-003399?style=flat-square)](data/)
[![Metocean: CMEMS](https://img.shields.io/badge/Metocean-Copernicus%20Marine%20Service-0077BE?style=flat-square)](backend/app/services/metocean_provider.py)
[![AIS: NOAA MarineCadastre](https://img.shields.io/badge/AIS-NOAA%20MarineCadastre-blue?style=flat-square)](data/historical_ais/)
[![Response: NGA WPI](https://img.shields.io/badge/Infrastructure-NGA%20World%20Port%20Index%20(Pub%20150)-critical?style=flat-square)](backend/app/services/nga_port_service.py)

---

## Table of Contents

- [1. Executive Overview](#1-executive-overview)
- [2. Problem Statement (SIH PS 26143)](#2-problem-statement-sih-ps-26143)
- [3. Core Capabilities](#3-core-capabilities)
- [4. System Architecture](#4-system-architecture)
- [5. End-to-End Data Flow](#5-end-to-end-data-flow)
- [6. Technical Methodology](#6-technical-methodology)
  - [6.1 Dual-Polarization SAR Ingestion & Radiometric Normalization](#61-dual-polarization-sar-ingestion--radiometric-normalization)
  - [6.2 Deep Learning Segmentation Architecture (ResNet-34 U-Net)](#62-deep-learning-segmentation-architecture-resnet-34-u-net)
  - [6.3 Slick Morphology & Fay Spreading Regime](#63-slick-morphology--fay-spreading-regime)
  - [6.4 Hydrodynamic Hindcasting & Forecasting (2D Lagrangian Solver)](#64-hydrodynamic-hindcasting--forecasting-2d-lagrangian-solver)
  - [6.5 AegisSea Attribution Index Methodology](#65-aegissea-attribution-index-methodology)
- [7. Golden Dataset & Verified Demonstration (`Scene 00111`)](#7-golden-dataset--verified-demonstration-scene-00111)
- [8. Attribution Methodology & Neutral Forensics Governance](#8-attribution-methodology--neutral-forensics-governance)
- [9. Response Infrastructure & NGA World Port Index](#9-response-infrastructure--nga-world-port-index)
- [10. Data Sources & Provenance Matrix](#10-data-sources--provenance-matrix)
- [11. Project Directory Structure](#11-project-directory-structure)
- [12. Technology Stack & Framework Inventory](#12-technology-stack--framework-inventory)
- [13. Installation & Developer Setup](#13-installation--developer-setup)
- [14. API Reference](#14-api-reference)
- [15. Verification Scripts & Automated Test Suite](#15-verification-scripts--automated-test-suite)
- [16. Operational Limitations & Scientific Boundaries](#16-operational-limitations--scientific-boundaries)

---

## 1. Executive Overview

**AegisSea** is an operational-grade Maritime Intelligence and Tactical Command-and-Control (C2) software system engineered to autonomously detect marine oil spills from European Space Agency (ESA) Sentinel-1 Synthetic Aperture Radar (SAR) imagery, reverse-simulate slick drift through coupled hydrodynamic metocean models, reconstruct historical Automatic Identification System (AIS) vessel corridors, and correlate potential source vessels.

### The Intelligence Gap
Marine mineral oil slicks physically disperse, drift, and weather across maritime Exclusive Economic Zones (EEZs). Traditional surveillance models suffer from three structural limitations:
1. **The Separation Fallacy**: The geographic centroid of a satellite-observed slick at acquisition time $T_0$ is *not* where the spill was discharged. Ocean currents, windage (Ekman transport), and tidal oscillations continuously advect surface hydrocarbons.
2. **The Obfuscation Gap**: Discharge incidents (deliberate tank washings, bilge dumps, or unreported mechanical leakages) frequently coincide with AIS transponder blackouts, open-water course alterations, or nocturnal coverage gaps.
3. **The Legal-Scientific Chasm**: Raw proximity between a ship track and an oil slick at arbitrary observation times does not establish source origin. Robust forensic triage requires backwards Lagrangian hydrodynamic advection paired with spatio-temporal kinematic correlation.

### System Classification & Role
```
                                 AEGISSEA DATA CLASSIFICATION SCHEMA
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [OBSERVED]   │ Ground-truth telemetry: Satellite SAR backscatter, raw AIS pings, WPI port nodes │
├──────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ [INFERRED]   │ Machine-learned features: U-Net segmentation mask, slick contours, CFAR contacts  │
├──────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ [MODELED]    │ Physical simulations: Backward Lagrangian drift, Fay spreading, forecast landfall │
├──────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ [CORRELATED] │ Multi-signal attribution ranking: Proximity + Trajectory alignment + Kinematics  │
├──────────────┼───────────────────────────────────────────────────────────────────────────────────┤
│ [RESPONDER]  │ Infrastructure triage: NGA World Port Index discovery & Geodesic Reference Vector │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Decision-Support Boundary**: AegisSea is an investigative decision-support and analytical prioritization platform. It generates ranked **Attribution Candidates** and **Interrogation Leads** to optimize coast guard patrol sorties and port-state control inspections. It **does not independently establish criminal guilt or legal liability**, upholding the strict presumption of innocence.

---

## 2. Problem Statement (SIH PS 26143)

- **Problem Statement ID**: 26143
- **Title**: *Leveraging satellite imagery to determine Oil spills at sea along with AIS data correlations to identify vessel responsible for the spill.*
- **Mandated Operational Workflow**:
  ```
  Satellite SAR Ingestion (Sentinel-1 VV/VH)
         │
         ▼
  Automated Oil Spill Detection & Lookalike Discrimination
         │
         ▼
  Physical Spill Characterization (Area, Perimeter, Volume, Fay Regime)
         │
         ▼
  Metocean Retrieval (Copernicus Marine Service Currents & Wind Vectors)
         │
         ▼
  Hydrodynamic Backward Drift Hindcasting (Reconstructed Release Locus & Uncertainty Envelope)
         │
         ▼
  Historical AIS Traffic Retrieval & Trajectory Construction (Spatiotemporal Window)
         │
         ▼
  Multi-Signal Attribution Scoring (Candidate Ranking & Anomaly Auditing)
         │
         ▼
  Maritime Response Infrastructure (NGA World Port Index & Operational Dispatch Dossier)
  ```

---

## 3. Core Capabilities

### 🛰️ Satellite SAR & Ingestion Engine
- **Sensor Modalities**: Dual-polarization ($VV + VH$) C-Band Sentinel-1 Synthetic Aperture Radar (IW GRDH).
- **Affine Georeferencing**: Direct extraction of GeoTIFF tie points, ModelTransformation affine matrices, and EPSG geotransforms—zero synthetic coordinate fallback for referenced products.
- **Radiometric Preprocessing**: Automated 2nd–98th percentile contrast stretching, inter-polarization differential ratio calculation ($VV - VH$), and dynamic range compression.
- **Contract Enforcement**: Enforces a strict input validation contract (`RasterValidator`), rejecting single-channel ground truth label masks (HTTP 422) to prevent accidental ground-truth leakage during live operations.

### 🧠 Deep Learning Segmentation (ResNet-34 U-Net)
- **Model Topology**: ResNet-34 encoder coupled with a symmetric feature-accumulating U-Net decoder with skip connections.
- **Hard-Negative Training**: Trained with hard-negative mining over ambiguous biogenic lookalikes (algal blooms, low-wind sea slick shadows, internal waves, upwelling).
- **Tiled Sliding-Window Inference**: Seamless execution over full $2048 \times 2048$ SAR swaths using $256 \times 256$ tiles at $50\%$ stride ($128\text{ px}$) with Gaussian coordinate blending.
- **Deterministic Noise Gate**: Operational noise floor rejecting artifacts $<500\text{ pixels}$ ($<0.012\%$ of a standard scene).

### 🌊 Oceanographic Reconstruction & Hydrodynamics
- **Metocean Ingestion**: Direct integration with Copernicus Marine Environment Monitoring Service (CMEMS) for eastward ($u$) and northward ($v$) surface current velocities and 10-meter wind fields.
- **2D Lagrangian Particle Hindcasting**: Time-reversed particle advection integrating ocean currents, $3.5\%$ wind leeway friction, and semi-diurnal ($M_2$) tidal oscillation ($T = 12.42\text{ h}$) over a nominal 6.5-hour hindcast horizon.
- **Uncertainty Envelope**: Gaussian dispersion cone accounting for turbulent eddy diffusivity and current shear.
- **Forward Trajectory Prediction**: 12-hour forward forecast simulating slick landfall horizon and coastal vulnerability vectors.

### 🚢 AIS Traffic Reconstruction & Correlation
- **Real Historical AIS Ingestion**: Historical database reader for NOAA / BOEM MarineCadastre AccessAIS records.
- **Trajectory Builder**: Temporal trajectory reconstruction with ping interpolation, heading interpolation, and transponder blackout detection ($\ge 1.0\text{ hour}$ gaps).
- **Kinematic Anomaly Detection**: Flags high-probability discharge maneuvers including fairway course deflections ($>40.0^\circ$) and anomalous open-ocean speed drops ($<4.0\text{ knots}$).
- **Non-Cooperative / Dark Vessel Detection**: Constant False Alarm Rate (CFAR) radar contact extractor isolating high-backscatter radar targets lacking corresponding AIS broadcasts within a $2.0\text{ km}$ correlation gate.

### ⚓ Response Infrastructure & NGA World Port Index
- **Global Port Registry**: Integration with the National Geospatial-Intelligence Agency (NGA) World Port Index (Pub 150) FeatureServer REST API.
- **Dynamic Bounding Discovery**: Geodesic distance calculation across candidate ports within a $350\text{ km}$ operational radius.
- **Honest Routing Governance**: Full disclosure of geodesic straight-line distance vs. navigable waterway distance via strict `GEODESIC_FALLBACK` labeling when no authoritative maritime routing engine is registered.

### 📜 Evidence Integrity & C2 Dossier
- **Cryptographic Audit Trail**: Automatic SHA-256 fingerprinting of uploaded SAR rasters, inference masks, metocean vectors, and candidate rankings.
- **Printable Tactical Dossier**: Production-ready formal inspection briefing modal with one-click browser print engine formatted for Coast Guard boarding officers and maritime tribunal reviewers.

---

## 4. System Architecture

```
                                  AEGISSEA ARCHITECTURAL PIPELINE
                                  
  [ Sentinel-1 C-Band SAR ]                           [ Copernicus Marine Service ]
       │ (GeoTIFF / PNG)                                   │ (CMEMS Physical Ocean)
       ▼                                                   ▼
┌─────────────────────────┐                         ┌─────────────────────────┐
│     RasterValidator     │                         │    MetoceanProvider     │
│ (Dual-Pol Normalization)│                         │ (u/v Current & 10m Wind)│
└────────────┬────────────┘                         └────────────┬────────────┘
             │                                                   │
             ▼                                                   │
┌─────────────────────────┐                                      │
│   TileSlidingInference  │                                      │
│  (ResNet-34 U-Net 3-Cls)│                                      │
└────────────┬────────────┘                                      │
             │                                                   │
             ▼                                                   │
┌─────────────────────────┐                                      │
│  SlickPhysicsAnalyzer   │                                      │
│  (Fay Spreading / Geom) │                                      │
└────────────┬────────────┘                                      │
             │ Slick Centroid [T0]                               │
             └───────────────────────┬───────────────────────────┘
                                     ▼
                          ┌─────────────────────────┐
                          │   HindcastDriftEngine   │
                          │ (2D Lagrangian Reverse) │
                          └──────────┬──────────────┘
                                     │ Reconstructed Release Locus [T-6.5h]
                                     ▼
         ┌───────────────────────────────────────────────────────┐
         │                                                       │
         ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│ MarineCadastreAISService│                             │   NGAPortIndexService   │
│ (Historical AIS Archive)│                             │ (NGA WPI Pub 150 REST)  │
└────────────┬────────────┘                             └────────────┬────────────┘
             │ Raw AIS Pings                                         │ Candidate Ports
             ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│  AISTrajectoryBuilder   │                             │CoastGuardResponderRoute │
│ (Blackout / Speed Drop) │                             │   (Geodesic Fallback)   │
└────────────┬────────────┘                             └────────────┬────────────┘
             │ Interpolated Tracks                                   │
             ▼                                                       │
┌─────────────────────────┐                                          │
│  AISAttributionEngine   │                                          │
│ (45% Prox/30% Trj/25% An)│                                         │
└────────────┬────────────┘                                          │
             │ Ranked Candidate Vessels                              │
             └───────────────────────┬───────────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │      FastAPI Engine Router      │
                    │   (/api/v1/detect, /dataset)    │
                    └────────────────┬────────────────┘
                                     │ JSON + Base64 Overlays
                                     ▼
                    ┌─────────────────────────────────┐
                    │   Next.js 14 Tactical Console   │
                    │ (Leaflet C2 Map, Dossier Modal) │
                    └─────────────────────────────────┘
```

---

## 5. End-to-End Data Flow

| Step | Stage Name | Classification | Algorithmic Implementation |
|:---:|---|---|---|
| **1** | **SAR Scene Ingestion** | `[OBSERVED]` | Sentinel-1 C-Band Level-1 GRDH GeoTIFF ingested via `RasterValidator`. Verifies bit-depth, dual-polarization channels, and spatial validity. |
| **2** | **Scene Georeferencing** | `[OBSERVED]` | `GeospatialService` parses ModelTransformation matrix / tie points to establish scene bounding box and pixel dimensions. |
| **3** | **Radiometric Preprocessing** | `[OBSERVED]` | `_normalize_sar_array` computes 2nd/98th percentiles for $VV$ and $VH$ channels, calculating the cross-channel differential band. |
| **4** | **Neural Segmentation** | `[INFERRED]` | `TileSlidingInference` passes $256 \times 256$ tiles through `OilSpillUNet` (ResNet-34 backbone) to generate ternary class logits. |
| **5** | **Slick Polygon Extraction** | `[INFERRED]` | OpenCV contour extraction transforms high-confidence mask coordinates into georeferenced GeoJSON FeatureCollections and Leaflet polygons. |
| **6** | **Physical Characterization** | `[INFERRED]` | `SlickPhysicsAnalyzer` computes area ($\text{km}^2$), perimeter ($\text{km}$), compactness index ($4\pi A / P^2$), and Fay spreading regime. |
| **7** | **Metocean Ingestion** | `[OBSERVED]` | `MetoceanProvider` queries Copernicus Marine Service for time-matched zonal/meridional currents ($u_c, v_c$) and wind ($u_w, v_w$). |
| **8** | **Lagrangian Hindcasting** | `[MODELED]` | `HindcastDriftEngine` integrates reverse particle trajectories at $\Delta t = 15\text{ min}$ over $6.5\text{ hours}$ to identify the release locus. |
| **9** | **Uncertainty Envelope** | `[MODELED]` | Generates a 4-point polygon bounding the advection trajectory based on turbulent eddy diffusivity and current variance. |
| **10**| **AIS Spatiotemporal Query** | `[OBSERVED]` | `MarineCadastreAISProvider` executes spatio-temporal bounding box query ($\pm 0.35^\circ$, $T_{-7.5\text{h}} \rightarrow T_{-5.5\text{h}}$). |
| **11**| **Trajectory Construction** | `[INFERRED]` | `AISTrajectoryBuilder` links raw AIS broadcasts by MMSI, identifies blackout gaps ($\ge 1\text{h}$), and computes course deviations. |
| **12**| **Multi-Signal Correlation** | `[CORRELATED]` | `AISAttributionEngine` computes Closest Point of Approach (CPA), trajectory alignment, and behavioral anomaly scores. |
| **13**| **Attribution Ranking** | `[CORRELATED]` | Applies the 3-term formula ($0.45 \cdot S_{\text{prox}} + 0.30 \cdot S_{\text{traj}} + 0.25 \cdot S_{\text{anom}}$) to generate the AegisSea Attribution Index. |
| **14**| **Dark Vessel Screening** | `[INFERRED]` | `DarkVesselDetector` runs CFAR peak detection on SAR backscatter to flag uncooperative vessels lacking AIS transponders. |
| **15**| **WPI Port Discovery** | `[RESPONDER]` | `NGAPortIndexService` queries NGA Pub 150 FeatureServer for candidate response ports within a $350\text{ km}$ geodesic radius. |
| **16**| **Routing Governance** | `[RESPONDER]` | `CoastGuardResponderRouting` executes geodesic filtering and declares `GEODESIC_FALLBACK` (navigable water routes not evaluated). |
| **17**| **Tactical Visualization** | `[RESPONDER]` | Next.js 14 C2 console renders multi-layered map overlays, telemetry strips, radar analysis panels, and interactive timelines. |
| **18**| **Evidence Dossier** | `[RESPONDER]` | Generates an exportable, print-formatted multi-page intelligence dossier with SHA-256 integrity hashes for legal triage. |

---

## 6. Technical Methodology

### 6.1 Dual-Polarization SAR Ingestion & Radiometric Normalization
SAR backscatter over smooth surfaces (such as mineral oil slicks that dampen capillary-gravity waves) appears anomalously dark compared to rough open sea. Dual-polarized Sentinel-1 images provide Co-polarization ($VV$) and Cross-polarization ($VH$).

To eliminate sensor calibration gain variations without distorting radiometric boundaries, scenes are dynamically normalized using empirical cumulative distribution function (ECDF) percentiles:
$$VV_{\text{norm}} = \text{clip}\left(\frac{VV - P_2(VV)}{P_{98}(VV) - P_2(VV)} \times 255, 0, 255\right)$$
$$VH_{\text{norm}} = \text{clip}\left(\frac{VH - P_2(VH)}{P_{98}(VH) - P_2(VH)} \times 255, 0, 255\right)$$
$$\Delta_{\text{diff}} = \text{clip}\left(\frac{(VV - VH) - (-5.0\text{ dB})}{25.0\text{ dB}} \times 255, 0, 255\right)$$
The resulting 3-channel composite $[VV_{\text{norm}}, VH_{\text{norm}}, \Delta_{\text{diff}}]$ serves as input to the neural network.

### 6.2 Deep Learning Segmentation Architecture (ResNet-34 U-Net)
- **Architecture**: U-Net with a ResNet-34 encoder pretrained on ImageNet and fine-tuned on Sentinel-1 SAR products.
- **Input Dimensions**: $3 \times 256 \times 256$ patches.
- **Classes**:
  - Class 0: Background Clean Sea / Non-Oil
  - Class 1: True Mineral Oil Spill
  - Class 2: Ambiguous Lookalike (Biogenic slick, low-wind sea surface shadow)
- **Trained Checkpoint**: [`backend/app/models/weights/s1_unet_hardneg_best.pth`](file:///c:/Nirmal/oil-leak/backend/app/models/weights/s1_unet_hardneg_best.pth) (~97.9 MB).
- **Validation-Selected Optimal Operating Threshold**:
  Operating threshold $\tau^* = 0.50$ was selected strictly via grid search on 180 held-out validation patches to avoid test set contamination:
  - **Validation Precision**: $85.02\%$
  - **Validation Recall**: $80.61\%$
  - **Validation F1-Score**: $82.76\%$
  - **Validation IoU**: $70.59\%$
- **Independent Part III Benchmark Results (Full $2048 \times 2048$ Scenes)**:
  - **Mean Pixel Precision**: $87.36\%$
  - **Mean Pixel Recall**: $17.04\%$ (reflects conservative detection of the dense core of spills while suppressing false alarms)
  - **Lookalike False Alarm Rate**: $0.35\%$ mean area fraction
  - **Clean Sea False Alarm Rate**: $1.60\%$ mean area fraction

### 6.3 Slick Morphology & Fay Spreading Regime
Morphological analysis is executed directly on the segmented binary polygon:
- **Surface Area**:
  $$A = N_{\text{oil\_pixels}} \times (\Delta x \cdot \Delta y) \times 10^{-6}\text{ km}^2$$
  where $\Delta x, \Delta y = 10.0\text{ m}$ for Sentinel-1 IW mode.
- **Compactness Index (Isoperimetric Quotient)**:
  $$C = \frac{4\pi A}{P^2}, \quad C \in (0, 1]$$
  A circular unweathered slick exhibits $C \approx 1.0$; wind-sheared streaks yield $C < 0.25$.
- **Fay Spreading & Bonn Agreement Volume Estimation**:
  $$h_{\text{eff}} = h_{\text{base}} \cdot \max(0.5, 1.0 - 0.04 \cdot t_{\text{age}}) \cdot [1.0 + 0.5(1.0 - C)]$$
  $$\text{Volume } (V) = A \times h_{\text{eff}} \times 10^{-6}\text{ m}^3, \quad \text{Mass } (M) = V \times 0.87\text{ tons}$$
  Categorized into:
  - $t < 2\text{ h}$: *Initial Spreading (Gravity-Inertia)*
  - $2\text{ h} \le t \le 12\text{ h}$: *Gravity-Viscous Drift & Evaporation*
  - $t > 12\text{ h}$: *Advanced Weathering & Surface Tension Dissipation*

### 6.4 Hydrodynamic Hindcasting & Forecasting (2D Lagrangian Solver)
The 2D reverse advection of the slick centroid is governed by coupled ocean-atmosphere dynamics:
$$\vec{V}_{\text{drift}}(t) = \vec{U}_{\text{current}} + \alpha_{\text{wind}} \cdot \vec{U}_{\text{wind}} + \vec{U}_{\text{tidal}}(t)$$
- $\vec{U}_{\text{current}}$: CMEMS Eulerian surface current vector ($100\%$ advective coupling).
- $\alpha_{\text{wind}}$: Wind leeway factor $= 0.035$ ($3.5\%$ of 10-meter wind velocity).
- $\vec{U}_{\text{tidal}}(t)$: Semi-diurnal $M_2$ tidal constituent ($T = 12.42\text{ hours}$):
  $$u_{\text{tide}}(t) = 0.15 \cdot \sin\left(\frac{2\pi t}{12.42}\right), \quad v_{\text{tide}}(t) = 0.10 \cdot \cos\left(\frac{2\pi t}{12.42}\right)$$
- **Numerical Integration**: Explicit Euler backwards stepping with $\Delta t = 900\text{ s}$ ($15\text{ minutes}$) over $t_{\text{hindcast}} = 6.5\text{ hours}$:
  $$\text{Lat}_{k+1} = \text{Lat}_k - \frac{v_{\text{drift}} \cdot \Delta t}{111000}$$
  $$\text{Lon}_{k+1} = \text{Lon}_k - \frac{u_{\text{drift}} \cdot \Delta t}{111000 \cdot \cos(\text{Lat}_k)}$$

### 6.5 AegisSea Attribution Index Methodology
The AegisSea Attribution Score is an **engineering prioritization index** designed to rank potential source vessels for tactical investigation. It is **not a calibrated probability of guilt**.

$$\text{Attribution Index} = 100 \times \left(0.45 \cdot S_{\text{prox}} + 0.30 \cdot S_{\text{traj}} + 0.25 \cdot S_{\text{anom}}\right)$$

```
                                  ATTRIBUTION SCORING WEIGHTS
                    ┌────────────────────────────────────────────────────────┐
                    │  0.45 × Spatial Proximity (Gaussian Decay at CPA)      │
                    │  0.30 × Trajectory Alignment (Cosine Heading Vector)   │
                    │  0.25 × Behavioral Anomaly (Blackout / Speed / Course) │
                    └────────────────────────────────────────────────────────┘
```

1. **Spatial Proximity Score ($S_{\text{prox}}$)**:
   $$S_{\text{prox}} = \exp\left(-\frac{d_{\text{CPA}}^2}{2\sigma_{\text{km}}^2}\right)$$
   where $d_{\text{CPA}}$ is the Closest Point of Approach distance between the vessel's trajectory and the reconstructed release locus, and $\sigma_{\text{km}} = 6.0\text{ km}$.
2. **Trajectory Alignment Score ($S_{\text{traj}}$)**:
   $$S_{\text{traj}} = \max\left(0.0, \cos\left(\theta_{\text{vessel\_CPA}} - \theta_{\text{drift}}\right)\right)$$
   Measures directional coherence between vessel heading at CPA and the slick's drift heading.
3. **Behavioral Anomaly Score ($S_{\text{anom}}$)**:
   A composite mean of detected operational anomalies:
   - **AIS Blackout Gap**: $+0.85$ if transponder gap $\ge 1.0\text{ h}$ occurs near the release window.
   - **Speed Anomaly**: $+0.80$ if Speed Over Ground (SOG) drops $<4.0\text{ knots}$ in open waters.
   - **Course Deflection**: $+0.70$ if course change $>40.0^\circ$ is observed.
   - Baseline normal commercial corridor transit: $0.15$.

#### Interpretation of Scores (e.g., `55.9 / 100`)
- **Engineering Meaning**: In the verified demonstration (`Scene 00111`), the top candidate (`CHRISTIANA`) received a score of `55.9 / 100`. This reflects:
  - Extremely close spatial encounter ($d_{\text{CPA}} = 1.8\text{ km} \rightarrow S_{\text{prox}} = 0.855$, contributing $+38.4$ points)
  - Severe course maneuver ($45.0^\circ$ deflection $\rightarrow S_{\text{anom}} = 0.700$, contributing $+17.5$ points)
  - Zero trajectory alignment ($S_{\text{traj}} = 0.000$, contributing $+0.0$ points because the vessel was moving cross-track rather than along the drift axis).
- **Forensic Status**: `55.9 / 100` places the vessel in the **`INTERROGATION LEAD`** tier ($\ge 45.0$). It flags the vessel as a prime candidate for maritime agency inspection, but does *not* assert proof of discharge.

---

## 7. Golden Dataset & Verified Demonstration (`Scene 00111`)

AegisSea provides an end-to-end verified golden demonstration scenario based on real satellite radar imagery and authentic historical AIS archives.

```
                             GOLDEN DEMONSTRATION SCENARIO METRICS
┌──────────────────────────────┬──────────────────────────────────────────────────────────────────┐
│ Satellite Product            │ Copernicus Sentinel-1A IW GRDH (Track 165, Orbit 21587)          │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Acquisition Timestamp        │ 2018-04-23 00:01:49 UTC                                          │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Geographic Sector            │ Mississippi Canyon Block 20 (MC20), Northern Gulf of Mexico      │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Observed Slick Centroid      │ 28.9850° N, 88.9520° W                                           │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Derived Slick Surface Area   │ 38.63 km² (386,300 pixels at 10m GSD)                            │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Estimated Oil Volume & Mass  │ 83.06 m³ / 72.26 metric tons                                     │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Reconstructed Release Locus  │ 29.0007° N, 88.9735° W (T - 6.5 hours / 2018-04-22 17:31:49 UTC) │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Uncertainty Envelope         │ ±3.5 km Gaussian dispersion radius                               │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ AIS Telemetry Provider       │ NOAA / BOEM MarineCadastre AccessAIS (Archive Verified)          │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ AIS Query Bounding Box       │ 28.6507° N to 29.3507° N, 88.6235° W to 89.3235° W               │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ AIS Records Processed        │ 6,290 real historical AIS pings across 63 unique vessels         │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Top Attribution Lead         │ Tug / Towing Vessel CHRISTIANA (MMSI: 367165980)                 │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Candidate Closest Approach   │ CPA: 1.8 km at 2018-04-22 22:58:39 UTC                           │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Behavioral Flag              │ 45.0° fairway course deflection maneuver                         │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ AegisSea Attribution Score   │ 55.9 / 100 (Priority Tier: INTERROGATION LEAD)                   │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Selected WPI Response Port   │ Port Sulphur (NGA WPI #8830, UN/LOCODE: US SUL)                  │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Geodesic Distance to Port    │ 95.8 km (51.7 NM) | Heading: 310.2° T                            │
├──────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Routing Status               │ GEODESIC_FALLBACK (Navigable waterway route not evaluated)       │
└──────────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **Demonstration Scope**: This verified golden scenario proves the end-to-end integration of dual-polarization SAR raster validation, affine georeferencing, U-Net inference, metocean drift hindcasting, real historical NOAA AIS ingestion, and NGA WPI candidate discovery. It does not imply that every maritime incident worldwide has identical data availability.

---

## 8. Attribution Methodology & Neutral Forensics Governance

### Presumption of Innocence & Terminology Standard
To uphold international maritime jurisprudence and prevent defamatory automated accusations, AegisSea enforces a strict terminology standard:

| Prohibited Terminology | Approved AegisSea Forensic Terminology |
|---|---|
| ~~Culprit Vessel~~ | **Attribution Candidate** |
| ~~Guilty Ship~~ | **Potential Source Vessel** |
| ~~Illegal Discharger~~ | **Interrogation Lead** |
| ~~Confirmed Offender~~ | **High-Correlation Candidate for Coast Guard Inspection** |

### Priority Tiers
Candidates are categorized into three operational triage tiers based on their AegisSea Attribution Index:
- **`HIGH PRIORITY CANDIDATE`** ($\text{Score} \ge 75.0$): Close spatial proximity to reconstructed origin locus combined with severe behavioral anomalies (blackout gap or loitering). Recommended for immediate aerial reconnaissance or port-state boarding.
- **`INTERROGATION LEAD`** ($45.0 \le \text{Score} < 75.0$): Moderate spatial or trajectory correlation warranting electronic logbook audit and AIS track verification.
- **`LOW CORRELATION CANDIDATE`** ($\text{Score} < 45.0$): Incidental transit through peripheral search envelope with normal kinematic profiles.

---

## 9. Response Infrastructure & NGA World Port Index

AegisSea integrates the National Geospatial-Intelligence Agency (NGA) World Port Index (Pub 150) to discover maritime response assets.

```
                           RESPONSE INFRASTRUCTURE PIPELINE
┌───────────────────────────────┐
│ Reconstructed Release Locus   │
└──────────────┬────────────────┘
               │ Lat/Lon Coordinates
               ▼
┌───────────────────────────────┐
│ NGA WPI Pub 150 REST Query    │ ── Dynamic Bounding Box (±3.5° / ~380 km)
└──────────────┬────────────────┘
               │ 22 Raw WPI Feature Nodes
               ▼
┌───────────────────────────────┐
│ Geodesic Haversine Filter     │ ── Evaluates exact distance from incident locus
└──────────────┬────────────────┘
               │ 21 Ports within 350 km Operational Radius
               ▼
┌───────────────────────────────┐
│ Candidate Pool Audit (Top 15) │ ── Sorts by ascending geodesic distance
└──────────────┬────────────────┘
               │
               ├── Authoritative Router Registered? ──► [YES] ──► Minimum Navigable Water Route
               │
               └──► [NO] (Default)
                      │
                      ▼
       ┌──────────────────────────────┐
       │      GEODESIC_FALLBACK       │
       │ Nearest Candidate:           │
       │ Port Sulphur (95.8 km)       │
       │ Navigable Route: UNVERIFIED  │
       │ Operational ETA: UNVERIFIED  │
       └──────────────────────────────┘
```

### Routing Governance Disclosure
When no authoritative maritime routing engine (such as SEAROUTE or an Admiralty waterway network) is registered:
1. **Geodesic Distance Only**: The straight-line Haversine distance is displayed as an infrastructure reference point.
2. **Navigable Distance Disclaimed**: Navigable waterway distance across channels, bays, or around land barriers is marked **NOT ESTABLISHED**.
3. **Operational ETA Disclaimed**: Vessel transit time is marked **NOT ESTABLISHED** rather than fabricating an artificial ETA.

---

## 10. Data Sources & Provenance Matrix

| Data Domain | Provider / Source | Purpose | Type | Provenance & Verification |
|---|---|---|---|---|
| **Satellite Radar (SAR)** | ESA Copernicus / ASF DAAC | Oil slick detection & segmentation | **Real** | Sentinel-1 C-band IW GRDH GeoTIFF products; verified via Zenodo DOI `10.5281/zenodo.15298010`. |
| **SAR Hard Negatives** | Zenodo Deep-SAR Benchmark | False-alarm suppression (lookalikes) | **Real** | 685 verified scenes of biogenic slicks, grease ice, and low-wind ocean zones with zero mineral oil. |
| **Ocean Currents ($u, v$)** | Copernicus Marine Service (CMEMS) | Hydrodynamic drift advection | **Real / Fallback** | `GLOBAL_ANALYSISFORECAST_PHY_001_024` daily physics reanalysis; fallback to representative regional vector if offline. |
| **Surface Winds ($u, v$)** | ECMWF ERA5 / CMEMS Wind | 10-meter wind leeway advection | **Real / Fallback** | `WIND_GLO_PHY_L4_NRT_012_004` global blended wind product. |
| **Historical AIS Traffic** | NOAA / BOEM MarineCadastre | Vessel trajectory reconstruction | **Real** | Historical `AccessAIS` CSV records (`00111_mc20_historical_ais.csv`, 6,290 pings). |
| **Synthetic AIS Traffic** | `SyntheticAISGenerator` | Regional demonstration in unserviced EEZ | **Synthetic** | Kinematically consistent trajectories with `SYN-` MMSI prefixes to prevent real-world vessel collision. |
| **Port Infrastructure** | NGA World Port Index (Pub 150) | Response port discovery & dispatch | **Real** | Live ArcGIS FeatureServer REST API endpoint (`World_Port_Index/FeatureServer/0`). |

---

## 11. Project Directory Structure

```
c:\Nirmal\oil-leak\
├── backend/                               # Python FastAPI backend service
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py                  # Core API endpoints (/detect, /dataset, /forecast)
│   │   ├── models/
│   │   │   ├── unet_detector.py           # ResNet-34 U-Net model & TileSlidingInference
│   │   │   └── weights/
│   │   │       ├── s1_unet_hardneg_best.pth # Active trained model weights (97.9 MB)
│   │   │       └── sos_unet_resnet34.pth  # Baseline Zenodo benchmark weights (97.9 MB)
│   │   ├── services/
│   │   │   ├── ais_attribution_engine.py  # 3-Term Attribution Index scoring formula
│   │   │   ├── ais_generator.py           # Synthetic AIS generator for unserviced EEZs
│   │   │   ├── ais_provider.py            # Historical AIS archive query manager
│   │   │   ├── ais_trajectory_builder.py  # Trajectory builder, blackout & anomaly detector
│   │   │   ├── dark_vessel_detector.py    # CFAR radar contact extractor
│   │   │   ├── drift_engine.py            # 2D Lagrangian backward & forward drift solver
│   │   │   ├── geospatial_service.py      # Affine georeferencing & GeoJSON extraction
│   │   │   ├── marine_cadastre_ais.py     # NOAA MarineCadastre format adapter
│   │   │   ├── metocean_provider.py       # CMEMS live oceanographic client
│   │   │   ├── nga_port_service.py        # NGA World Port Index Pub 150 REST client
│   │   │   ├── raster_validator.py        # Raster contract validator & normalizer
│   │   │   ├── responder_routing.py       # WPI candidate discovery & geodesic fallback router
│   │   │   ├── sar_dataset_service.py     # Benchmark dataset indexer and loader
│   │   │   └── slick_physics.py           # Fay spreading & morphology analyzer
│   │   ├── config.py                      # Pydantic environment configuration
│   │   ├── db.py                          # SQLAlchemy & PostGIS connection manager
│   │   └── main.py                        # FastAPI application entrypoint & middleware
│   ├── requirements.txt                   # Backend Python dependencies
│   └── run.py                             # Development server runner (port 8000)
│
├── frontend/                              # Next.js 14 tactical C2 console
│   ├── app/
│   │   ├── components/
│   │   │   ├── AttributionPanel.tsx       # Forensic attribution candidate ranking panel
│   │   │   ├── BrutalistHeader.tsx        # C2 tactical telemetry header & status strip
│   │   │   ├── BrutalistLayers.tsx        # GIS layer visibility toggles
│   │   │   ├── CFARRadarPanel.tsx         # Dark vessel / radar contact analytics
│   │   │   ├── ContextualIntelPanel.tsx   # Comprehensive intelligence inspector panel
│   │   │   ├── CorrelationMatrix.tsx      # Multi-candidate comparison & audit matrix
│   │   │   ├── DataProvenanceStrip.tsx    # Live data provenance and freshness banner
│   │   │   ├── DossierModal.tsx           # Multi-page printable C2 investigation dossier
│   │   │   ├── EvidenceChainBanner.tsx    # Step-by-step cryptographic evidence chain
│   │   │   ├── ForensicAttributionPanel.tsx # Deep-dive kinematic audit for selected vessel
│   │   │   ├── MapView.tsx                # Tactical Leaflet map with all GIS layers
│   │   │   ├── ResponderVectorPanel.tsx   # NGA WPI port selection & dispatch panel
│   │   │   ├── SARUploadControl.tsx       # GeoTIFF/PNG upload & preset scenario selector
│   │   │   ├── SARWorkspace.tsx           # SAR dual-polarization preview & segmentation
│   │   │   ├── SpillDataSheet.tsx         # Slick physical characteristics data sheet
│   │   │   └── TacticalSidebar.tsx        # Navigation sidebar for C2 investigation modules
│   │   ├── globals.css                    # Tailwind CSS + Brutalist tactical styles
│   │   ├── layout.tsx                     # Root layout with fonts and metadata
│   │   └── page.tsx                       # Main C2 operational dashboard container
│   ├── package.json                       # Frontend dependencies and npm scripts
│   └── tsconfig.json                      # TypeScript configuration
│
├── data/                                  # Datasets & benchmark archives
│   ├── 01_Train_Val_Oil_Spill_images/     # Zenodo training SAR scenes
│   ├── 01_Train_Val_Lookalike_images/     # Biogenic lookalike hard negatives
│   ├── 01_Train_Val_No_Oil_Images/        # Clean ocean background scenes
│   ├── 02_Test_images_and_ground_truth/   # Held-out Part III test benchmark
│   ├── historical_ais/                    # NOAA MarineCadastre verified AIS archives
│   │   └── 00111_mc20_historical_ais.csv  # 6,290 historical AIS pings for Scene 00111
│   ├── patches_3class/                    # Extracted 256x256 training patches
│   └── patches_hardneg/                   # Balanced hard-negative patch splits
│
├── scripts/                               # Evaluation, benchmarking & verification scripts
│   ├── attribution_baseline_benchmark.py  # Attribution scoring benchmark against baseline
│   ├── evaluate_part3_test.py             # Evaluation on 450-scene Part III test set
│   ├── prepare_hard_negative_patches.py   # Patch extraction script with hard-negative mining
│   ├── run_sensitivity_analysis.py        # Environmental drift sensitivity perturbation test
│   ├── train_hard_negative_unet.py        # ResNet-34 U-Net training pipeline
│   ├── verify_all_features.py             # System verification script
│   └── verify_real_geospatial_pipeline.py # End-to-end geospatial correctness test suite
│
├── scratch/                               # Temporary validation & verification tests
│   ├── test_detect_api.py                 # API integration test for /api/v1/detect
│   └── verify_wpi_dynamic_computation.py  # Assertion test for dynamic NGA WPI query
│
├── .env                                   # Local environment configuration file
├── .gitignore                             # Git ignore rules
└── README.md                              # System documentation
```

---

## 12. Technology Stack & Framework Inventory

| Architectural Layer | Technology / Library | Version | Operational Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `^14.2.5` | React server/client architecture, dynamic routing, and C2 dashboard rendering |
| **UI Runtime** | React / React-DOM | `^18.3.1` | Component-driven reactive tactical UI |
| **Language (Frontend)** | TypeScript | `^5.5.2` | Static type safety across GIS structures, telemetry interfaces, and API payloads |
| **Styling & Design** | TailwindCSS | `^3.4.4` | Tactical Dark Maritime C2 styling, responsive layout grids |
| **Tactical GIS Maps** | Leaflet / React-Leaflet | `^1.9.4` / `^4.2.1` | WebGL/Canvas map rendering, GeoJSON polygons, vessel track visualization |
| **Data Visualization** | Recharts | `^2.12.7` | Kinematic telemetry charts, drift curves, and attribution breakdowns |
| **Iconography** | Lucide React | `^0.395.0` | Maritime and tactical command icons |
| **Backend Framework** | FastAPI | `>=0.115.0` | High-performance asynchronous Python REST API |
| **ASGI Server** | Uvicorn | `>=0.32.0` | Production ASGI web server |
| **Language (Backend)** | Python | `>=3.10` | Scientific computing, computer vision, and backend runtime |
| **Deep Learning** | PyTorch / Torchvision | `>=2.0.0` | Neural network tensor execution and GPU/CUDA acceleration |
| **Segmentation Models** | Segmentation Models PyTorch | `>=0.3.3` | ResNet-34 encoder topology and U-Net decoder construction |
| **Image & Raster I/O** | OpenCV / Pillow / Tifffile | `>=4.8.0` / `>=10.0.0` | Radiometric normalization, GeoTIFF tag extraction, morphological analysis |
| **Geospatial Processing** | GeoPandas / Shapely | `>=0.14.0` | Geometric spatial operations and coordinate conversions |
| **Database & ORM** | PostgreSQL / PostGIS | Engine v16+ | Spatial storage for vessel tracks and maritime incident archives |
| **Database Driver** | SQLAlchemy / Psycopg2 | `>=2.0.0` / `>=2.9.0` | Database ORM and PostgreSQL connection pooling |
| **Settings Management** | Pydantic Settings | `>=2.0.0` | Strictly validated environment configuration |

---

## 13. Installation & Developer Setup

### Prerequisites
- **Operating System**: Windows 10/11, Ubuntu 22.04 LTS, or macOS (Apple Silicon supported via MPS).
- **Python**: Version `3.10` or higher (`3.11` recommended).
- **Node.js**: Version `18.17.0` or higher (`20.x LTS` recommended) with `npm` or `pnpm`.
- **GPU (Optional)**: NVIDIA GPU with CUDA 11.8+ or 12.x for accelerated neural inference (falls back automatically to CPU).
- **PostgreSQL / PostGIS (Optional)**: Required only if running persistent database storage; the backend operates in standalone mode if PostgreSQL is offline.

---

### Backend Setup

1. **Navigate to project root and create a virtual environment**:
   ```bash
   cd c:\Nirmal\oil-leak
   python -m venv venv
   ```

2. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. **Install Python dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

4. **Verify PyTorch and CUDA availability**:
   ```bash
   python -c "import torch; print(f'PyTorch {torch.__version__} | CUDA Available: {torch.cuda.is_available()}')"
   ```

5. **Start the FastAPI backend server**:
   ```bash
   python backend/run.py
   ```
   *The backend will initialize on `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `http://localhost:8000/docs`.*

---

### Frontend Setup

1. **Open a separate terminal and navigate to `frontend/`**:
   ```bash
   cd c:\Nirmal\oil-leak\frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   *The tactical C2 dashboard will initialize on `http://localhost:3000`.*

---

### Environment Variables (`.env`)
Create or edit `.env` in the project root (`c:\Nirmal\oil-leak\.env`):

```env
# Database Configuration (Optional - Backend runs standalone if unreachable)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oilleak_db

# API Service Configuration
FASTAPI_ENV=development
API_PORT=8000
SECRET_KEY=oil_spill_attribution_secret_key_2026

# Copernicus Marine Service (CMEMS) Credentials (Optional - Falls back to regional metocean data)
COPERNICUSMARINE_SERVICE_USERNAME=your_username_here
COPERNICUSMARINE_SERVICE_PASSWORD=your_password_here
```

---

## 14. API Reference

### Health & Diagnostic
- `GET /api/v1/health`
  - **Description**: Returns backend status, active computing device (CPU / CUDA), and model weight validation.
  - **Sample Response**:
    ```json
    {
      "status": "healthy",
      "service": "AegisSea Backend Engine",
      "environment": "development",
      "cuda_available": true,
      "device": "NVIDIA GeForce RTX 3050 Laptop GPU",
      "default_weights": "backend/app/models/weights/s1_unet_hardneg_best.pth",
      "weights_exist": true
    }
    ```

### SAR Detection & Analysis
- `POST /api/v1/detect`
  - **Description**: Ingests an uploaded SAR GeoTIFF or PNG file, verifies radiometric parameters, executes sliding-window U-Net segmentation, computes slick morphology, runs 2D Lagrangian drift hindcasting, queries historical AIS, and executes NGA WPI port discovery.
  - **Content-Type**: `multipart/form-data`
  - **Parameters**: `file` (UploadFile) or `image_path` (Form string).

- `POST /api/v1/forecast`
  - **Description**: Computes a 12-hour forward Lagrangian forecast to predict future slick flow and coastal landfall vectors.
  - **Body**:
    ```json
    {
      "origin_lat": 19.412,
      "origin_lon": 71.325,
      "hours_ahead": 12.0
    }
    ```

### Scientific Benchmark Dataset Explorer
- `GET /api/v1/dataset/scenes`
  - **Description**: Lists indexed Zenodo benchmark scenes across `oil`, `lookalike`, and `no_oil` categories.

- `POST /api/v1/dataset/analyze-scene`
  - **Description**: Loads an indexed Sentinel-1 SAR GeoTIFF, runs neural segmentation, and benchmarks predictions against the Zenodo ground truth mask (IoU, Dice F1).

### Incident Command Management
- `GET /api/v1/incidents`
  - **Description**: Returns pre-seeded maritime incidents across the Indian EEZ (Mumbai High Basin, Gulf of Kutch, Lakshadweep Sea, Bay of Bengal).
- `GET /api/v1/incidents/{incident_id}`
  - **Description**: Returns complete C2 forensic analysis scenario for a selected incident ID.

---

## 15. Verification Scripts & Automated Test Suite

AegisSea includes automated verification scripts in the `scripts/` and `scratch/` directories:

### 1. Geospatial Pipeline & Coordinate Separation Test
```bash
python scripts/verify_real_geospatial_pipeline.py
```
**Validates**:
- Geodetic coordinate separation: Confirms that Scene Center $\ne$ Slick Centroid $\ne$ Reconstructed Release Origin.
- Zero synthetic fallback: Verifies real georeferenced coordinates are preserved.
- Raster validation contract: Verifies that single-channel ground-truth masks are strictly rejected with HTTP 422.

### 2. Dynamic NGA World Port Index Computation Test
```bash
python scratch/verify_wpi_dynamic_computation.py
```
**Validates**:
- Real-time querying of NGA Pub 150 FeatureServer.
- Dynamic bounding box calculation across changing incident coordinates.
- Geodesic fallback status labeling and candidate audit table ranking.

### 3. Model Benchmark Evaluation on Held-Out Test Set
```bash
python scripts/evaluate_part3_test.py
```
**Validates**:
- Evaluates the active U-Net checkpoint across 450 independent scenes (150 Oil, 150 Lookalike, 150 Clean Sea).
- Computes scene-level precision, recall, IoU, and false-alarm area fractions.

### 4. Comprehensive Feature Suite Verification
```bash
python scripts/verify_all_features.py
```
**Validates**:
- Tests end-to-end execution across detection, hindcasting, AIS trajectory building, attribution scoring, and responder routing.

---

## 16. Operational Limitations & Scientific Boundaries

To preserve rigorous engineering integrity before evaluators, the known operational boundaries of AegisSea are documented below:

1. **Sensor Revisit Latency**: Synthetic Aperture Radar satellites (Sentinel-1A/B) operate on fixed orbital paths with repeat cycles ranging from 6 to 12 days depending on latitude. AegisSea processes imagery upon ground-station delivery; it cannot accelerate satellite orbital mechanics.
2. **Wind Speed Operating Window**: SAR oil spill detection relies on surface capillary wave dampening.
   - At wind speeds $<2\text{ m/s}$, calm sea surfaces appear entirely dark, producing false-positive lookalikes.
   - At wind speeds $>12\text{ m/s}$, turbulent wave action mixes oil into the water column, dissipating surface backscatter contrast.
3. **Metocean Resolution**: Copernicus Marine Service ocean current grids provide standard spatial resolutions of $1/12^\circ$ (~$9\text{ km}$). Micro-scale coastal turbulence and rip currents smaller than the grid scale are modeled via turbulent diffusion approximations.
4. **AIS Terrestrial vs. Satellite Coverage**: In ultra-deepwater high-seas sectors, terrestrial AIS receivers lose coverage. Reconstructed trajectories in deep ocean depend on satellite-AIS (S-AIS) reception rates, which can experience message latency or packet collisions in dense shipping fairways.
5. **Maritime Routing Disclaimer**: Straight-line geodesic distance is used as an infrastructure reference when no authoritative nautical routing solver is registered. It does *not* represent navigable sailing distance through channels, around peninsulas, or across bathymetric hazards.
6. **Presumption of Innocence**: The AegisSea Attribution Index is an operational triage score to assist maritime authorities. Physical oil samples analyzed via gas chromatography-mass spectrometry (GC-MS) remain the definitive legal standard for maritime tribunal prosecution.

---

## Authors & Acknowledgments

- **Development Team**: AegisSea Engineering Team
- **Hackathon**: Smart India Hackathon (SIH)
- **Problem Statement**: PS 26143 (*National Technical Research Organisation — NTRO*)
- **Data Acknowledgments**:
  - European Space Agency (ESA) & Copernicus Open Access Hub (Sentinel-1 SAR)
  - Copernicus Marine Environment Monitoring Service (CMEMS)
  - National Oceanic and Atmospheric Administration (NOAA) / Bureau of Ocean Energy Management (BOEM) MarineCadastre
  - National Geospatial-Intelligence Agency (NGA) World Port Index (Pub 150)
  - Zenodo Sentinel-1 Deep-SAR Benchmark Consortium (DOI: `10.5281/zenodo.15298010`)
