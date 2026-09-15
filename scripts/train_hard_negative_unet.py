#!/usr/bin/env python3
"""
train_hard_negative_unet.py

Trains 2-Class OilSpillUNet (ResNet34 backbone) with Hard Negative Mining (Option 1):
- Class 0: Background (Clean Ocean + Lookalikes)
- Class 1: Real Oil Spill

Dataset:
- Positive patches from Part I (Oil Spill)
- Hard negative patches from Part II (Lookalike scenes with natural dark damping)
- Easy negative patches from Part II (Clean Ocean)

Specifications:
- 2-Class Focal Loss (gamma=2.0)
- AdamW (lr=1e-4) with Cosine Annealing scheduler
- Mixed precision (torch.cuda.amp.autocast)
- Live GPU VRAM logging (Batch 1, Batch 5)
- Tracks: Oil IoU, Oil Precision, Oil Recall, Lookalike Rejection Rate
- 6 Epochs total
- Saves best checkpoint to: backend/app/models/weights/s1_unet_hardneg_best.pth
"""

import os
import sys
import time
from pathlib import Path
from typing import Tuple, List, Dict
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torch.cuda.amp import autocast, GradScaler

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.models.unet_detector import OilSpillUNet

PATCH_DIR = ROOT_DIR / "data" / "patches_hardneg"
WEIGHTS_DIR = ROOT_DIR / "backend" / "app" / "models" / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_PATH = WEIGHTS_DIR / "s1_unet_hardneg_best.pth"
BASELINE_WEIGHTS = WEIGHTS_DIR / "sos_unet_resnet34.pth"

NUM_CLASSES = 2
BATCH_SIZE = 16
NUM_EPOCHS = 6
LEARNING_RATE = 1e-4

