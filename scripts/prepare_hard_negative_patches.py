#!/usr/bin/env python3
"""
prepare_hard_negative_patches.py

Extracts 900 balanced 256x256 patches for 2-Class Sentinel-1 U-Net Training
with Hard Negative Lookalike Mining (Option 1 - Official Published Benchmark Protocol):

- 400 Positive Patches from Part I (Oil Spill):
  - 50% Centroid-Focused (dense slick morphology)
  - 50% Boundary-Jittered (partial-slick framing & edge context)
- 300 Hard Negative Patches from Part II (Lookalike):
  - Sampled from natural dark damping regions in lookalike scenes (mask = 0)
- 200 Clean Ocean Patches from Part II (No-Oil):
  - Uniform sea background (mask = 0)

Outputs binary masks: 0 = Background / No-Oil, 1 = Oil Spill.
Split: 80% Train (720 patches) / 20% Val (180 patches).
"""

import os
import random
from pathlib import Path
import numpy as np
import tifffile
import imagecodecs
from tqdm import tqdm

DATA_DIR = Path("data")
OUT_DIR = DATA_DIR / "patches_hardneg"

CROP_SIZE = 256
SEED = 42

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)

def normalize_sar(arr: np.ndarray) -> np.ndarray:
    if arr.ndim == 3 and arr.shape[-1] >= 2:
        vv = arr[:, :, 0]
        vh = arr[:, :, 1]
        p2_vv, p98_vv = np.percentile(vv, 2), np.percentile(vv, 98)
        p2_vh, p98_vh = np.percentile(vh, 2), np.percentile(vh, 98)
        vv_norm = np.clip((vv - p2_vv) / max(p98_vv - p2_vv, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        vh_norm = np.clip((vh - p2_vh) / max(p98_vh - p2_vh, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        diff = np.clip(((vv - vh) - (-5.0)) / 25.0 * 255.0, 0, 255).astype(np.uint8)
        return np.stack([vv_norm, vh_norm, diff], axis=-1)
    elif arr.ndim == 2:
        p2, p98 = np.percentile(arr, 2), np.percentile(arr, 98)
        norm = np.clip((arr - p2) / max(p98 - p2, 1e-4) * 255.0, 0, 255).astype(np.uint8)
        return np.stack([norm, norm, norm], axis=-1)
    else:
        norm = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-6) * 255.0).astype(np.uint8)
        return norm

def extract_oil_crops(img_path: Path, mask_path: Path, num_crops: int = 2):
    try:
        raw_img = tifffile.imread(str(img_path))
        img_rgb = normalize_sar(raw_img)
        raw_mask = tifffile.imread(str(mask_path))
        binary_mask = (raw_mask > 0).astype(np.uint8)

        H, W = img_rgb.shape[:2]
        y_indices, x_indices = np.where(binary_mask == 1)
        if len(y_indices) < 20:
            return []

        cy = int(np.mean(y_indices))
        cx = int(np.mean(x_indices))
        crops = []

        for i in range(num_crops):
            if i % 2 == 0:
                # 50% Centroid-Focused
                top = max(0, min(H - CROP_SIZE, cy - CROP_SIZE // 2))
                left = max(0, min(W - CROP_SIZE, cx - CROP_SIZE // 2))
            else:
                # 50% Boundary-Jittered
                offset_y = random.randint(-110, 110)
                offset_x = random.randint(-110, 110)
                top = max(0, min(H - CROP_SIZE, cy - CROP_SIZE // 2 + offset_y))
                left = max(0, min(W - CROP_SIZE, cx - CROP_SIZE // 2 + offset_x))

            c_img = img_rgb[top:top+CROP_SIZE, left:left+CROP_SIZE]
            c_mask = binary_mask[top:top+CROP_SIZE, left:left+CROP_SIZE]
            if np.sum(c_mask) > 10:  # must contain at least some oil pixels
                crops.append((c_img, c_mask, "oil"))

        return crops
    except Exception:
        return []

def extract_negative_crops(img_path: Path, tag: str, num_crops: int = 2):
    try:
        raw_img = tifffile.imread(str(img_path))
        img_rgb = normalize_sar(raw_img)
        H, W = img_rgb.shape[:2]
        crops = []

        for _ in range(num_crops):
            top = random.randint(0, H - CROP_SIZE)
            left = random.randint(0, W - CROP_SIZE)
            c_img = img_rgb[top:top+CROP_SIZE, left:left+CROP_SIZE]
            c_mask = np.zeros((CROP_SIZE, CROP_SIZE), dtype=np.uint8)
            crops.append((c_img, c_mask, tag))

        return crops
    except Exception:
        return []

def main():
    set_seed(SEED)
    print("=" * 75)
    print("  AEGIS-SEA: HARD NEGATIVE LOOKALIKE PATCH EXTRACTION (OPTION 1)")
    print("  Target: 400 Oil (Positives) + 300 Lookalike (Hard Negatives) + 200 Clean Ocean")
    print("=" * 75)

    for split in ["train", "val"]:
        (OUT_DIR / split).mkdir(parents=True, exist_ok=True)

    all_patches = []

    # 1. Oil Spills (Positives)
    oil_img_dir = DATA_DIR / "01_Train_Val_Oil_Spill_images" / "Oil"
    oil_mask_dir = DATA_DIR / "01_Train_Val_Oil_Spill_mask" / "Mask_oil"
    oil_files = sorted(list(oil_img_dir.glob("*.tif")))
    random.shuffle(oil_files)

    oil_patches = []
    pbar = tqdm(total=400, desc="Extracting Oil Positives")
    for f in oil_files:
        mf = oil_mask_dir / f.name
        if not mf.exists():
            continue
        crops = extract_oil_crops(f, mf, num_crops=2)
        for c in crops:
            oil_patches.append(c)
            pbar.update(1)
            if len(oil_patches) >= 400:
                break
        if len(oil_patches) >= 400:
            break
    pbar.close()
    print(f"  -> Extracted {len(oil_patches)} Oil Spill positive patches")
    all_patches.extend(oil_patches)

    # 2. Lookalikes (Hard Negatives)
    look_img_dir = DATA_DIR / "01_Train_Val_Lookalike_images" / "Lookalike"
    look_files = sorted(list(look_img_dir.glob("*.tif")))
    random.shuffle(look_files)

    look_patches = []
    pbar = tqdm(total=300, desc="Extracting Lookalike Hard Negatives")
    for f in look_files:
        crops = extract_negative_crops(f, tag="lookalike_hardneg", num_crops=2)
        for c in crops:
            look_patches.append(c)
            pbar.update(1)
            if len(look_patches) >= 300:
                break
        if len(look_patches) >= 300:
            break
    pbar.close()
    print(f"  -> Extracted {len(look_patches)} Lookalike hard negative patches")
    all_patches.extend(look_patches)

    # 3. Clean Sea (Easy Negatives)
    no_img_dir = DATA_DIR / "01_Train_Val_No_Oil_Images" / "No_oil"
    no_files = sorted(list(no_img_dir.glob("*.tif")))
    random.shuffle(no_files)

    clean_patches = []
    pbar = tqdm(total=200, desc="Extracting Clean Ocean Negatives")
    for f in no_files:
        crops = extract_negative_crops(f, tag="clean_ocean", num_crops=2)
        for c in crops:
            clean_patches.append(c)
            pbar.update(1)
            if len(clean_patches) >= 200:
                break
        if len(clean_patches) >= 200:
            break
    pbar.close()
    print(f"  -> Extracted {len(clean_patches)} Clean Ocean negative patches")
    all_patches.extend(clean_patches)

    print(f"\n[SPLIT] Total extracted: {len(all_patches)} patches")
    random.shuffle(all_patches)

    n_train = int(len(all_patches) * 0.8)
    train_data = all_patches[:n_train]
    val_data = all_patches[n_train:]

    print(f"  -> Train: {len(train_data)} patches")
    print(f"  -> Val:   {len(val_data)} patches")

    for split_name, dataset in [("train", train_data), ("val", val_data)]:
        split_dir = OUT_DIR / split_name
        for idx, (img, mask, tag) in enumerate(tqdm(dataset, desc=f"Saving {split_name}")):
            out_file = split_dir / f"patch_{idx:04d}_{tag}.npz"
            np.savez_compressed(out_file, image=img, mask=mask, tag=tag)

    print("\n[SUCCESS] Hard negative dataset ready in:", OUT_DIR)

if __name__ == "__main__":
    main()
