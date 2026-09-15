#!/usr/bin/env python3
"""
prepare_balanced_patches.py

Extracts 900 balanced 256x256 patches from real Sentinel-1 SAR GeoTIFFs (Part I & II)
for genuine 3-class U-Net training (Clean Sea=0, Oil=1, Lookalike=2).

Realistic Sampling Strategy:
- 50% Centroid-Focused: Captures dense morphological core.
- 50% Jittered / Boundary-Offset: Captures edge-of-tile slicks and sparse ocean context
  matching live 2048x2048 sliding-window inference.
- Balanced: 300 Oil, 300 Lookalike, 300 Clean Sea patches.
- 80% Train (720 patches) / 20% Val (180 patches).
- Saves compact .npz files (image: uint8 HxWx3, mask: uint8 HxW).
"""

import os
import random
from pathlib import Path
import numpy as np
import tifffile
from tqdm import tqdm

DATA_DIR = Path("data")
OUT_DIR = DATA_DIR / "patches_3class"

TARGET_PER_CLASS = 300
CROP_SIZE = 256
SEED = 42

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)

def normalize_sar(arr: np.ndarray) -> np.ndarray:
    """
    Converts 2048x2048x2 (VV, VH) float32 dB Sentinel-1 data
    into uint8 (256, 256, 3) false-color composite.
    """
    if arr.ndim == 3 and arr.shape[-1] >= 2:
        vv = arr[:, :, 0]
        vh = arr[:, :, 1]
        vv_norm = np.clip((vv - (-35.0)) / ((-5.0) - (-35.0)) * 255.0, 0, 255).astype(np.uint8)
        vh_norm = np.clip((vh - (-40.0)) / ((-10.0) - (-40.0)) * 255.0, 0, 255).astype(np.uint8)
        diff = np.clip((vv - vh - 0.0) / (20.0 - 0.0) * 255.0, 0, 255).astype(np.uint8)
        return np.stack([vv_norm, vh_norm, diff], axis=-1)
    elif arr.ndim == 2:
        norm = np.clip((arr - (-35.0)) / ((-5.0) - (-35.0)) * 255.0, 0, 255).astype(np.uint8)
        return np.stack([norm, norm, norm], axis=-1)
    else:
        norm = ((arr - arr.min()) / (arr.max() - arr.min() + 1e-6) * 255.0).astype(np.uint8)
        return norm