class FocalLoss2Class(nn.Module):
    def __init__(self, alpha: torch.Tensor, gamma: float = 2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(logits, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        alpha_t = self.alpha[targets]
        focal_loss = alpha_t * ((1.0 - pt) ** self.gamma) * ce_loss
        return focal_loss.mean()

class HardNegDataset(Dataset):
    def __init__(self, split_dir: Path, cache_in_ram: bool = True):
        self.files = sorted(list(split_dir.glob("*.npz")))
        self.cache_in_ram = cache_in_ram
        self.cached_images = []
        self.cached_masks = []
        self.cached_tags = []

        if self.cache_in_ram:
            print(f"[DATASET] Caching {len(self.files)} patches into RAM from {split_dir.name}...")
            for f in self.files:
                data = np.load(f)
                self.cached_images.append(data["image"])
                self.cached_masks.append(data["mask"])
                self.cached_tags.append(str(data.get("tag", "unknown")))

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, str]:
        if self.cache_in_ram:
            img = self.cached_images[idx]
            mask = self.cached_masks[idx]
            tag = self.cached_tags[idx]
        else:
            data = np.load(self.files[idx])
            img = data["image"]
            mask = data["mask"]
            tag = str(data.get("tag", "unknown"))

        img_tensor = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
        mask_tensor = torch.from_numpy(mask).long()
        return img_tensor, mask_tensor, tag

def main():
    print("=" * 80)
    print("  AEGIS-SEA: 2-CLASS SENTINEL-1 U-NET TRAINING (HARD NEGATIVE MINING)")
    print("  Dataset: Part I (Oil Positives) + Part II (Lookalike Hard Negatives + Clean Sea)")
    print(f"  Target Checkpoint: {CHECKPOINT_PATH.name}")
    print("=" * 80)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Training on: {device}")
    if torch.cuda.is_available():
        print(f"  -> GPU: {torch.cuda.get_device_name(0)}")
        print(f"  -> Initial Allocated VRAM: {torch.cuda.memory_allocated() / (1024**2):.2f} MB")

    train_dir = PATCH_DIR / "train"
    val_dir = PATCH_DIR / "val"
    if not train_dir.exists() or not val_dir.exists():
        sys.exit(f"Error: Dataset {PATCH_DIR} not found. Run prepare_hard_negative_patches.py first.")

    train_ds = HardNegDataset(train_dir, cache_in_ram=True)
    val_ds = HardNegDataset(val_dir, cache_in_ram=True)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, pin_memory=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, pin_memory=True, num_workers=0)

    model = OilSpillUNet(in_channels=3, num_classes=NUM_CLASSES)
    if BASELINE_WEIGHTS.exists():
        try:
            state = torch.load(BASELINE_WEIGHTS, map_location="cpu")
            model_dict = model.state_dict()
            pretrained_dict = {k: v for k, v in state.items() if k in model_dict and v.shape == model_dict[k].shape}
            model_dict.update(pretrained_dict)
            model.load_state_dict(model_dict)
            print(f"[MODEL] Initialized with {len(pretrained_dict)} matching layers from: {BASELINE_WEIGHTS.name}")
        except Exception as e:
            print(f"[MODEL] Initializing with default backbone ({e}).")

    model.to(device)

    # Class weights: Balanced [1.0, 1.0] to prevent over-predicting oil
    class_weights = torch.tensor([1.0, 1.0], dtype=torch.float32, device=device)
    criterion = FocalLoss2Class(alpha=class_weights, gamma=2.0)

    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)
    scaler = GradScaler()

    best_oil_iou = 0.0
    best_stats = {}

    print(f"\n[TRAINING] Starting {NUM_EPOCHS} epochs on {len(train_ds)} train, {len(val_ds)} val patches...")

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for batch_idx, (images, targets, _) in enumerate(train_loader):
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)

            optimizer.zero_grad()
            with autocast():
                logits = model(images)
                loss = criterion(logits, targets)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            train_loss += loss.item()

            # Batch VRAM logging on Batch 1 and Batch 5 of Epoch 1
            if epoch == 1 and batch_idx in [0, 4]:
                if torch.cuda.is_available():
                    vram_mb = torch.cuda.memory_allocated() / (1024**2)
                    print(f"  [VRAM AUDIT] Epoch 1, Batch {batch_idx+1}: {vram_mb:.1f} MB allocated on GPU")

        scheduler.step()
        train_loss /= len(train_loader)
        epoch_time = time.time() - t0

        # Validation
        model.eval()
        val_loss = 0.0
        oil_tp = 0
        oil_fp = 0
        oil_fn = 0

        lookalike_total_pixels = 0
        lookalike_clean_pixels = 0

        with torch.no_grad():
            for images, targets, tags in val_loader:
                images = images.to(device, non_blocking=True)
                targets = targets.to(device, non_blocking=True)

                with autocast():
                    logits = model(images)
                    loss = criterion(logits, targets)

                val_loss += loss.item()
                preds = torch.argmax(logits, dim=1).cpu().numpy()
                targs = targets.cpu().numpy()

                for b in range(len(preds)):
                    p_mask = preds[b]
                    t_mask = targs[b]
                    tag = tags[b]

                    # Global Oil metrics
                    tp = np.sum((p_mask == 1) & (t_mask == 1))
                    fp = np.sum((p_mask == 1) & (t_mask == 0))
                    fn = np.sum((p_mask == 0) & (t_mask == 1))
                    oil_tp += int(tp)
                    oil_fp += int(fp)
                    oil_fn += int(fn)

                    # Lookalike false alarm tracking
                    if "lookalike" in tag:
                        lookalike_total_pixels += p_mask.size
                        # True negative on lookalike means predicting 0
                        lookalike_clean_pixels += int(np.sum(p_mask == 0))

        val_loss /= len(val_loader)
        oil_iou = float(oil_tp / max(oil_tp + oil_fp + oil_fn, 1))
        oil_prec = float(oil_tp / max(oil_tp + oil_fp, 1))
        oil_rec = float(oil_tp / max(oil_tp + oil_fn, 1))
        lookalike_rejection = float(lookalike_clean_pixels / max(lookalike_total_pixels, 1)) * 100.0

        print(f"\n--- Epoch {epoch}/{NUM_EPOCHS} ({epoch_time:.1f}s) ---")
        print(f"  Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"  Oil Spill IoU: {oil_iou*100:.2f}% | Precision: {oil_prec*100:.2f}% | Recall: {oil_rec*100:.2f}%")
        print(f"  Lookalike Rejection Rate: {lookalike_rejection:.2f}% (pixels correctly not flagged as oil)")

        if oil_iou > best_oil_iou:
            best_oil_iou = oil_iou
            best_stats = {
                "epoch": epoch,
                "oil_iou": oil_iou,
                "oil_precision": oil_prec,
                "oil_recall": oil_rec,
                "lookalike_rejection": lookalike_rejection
            }
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            print(f"  -> Checkpoint saved! Best Oil IoU: {best_oil_iou*100:.2f}% to {CHECKPOINT_PATH.name}")

    print("\n" + "=" * 80)
    print("  TRAINING COMPLETE: 2-CLASS HARD NEGATIVE MODEL VALIDATION RESULTS")
    print("=" * 80)
    print(f"Best Validation Epoch:     {best_stats.get('epoch')}")
    print(f"Best Oil Spill IoU:        {best_stats.get('oil_iou', 0)*100:.2f}%")
    print(f"Best Oil Precision:        {best_stats.get('oil_precision', 0)*100:.2f}%")
    print(f"Best Oil Recall:           {best_stats.get('oil_recall', 0)*100:.2f}%")
    print(f"Lookalike Rejection Rate:  {best_stats.get('lookalike_rejection', 0):.2f}%")
    print(f"Saved Checkpoint:          {CHECKPOINT_PATH}")

if __name__ == "__main__":
    main()
