# Dataset & Data Pipeline Guide
### SIH PS 26143 — Data acquisition, structure, and usage strategy

---

## 1. Datasets in scope

### 1.1 Sentinel-1 SAR Oil Spill Dataset (Zenodo) — primary detection data

| Part | DOI | Contents | Size | Role in this project |
|---|---|---|---|---|
| Refined Deep-SAR Oil Spill (SOS) | 10.5281/zenodo.15298010 | Cleaned images + masks, corrected annotation errors | 1.2 GB | **Start here** — wire up the pipeline fast |
| Part I | 10.5281/zenodo.8346860 | 1,200 oil-spill train/val images + masks, Sigma0 dB, VV+VH, 2048×2048×2, TIFF | 40.7 GB | **Main training set** |
| Part II | 10.5281/zenodo.8253899 | 685 No-Oil + 685 Lookalike train/val images + masks | 45.9 GB | Add only if time remains (robustness boost) |
| Part III | 10.5281/zenodo.13761290 | 150 Oil + 150 No-Oil + 150 Lookalike test images + masks | 9.9 GB | **Held-out test set — do not train/validate on this** |

**License:** CC-BY 4.0 on all four (attribution required, redistribution/reuse permitted).

**Important framing correction:** Part III is a test set, not a substitute for real training data — 150 images per class is enough to wire up and sanity-check the pipeline, not to train a model on. Part I is the real training data.

### 1.2 AIS data

- **Reference/format source:** [marinecadastre.gov/accessais](https://marinecadastre.gov/accessais/) — real US AIS sample data, used to confirm field structure (MMSI, timestamp, lat/lon, course, speed, heading, nav status, vessel type, IMO number).
- **Note:** the real-time AOI ordering service has intermittent availability issues; bulk historical downloads remain the more reliable path.
- **For the Indian-waters demo:** no equivalent open AIS source exists for India — a **synthetic AIS generator** is used to construct a plausible vessel-traffic scenario around the chosen demo coastline and time window, clearly labeled as synthetic in the submission.

### 1.3 (Roadmap) Additional data sources not yet integrated

- Rig/pipeline positions: OSM offshore-infrastructure layer (open fallback; ONGC platform data likely gated) — for F9 infra-proximity check.
- SAR ship-detection training data: SSDD (SAR Ship Detection Dataset) — for F8 dark-vessel flagging.
- Responder-asset positions: synthetic fleet (real Coast Guard positions likely inaccessible) — for F13.

---

## 2. Fetch tooling

A working downloader/verifier/extractor script (`fetch_oil_spill_datasets.py`) handles all four Zenodo dataset parts:

```bash
pip install requests tqdm py7zr

python fetch_oil_spill_datasets.py --list                # see all sets
python fetch_oil_spill_datasets.py --set sos_refined      # 1.2 GB, start here
python fetch_oil_spill_datasets.py --set part3            # 9.9 GB, test set
python fetch_oil_spill_datasets.py --set part1            # 40.7 GB, main training set
python fetch_oil_spill_datasets.py --set part2            # 45.9 GB, no-oil + lookalike
python fetch_oil_spill_datasets.py --set part1 --no-extract   # download only
python fetch_oil_spill_datasets.py --set all --out ./data
```

Features: resumable downloads (HTTP Range), MD5 verification against Zenodo's published checksums before extraction, automatic `.7z`/`.zip` extraction via `py7zr`.

**Disk space needed:** ~90 GB free if downloading Part I + Part II fully, plus roughly the same again post-extraction. Given the 4-day solo scope, Part II is deferred — budget accordingly.

---

## 3. Train / validation / test strategy

- **Training + validation split:** 85/15, drawn only from **Part I** (and Part II's No-Oil/Lookalike folders, if added later).
- **Test set:** **Part III**, left completely untouched during training/validation — it's already labeled as the held-out test set by the dataset's own creators; don't leak it into training.
- **Class structure:** single 3-class U-Net (oil / lookalike / no-oil) rather than a separate segmentation model plus a separate look-alike classifier — see `02_Tech_Stack_and_Decisions.md` §2.3 for the reasoning.
- **Precision/recall reporting:** don't pre-commit to a target number before training — report whatever the held-out Part III class genuinely gives you. Beat the naive "predict no-oil everywhere" baseline (~98% accuracy trap given the 2% pixel imbalance) and report the real number honestly.

---

## 4. Training tile strategy

- **Training tile size:** 256×256, tiled from the 2048×2048×2 originals (see `02_Tech_Stack_and_Decisions.md` §2.2 for the full reasoning: data efficiency, local class imbalance, and GPU memory all point the same direction here).
- **Inference:** run the 256-trained model over full 2048×2048 scenes via a sliding window (50% overlap), averaging overlapping predictions to stitch a full-resolution mask — training tile size does not limit demo-time output resolution.
- **Stretch experiment (only if time allows):** mixed-precision training (`torch.cuda.amp`) to test whether 512×512 tiles with a larger batch size outperform 256×256 — compare validation IoU empirically rather than assuming.

---

## 5. Demo scenario data (decision still open — flagged in build roadmap)

Two choices still need to be locked before data prep can be finalized:
1. **Which specific real Zenodo scene** becomes the live-demo case study.
2. **Which Indian coastline** the synthetic AIS/infra scenario is staged around.

Once locked, this document should be updated with the specific scene ID and coastline, since it determines exactly which synthetic AIS data and infra-proximity layer get built.
