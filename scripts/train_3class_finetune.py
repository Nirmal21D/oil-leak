#!/usr/bin/env python3
"""
train_3class_finetune.py

Fine-tunes OilSpillUNet (ResNet34) on real Sentinel-1 SAR balanced patches (Part I & II)
for genuine 3-class segmentation:
- Class 0: Clean Sea / Background
- Class 1: Real Oil Spill
- Class 2: Biogenic / Low-Wind Lookalike

Training specifications:
- Class-Weighted Focal Loss (gamma=2.0)
- AdamW optimizer (lr=1e-4) with Cosine Annealing
- Mixed Precision (torch.cuda.amp)
- Live VRAM allocation logging (Batch 1, Batch 5, Epoch boundaries)
- Per-class IoU logging every epoch (IoU_Clean, IoU_Oil, IoU_Lookalike, mIoU)
- 6 Epochs total
- Saves best checkpoint to: backend/app/models/weights/s1_unet_3class_best.pth
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
from tqdm import tqdm

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.models.unet_detector import OilSpillUNet

PATCH_DIR = ROOT_DIR / "data" / "patches_3class"
WEIGHTS_DIR = ROOT_DIR / "backend" / "app" / "models" / "weights"
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_PATH = WEIGHTS_DIR / "s1_unet_3class_best.pth"
INITIAL_WEIGHTS = WEIGHTS_DIR / "sos_unet_resnet34.pth"

NUM_CLASSES = 3
BATCH_SIZE = 16
NUM_EPOCHS = 6
LEARNING_RATE = 1e-4

# Class-weighted focal loss to address pixel imbalance
class MultiClassFocalLoss(nn.Module):
    def __init__(self, alpha: torch.Tensor, gamma: float = 2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        logits: (B, C, H, W)
        targets: (B, H, W) with class indices {0, 1, 2}
        """
        ce_loss = F.cross_entropy(logits, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        
        # Gather alpha for each pixel target
        alpha_t = self.alpha[targets]
        focal_loss = alpha_t * ((1.0 - pt) ** self.gamma) * ce_loss
        return focal_loss.mean()

class Patch3ClassDataset(Dataset):
    def __init__(self, split_dir: Path, cache_in_ram: bool = True):
        self.files = sorted(list(split_dir.glob("*.npz")))
        self.cache_in_ram = cache_in_ram
        self.cached_images = []
        self.cached_masks = []
        
        if self.cache_in_ram:
            print(f"[DATASET] Caching {len(self.files)} patches into RAM from {split_dir.name}...")
            for f in self.files:
                data = np.load(f)
                self.cached_images.append(data["image"])
                self.cached_masks.append(data["mask"])

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        if self.cache_in_ram:
            img = self.cached_images[idx]
            mask = self.cached_masks[idx]
        else:
            data = np.load(self.files[idx])
            img = data["image"]
            mask = data["mask"]

        # Convert to FloatTensor [0, 1] normalized, shape (3, 256, 256)
        img_tensor = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
        mask_tensor = torch.from_numpy(mask).long()
        return img_tensor, mask_tensor

def compute_per_class_iou(conf_matrix: np.ndarray) -> Dict[str, float]:
    """
    conf_matrix: (num_classes, num_classes) where row=ground_truth, col=prediction
    """
    ious = {}
    classes = ["Clean_Sea", "Oil_Spill", "Lookalike"]
    for i, name in enumerate(classes):
        tp = conf_matrix[i, i]
        fp = np.sum(conf_matrix[:, i]) - tp
        fn = np.sum(conf_matrix[i, :]) - tp
        denom = tp + fp + fn
        ious[name] = float(tp / denom) if denom > 0 else 0.0
        
    ious["mIoU"] = float(np.mean(list(ious.values())))
    return ious

def main():
    print("=" * 75)
    print("  AEGIS-SEA: 3-CLASS SENTINEL-1 SAR U-NET FINE-TUNING")
    print("  Classes: 0=Clean Sea | 1=Oil Spill | 2=Lookalike")
    print(f"  Target Checkpoint: {CHECKPOINT_PATH.name}")
    print("=" * 75)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Using: {device}")
    if torch.cuda.is_available():
        print(f"  -> GPU: {torch.cuda.get_device_name(0)}")
        print(f"  -> Initial Allocated VRAM: {torch.cuda.memory_allocated() / (1024**2):.2f} MB")

    # Load datasets
    train_dir = PATCH_DIR / "train"
    val_dir = PATCH_DIR / "val"
    if not train_dir.exists() or not val_dir.exists():
        sys.exit(f"Error: Dataset directory {PATCH_DIR} not found. Run prepare_balanced_patches.py first.")

    train_ds = Patch3ClassDataset(train_dir, cache_in_ram=True)
    val_ds = Patch3ClassDataset(val_dir, cache_in_ram=True)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, pin_memory=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, pin_memory=True, num_workers=0)

    # Initialize model
    model = OilSpillUNet(in_channels=3, num_classes=NUM_CLASSES)
    if INITIAL_WEIGHTS.exists():
        try:
            state = torch.load(INITIAL_WEIGHTS, map_location="cpu")
            # Filter out head weights if shape mismatch
            model_dict = model.state_dict()
            pretrained_dict = {k: v for k, v in state.items() if k in model_dict and v.shape == model_dict[k].shape}
            model_dict.update(pretrained_dict)
            model.load_state_dict(model_dict)
            print(f"[MODEL] Initialized with {len(pretrained_dict)} matching layers from: {INITIAL_WEIGHTS.name}")
        except Exception as e:
            print(f"[MODEL] Could not load initial checkpoint ({e}). Training from scratch/ImageNet.")
    else:
        print("[MODEL] Initializing with default weights.")

    model.to(device)

    # Class weights: Clean Sea is dominant in ocean scenes, so downweight class 0 slightly
    # Class 1 (Oil) and Class 2 (Lookalike) receive higher weight to emphasize discrimination
    class_weights = torch.tensor([0.4, 1.4, 1.2], dtype=torch.float32, device=device)
    criterion = MultiClassFocalLoss(alpha=class_weights, gamma=2.0)

    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-6)
    scaler = GradScaler()

    best_miou = 0.0
    best_confusion_matrix = None

    print(f"\n[TRAINING] Starting {NUM_EPOCHS} epochs on {len(train_ds)} train patches, {len(val_ds)} val patches...")

    for epoch in range(1, NUM_EPOCHS + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0

        for batch_idx, (images, targets) in enumerate(train_loader):
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

            # Batch VRAM logging check
            if epoch == 1 and batch_idx in [0, 4]:
                if torch.cuda.is_available():
                    vram_mb = torch.cuda.memory_allocated() / (1024**2)
                    print(f"  [VRAM AUDIT] Epoch 1, Batch {batch_idx+1}: {vram_mb:.1f} MB allocated on GPU")

        scheduler.step()
        train_loss /= len(train_loader)
        epoch_time = time.time() - t0

        # Validation phase
        model.eval()
        val_loss = 0.0
        conf_matrix = np.zeros((NUM_CLASSES, NUM_CLASSES), dtype=np.int64)

        with torch.no_grad():
            for images, targets in val_loader:
                images = images.to(device, non_blocking=True)
                targets = targets.to(device, non_blocking=True)

                with autocast():
                    logits = model(images)
                    loss = criterion(logits, targets)

                val_loss += loss.item()
                preds = torch.argmax(logits, dim=1).cpu().numpy().flatten()
                targs = targets.cpu().numpy().flatten()

                # Accumulate confusion matrix
                for p, t in zip(preds, targs):
                    if 0 <= t < NUM_CLASSES and 0 <= p < NUM_CLASSES:
                        conf_matrix[t, p] += 1

        val_loss /= len(val_loader)
        ious = compute_per_class_iou(conf_matrix)

        print(f"\n--- Epoch {epoch}/{NUM_EPOCHS} ({epoch_time:.1f}s) ---")
        print(f"  Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"  IoU Clean Sea: {ious['Clean_Sea']*100:.2f}% | IoU Oil Spill: {ious['Oil_Spill']*100:.2f}% | IoU Lookalike: {ious['Lookalike']*100:.2f}%")
        print(f"  Mean IoU: {ious['mIoU']*100:.2f}%")

        if ious['mIoU'] > best_miou:
            best_miou = ious['mIoU']
            best_confusion_matrix = conf_matrix
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            print(f"  -> Checkpoint saved! Best mIoU: {best_miou*100:.2f}% to {CHECKPOINT_PATH.name}")

    print("\n" + "=" * 75)
    print("  TRAINING COMPLETE: 3-CLASS MODEL VALIDATION RESULTS")
    print("=" * 75)
    print(f"Best Validation mIoU: {best_miou*100:.2f}%\n")
    print("Validation Confusion Matrix (Rows = Ground Truth, Columns = Prediction):")
    print("                  Pred Clean    Pred Oil    Pred Lookalike")
    classes = ["True Clean", "True Oil", "True Lookalike"]
    for i, name in enumerate(classes):
        row = best_confusion_matrix[i]
        print(f"  {name:<15}: {row[0]:<12} {row[1]:<11} {row[2]:<14}")

if __name__ == "__main__":
    main()
