# Tech Stack & Architecture Decisions
### MARITRACE-class project — SIH PS 26143 (working name pending)

This document is the "why" behind every stack choice — use it when a teammate joins later and asks "why this and not X," or when you need to re-justify a decision to yourself mid-build.

---

## 1. Full stack by component

| Layer | Choice | Status |
|---|---|---|
| Frontend framework | **Next.js** (App Router) | Locked |
| Map layer | **react-leaflet** + OpenStreetMap tiles | Locked |
| Charts | **Recharts** | Locked |
| State management | Built-in React state/context | Locked |
| Frontend hosting | **Vercel** (free tier) | Locked |
| Backend framework | **FastAPI** (Python), separate service from Next.js | Locked |
| Long-running job handling | FastAPI `BackgroundTasks` + simple polling | Locked |
| Backend hosting | **Oracle Cloud ARM VM** (2 OCPU / 12GB RAM, existing free-tier instance) | Locked |
| Detection framework | **PyTorch** | Locked |
| Detection architecture | **U-Net**, ResNet34 encoder (ImageNet-pretrained), via `segmentation-models-pytorch` | Locked |
| Detection classes | 3-class: oil / lookalike / no-oil (single model, not two) | Locked |
| Training tile size | **256×256** patches, tiled from 2048×2048 originals | Locked |
| Loss function | Focal / class-weighted loss | Locked |
| Geo-processing (imagery) | **rasterio** | Locked |
| Image processing | **OpenCV** | Locked |
| Drift/hindcast engine | **OpenDrift / OpenOil** | Locked |
| Ocean currents data | **Copernicus Marine Service** (free) | Locked |
| Wind data | **GFS** (NOAA, free) | Locked |
| AIS processing | **GeoPandas** | Locked |
| Database | **PostgreSQL + PostGIS**, running locally | Locked |
| DB access layer | `SQLAlchemy` + `GeoAlchemy2` | Locked |
| Future DB (post team-join) | **Neon** (serverless Postgres, same engine) | Planned, not yet set up |
| Training hardware | **RTX 3050 (6GB VRAM)** | Existing hardware |
| Version control structure | Monorepo: `/frontend`, `/backend`, `/data` (gitignored), `/docs` | Locked |

---

## 2. Decisions with real reasoning behind them (not just picks)

### 2.1 Why PostgreSQL + PostGIS, not SQLite+SpatiaLite or Neon (for now)

- **The core need:** spatial join queries — "find every AIS point inside this origin-window polygon" — require indexed geometry (R-tree), not a plain column filter. This is why *some* spatial database is non-negotiable, not optional infrastructure.
- **SQLite+SpatiaLite** was the original "zero setup" pick, but it creates migration risk: SpatiaLite and PostGIS overlap but aren't identical in function names/behavior, so moving to Postgres later (when the team joins) would mean rewriting spatial queries under time pressure.
- **Neon** (serverless Postgres) is the better choice *once a team is sharing the data concurrently* — but solo, it adds a network dependency and one more account to configure for no real benefit right now.
- **Local PostgreSQL + PostGIS** gets the real engine (same SQL, same functions Neon uses) with zero network latency during solo development. Moving to Neon later is just a connection-string swap — no rewrite.

### 2.2 Why 256×256 training tiles, not larger

Three real reasons, not just the GPU memory ceiling:
1. **Data efficiency**: tiling is also augmentation. 256×256 crops from a 2048×2048 image yield far more distinct training examples than 512×512 crops — this matters because Part I is only 1200 images (dataset gap G1), so effective dataset size matters more than usual.
2. **Local class imbalance**: a slick already occupies ~2% of pixels dataset-wide; tiling too large makes that imbalance *worse* inside each individual training tile (a tiny oil patch lost in a huge background crop), not better.
3. **Diminishing returns**: most slicks in this dataset are smaller than the full scene — 256×256 already captures full slick shape and boundary character for the majority of cases. Bigger tiles buy context mainly for rare very-large spills, at a real cost in the two points above.
4. **Memory ceiling** (the obvious one too): 512×512 forces batch size down to 1-4 on a 6GB card, which destabilizes BatchNorm statistics inside the U-Net encoder.
- **Training tile size ≠ inference tile size**: at inference (demo time), a 256-trained model can run over the full 2048×2048 image via a sliding window (50% overlap, averaged predictions) — training small does not mean choppy full-resolution output later.
- If time allows, mixed-precision training (`torch.cuda.amp`) is the one lever that could justify testing 512×512 later — worth an empirical comparison (train briefly at both, compare validation IoU) rather than assuming bigger is better.

### 2.3 Why merge look-alike discrimination into the segmentation model (collapsing F1+F2)

Originally designed as a segmentation model (F1) + separate secondary look-alike classifier (F2). For the solo 4-day build, this collapses into **one 3-class U-Net** (oil / lookalike / no-oil) trained on Part I + Part III's lookalike/no-oil folders together. This solves the core of F2 (distinguishing lookalikes from real oil) without training a second model. The richer multi-signal cross-checks (wind field, ocean-color, climatology overlay, multi-temporal persistence) remain designed roadmap items — they're rule-based cross-referencing layers on top of the model's output, not additional trained models.

### 2.4 What is and isn't an ML model (keep this straight for the pitch)

**Actually trained/learned:**
- Oil spill + lookalike segmentation (U-Net, ResNet34)
- (Roadmap) SAR ship detection for dark-vessel flagging — separate object-detection model (YOLO variant or Faster R-CNN on SSDD dataset)
- (Roadmap) AIS behavioral anomaly scoring — optionally Isolation Forest on speed/course/gap features

**NOT ML — physics or rule-based, don't call these "AI models" in the pitch:**
- Drift hindcast/forecast (F4/F5) — OpenDrift is a physics simulation (Lagrangian particle tracking), no training involved
- Age/geometric characterization (F3) — OpenCV shape metrics + Fay's spreading theory heuristic
- Attribution scoring (F9) — a weighted formula (proximity + trajectory + anomaly score), not a trained model, unless weights are deliberately learned later
- Response coordination (F13) — routing/distance math

### 2.5 Why Next.js does NOT host any backend logic

Next.js can technically run API routes, but the hard rule for this project: **Next.js is UI + orchestration only.** FastAPI owns everything numerical (PyTorch, OpenDrift, GeoPandas). Mixing ML/geospatial code into Next.js API routes creates painful rewrites if this scales past the demo, and Python's ecosystem is non-negotiable for the ML/scientific stack anyway.

### 2.6 Evidence dossier format

HTML page rendered inside Next.js, exported via browser "print to PDF." Avoids standing up a separate PDF-generation backend dependency for a feature that's roadmap-tier anyway.

---

## 3. Deferred / roadmap-only technical decisions (not needed for the 4-day build)

- AIS trust scoring implementation details (F7)
- Dark-vessel/SAR ship-detection model selection and training (F8)
- Infra-proximity data source finalization — ONGC platform data vs. OSM offshore-infrastructure layer (F9)
- Synthetic benchmark generator implementation (F12)
- Response coordination / responder-asset data source (F13)
- Monte Carlo ensemble drift runs (upgrade from single deterministic run)
- Migration to Neon once team forms