def extract_crops_from_scene(img_path: Path, mask_path: Path, target_class: int, num_crops: int = 1):
    """
    Extracts 256x256 crops using 50% centroid and 50% jittered/boundary strategy.
    """
    try:
        raw_img = tifffile.imread(str(img_path))
        img_rgb = normalize_sar(raw_img)
        raw_mask = tifffile.imread(str(mask_path))
        
        # Binary mask -> convert foreground to target_class (1 or 2)
        binary_mask = (raw_mask > 0).astype(np.uint8)
        if target_class > 0:
            mask_3class = binary_mask * target_class
        else:
            mask_3class = np.zeros_like(raw_mask, dtype=np.uint8)
            
        H, W = img_rgb.shape[:2]
        crops = []

        if target_class == 0 or np.sum(binary_mask) < 20:
            # Clean Sea: sample random ocean windows
            for _ in range(num_crops):
                top = random.randint(0, H - CROP_SIZE)
                left = random.randint(0, W - CROP_SIZE)
                c_img = img_rgb[top:top+CROP_SIZE, left:left+CROP_SIZE]
                c_mask = np.zeros((CROP_SIZE, CROP_SIZE), dtype=np.uint8)
                crops.append((c_img, c_mask))
            return crops

        # Oil or Lookalike: find feature coordinates
        y_indices, x_indices = np.where(binary_mask == 1)
        if len(y_indices) == 0:
            return []

        cy = int(np.mean(y_indices))
        cx = int(np.mean(x_indices))

        for i in range(num_crops):
            if i % 2 == 0:
                # 50% Centroid-Focused
                top = max(0, min(H - CROP_SIZE, cy - CROP_SIZE // 2))
                left = max(0, min(W - CROP_SIZE, cx - CROP_SIZE // 2))
            else:
                # 50% Jittered / Boundary-Offset (realistic edge-of-tile framing)
                offset_y = random.randint(-110, 110)
                offset_x = random.randint(-110, 110)
                top = max(0, min(H - CROP_SIZE, cy - CROP_SIZE // 2 + offset_y))
                left = max(0, min(W - CROP_SIZE, cx - CROP_SIZE // 2 + offset_x))

            c_img = img_rgb[top:top+CROP_SIZE, left:left+CROP_SIZE]
            c_mask = mask_3class[top:top+CROP_SIZE, left:left+CROP_SIZE]
            crops.append((c_img, c_mask))

        return crops
    except Exception as e:
        return []

def main():
    set_seed(SEED)
    print("=" * 70)
    print("  AEGIS-SEA: BALANCED 3-CLASS PATCH EXTRACTION PIPELINE")
    print(f"  Target: {TARGET_PER_CLASS} patches each for Clean Sea (0), Oil (1), Lookalike (2)")
    print("  Strategy: 50% Centroid-Focused + 50% Jittered Boundary Framing")
    print("=" * 70)

    for split in ["train", "val"]:
        (OUT_DIR / split).mkdir(parents=True, exist_ok=True)

    configs = [
        {
            "class_id": 1,
            "label": "Oil Spill",
            "img_dir": DATA_DIR / "01_Train_Val_Oil_Spill_images" / "Oil",
            "mask_dir": DATA_DIR / "01_Train_Val_Oil_Spill_mask" / "Mask_oil"
        },
        {
            "class_id": 2,
            "label": "Lookalike",
            "img_dir": DATA_DIR / "01_Train_Val_Lookalike_images" / "Lookalike",
            "mask_dir": DATA_DIR / "01_Train_Val_Lookalike_mask" / "Mask_lookalike"
        },
        {
            "class_id": 0,
            "label": "Clean Sea",
            "img_dir": DATA_DIR / "01_Train_Val_No_Oil_Images" / "No_oil",
            "mask_dir": DATA_DIR / "01_Train_Val_No_Oil_mask" / "Mask_no_oil"
        }
    ]

    all_patches = []

    for cfg in configs:
        cls_id = cfg["class_id"]
        label = cfg["label"]
        img_dir = cfg["img_dir"]
        mask_dir = cfg["mask_dir"]

        img_files = sorted(list(img_dir.glob("*.tif")))
        print(f"\n[SCAN] Found {len(img_files)} scenes for Class {cls_id} ({label})")
        random.shuffle(img_files)

        cls_patches = []
        pbar = tqdm(total=TARGET_PER_CLASS, desc=f"Extracting {label}")

        for img_path in img_files:
            mask_path = mask_dir / img_path.name
            if not mask_path.exists():
                continue

            # Extract 2-3 crops per scene to avoid overfitting a single scene
            crops = extract_crops_from_scene(img_path, mask_path, cls_id, num_crops=2)
            for c_img, c_mask in crops:
                cls_patches.append((c_img, c_mask, cls_id))
                pbar.update(1)
                if len(cls_patches) >= TARGET_PER_CLASS:
                    break

            if len(cls_patches) >= TARGET_PER_CLASS:
                break

        pbar.close()
        print(f"  -> Extracted {len(cls_patches)} patches for {label}")
        all_patches.extend(cls_patches)

    print(f"\n[SPLIT] Total extracted patches across 3 classes: {len(all_patches)}")
    random.shuffle(all_patches)

    # 80/20 train/val split
    n_train = int(len(all_patches) * 0.8)
    train_data = all_patches[:n_train]
    val_data = all_patches[n_train:]

    print(f"  -> Train: {len(train_data)} patches")
    print(f"  -> Val:   {len(val_data)} patches")

    for split_name, dataset in [("train", train_data), ("val", val_data)]:
        split_dir = OUT_DIR / split_name
        for idx, (img, mask, cls_id) in enumerate(tqdm(dataset, desc=f"Writing {split_name}")):
            out_file = split_dir / f"patch_{idx:04d}_cls{cls_id}.npz"
            np.savez_compressed(out_file, image=img, mask=mask, class_id=cls_id)

    print("\n[SUCCESS] Balanced 3-class dataset prepared in:", OUT_DIR)

if __name__ == "__main__":
    main()
