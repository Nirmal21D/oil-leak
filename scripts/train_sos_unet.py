import os
import sys
import time
import math
from pathlib import Path
from typing import Tuple, List, Optional
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.config import settings
from backend.app.models.unet_detector import OilSpillUNet

class SOSRefinedDataset(Dataset):
    """
    Dataset loader for Refined Deep-SAR Oil Spill (sos_refined) dataset.
    Uses dataset's formal pre-split train/ and val/ folders.
    - Pixel 0: Background / No-Oil (Class 0)
    - Pixel 255: Oil Spill Slick (Class 1)
    - Lookalike Slicks (Class 2): Formally trained when Part II dataset is added.
    """
    def __init__(self, root_dir: Path, split: str = "train", cache_in_ram: bool = True):
        self.root_dir = root_dir
        self.split = split
        self.cache_in_ram = cache_in_ram
        
        images_candidate = root_dir / "images" / split
        if not images_candidate.exists():
            images_candidate = root_dir / "images"
            
        self.images_dir = images_candidate
        self.masks_dir = Path(str(self.images_dir).replace("images", "masks"))
        if not self.masks_dir.exists():
            self.masks_dir = self.images_dir.parent / "masks"
            
        self.image_files = sorted([
            p for p in self.images_dir.rglob("*")
            if p.suffix.lower() in [".png", ".jpg", ".jpeg", ".tif", ".tiff"] and not p.name.startswith(".")
        ])
        
        print(f"[DATASET] [{split.upper()}] Loaded {len(self.image_files)} image files from: {self.images_dir}")

        # In-Memory RAM Caching as compact uint8 arrays (0-255)
        self.cached_images: List[np.ndarray] = []
        self.cached_masks: List[np.ndarray] = []
        
        if self.cache_in_ram:
            print(f"[DATASET] Pre-loading [{split.upper()}] split into RAM as uint8...")
            t0 = time.time()
            for img_path in self.image_files:
                img = Image.open(img_path).convert("RGB")
                img = img.resize((256, 256))
                img_uint8 = np.array(img, dtype=np.uint8)
                
                rel_path = img_path.relative_to(self.images_dir)
                mask_path = self.masks_dir / rel_path
                if not mask_path.exists():
                    stem_matches = list(self.masks_dir.rglob(f"{img_path.stem}.*"))
                    mask_path = stem_matches[0] if stem_matches else img_path

                if mask_path.exists():
                    mask = Image.open(mask_path).convert("L")
                    mask = mask.resize((256, 256), resample=Image.NEAREST)
                    mask_np = np.array(mask, dtype=np.uint8)
                    target_uint8 = np.zeros_like(mask_np, dtype=np.uint8)
                    target_uint8[mask_np > 0] = 1  # 255 -> Class 1 (Oil Spill)
                else:
                    target_uint8 = np.zeros((256, 256), dtype=np.uint8)

                self.cached_images.append(img_uint8)
                self.cached_masks.append(target_uint8)
                
            print(f"[DATASET] [{split.upper()}] Pre-loaded {len(self.cached_images)} items in {time.time() - t0:.2f}s!")

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx):
        if self.cache_in_ram:
            img_uint8 = self.cached_images[idx]
            target_uint8 = self.cached_masks[idx]
        else:
            img_path = self.image_files[idx]
            img = Image.open(img_path).convert("RGB").resize((256, 256))
            img_uint8 = np.array(img, dtype=np.uint8)
            
            rel_path = img_path.relative_to(self.images_dir)
            mask_path = self.masks_dir / rel_path
            if not mask_path.exists():
                stem_matches = list(self.masks_dir.rglob(f"{img_path.stem}.*"))
                mask_path = stem_matches[0] if stem_matches else img_path

            if mask_path.exists():
                mask = Image.open(mask_path).convert("L").resize((256, 256), resample=Image.NEAREST)
                mask_np = np.array(mask, dtype=np.uint8)
                target_uint8 = np.zeros_like(mask_np, dtype=np.uint8)
                target_uint8[mask_np > 0] = 1
            else:
                target_uint8 = np.zeros((256, 256), dtype=np.uint8)

        img_np = img_uint8.astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_np).permute(2, 0, 1)
        mask_tensor = torch.from_numpy(target_uint8.astype(np.int64))
        return img_tensor, mask_tensor

def locate_sos_refined() -> Path:
    paths = [
        ROOT_DIR / "oil_spill_data" / "sos_refined",
        settings.DATA_DIR / "sos_refined",
    ]
    for p in paths:
        if p.exists() and (p / "images").exists():
            return p
    raise FileNotFoundError("Could not find sos_refined dataset directory.")

def calculate_iou_per_class(preds: torch.Tensor, targets: torch.Tensor, num_classes: int = 3) -> Tuple[List[float], float]:
    preds_flat = preds.view(-1)
    targets_flat = targets.view(-1)
    
    ious = []
    for cls in range(num_classes):
        pred_inds = (preds_flat == cls)
        target_inds = (targets_flat == cls)
        
        intersection = (pred_inds & target_inds).sum().item()
        union = (pred_inds | target_inds).sum().item()
        
        if target_inds.sum().item() == 0:
            # Class not present in ground truth dataset
            ious.append(float('nan'))
        else:
            ious.append(intersection / (union + 1e-6))
            
    valid_ious = [iou for iou in ious if not math.isnan(iou)]
    mean_iou = sum(valid_ious) / max(len(valid_ious), 1)
    return ious, mean_iou

@torch.no_grad()
def evaluate_validation(model: nn.Module, val_loader: DataLoader, criterion: nn.Module, device: torch.device):
    model.eval()
    val_loss = 0.0
    all_preds = []
    all_targets = []
    
    use_cuda_amp = device.type == "cuda"
    for images, masks in val_loader:
        images, masks = images.to(device), masks.to(device)
        
        if use_cuda_amp:
            with torch.amp.autocast(device_type="cuda"):
                outputs = model(images)
                loss = criterion(outputs, masks)
        else:
            outputs = model(images)
            loss = criterion(outputs, masks)
            
        val_loss += loss.item()
        
        preds = torch.argmax(outputs, dim=1)
        all_preds.append(preds.cpu())
        all_targets.append(masks.cpu())
        
    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)
    
    class_ious, mean_iou = calculate_iou_per_class(all_preds, all_targets, num_classes=3)
    avg_val_loss = val_loss / max(len(val_loader), 1)
    model.train()
    return avg_val_loss, class_ious, mean_iou

def train(epochs: int = 3, batch_size: int = 16, lr: float = 1e-3, num_workers: int = 2):
    print("=" * 70)
    print(" AegisSea — PyTorch U-Net Training & Validation (Formal Held-Out Split)")
    print("=" * 70)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device Selected         : {device}")
    if device.type == "cuda":
        print(f"GPU Name                : {torch.cuda.get_device_name(0)}")

    data_dir = locate_sos_refined()
    
    train_dataset = SOSRefinedDataset(data_dir, split="train", cache_in_ram=True)
    val_dataset = SOSRefinedDataset(data_dir, split="val", cache_in_ram=True)
    
    print(f"Dataset Split           : {len(train_dataset)} Formal Train | {len(val_dataset)} Formal Val")

    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=(device.type == "cuda"), persistent_workers=(num_workers > 0)
    )
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=(device.type == "cuda"), persistent_workers=(num_workers > 0)
    )

    model = OilSpillUNet(in_channels=3, num_classes=3)
    model.to(device)

    class_weights = torch.tensor([1.0, 5.0, 1.0], device=device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)

    scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))

    print(f"\nStarting Fine-Tuning for {epochs} Epochs on {device} (AMP Enabled)...")
    start_train_time = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        running_train_loss = 0.0
        model.train()
        
        for batch_idx, (images, masks) in enumerate(train_loader):
            images, masks = images.to(device), masks.to(device)
            optimizer.zero_grad()
            
            if device.type == "cuda":
                with torch.amp.autocast(device_type="cuda"):
                    outputs = model(images)
                    loss = criterion(outputs, masks)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(images)
                loss = criterion(outputs, masks)
                loss.backward()
                optimizer.step()

            running_train_loss += loss.item()

        avg_train_loss = running_train_loss / max(len(train_loader), 1)
        val_loss, class_ious, mean_iou = evaluate_validation(model, val_loader, criterion, device)
        epoch_sec = time.time() - epoch_start
        
        bg_iou = class_ious[0] if not math.isnan(class_ious[0]) else 0.0
        oil_iou = class_ious[1] if not math.isnan(class_ious[1]) else 0.0
        lookalike_str = "N/A (No GT in sos_refined)" if math.isnan(class_ious[2]) else f"{class_ious[2]:.4f}"

        print(f"--> Epoch [{epoch}/{epochs}] ({epoch_sec:.1f}s) | Train Loss: {avg_train_loss:.4f} | Val Loss: {val_loss:.4f}")
        print(f"    Held-Out Val Metrics -> Mean Active IoU: {mean_iou:.4f} | Background IoU: {bg_iou:.4f} | Oil Spill IoU: {oil_iou:.4f} | Lookalike IoU: {lookalike_str}\n")

    total_time = time.time() - start_train_time
    print(f"Training & Formal Validation Complete in {total_time:.2f} seconds!")

    weights_dir = settings.WEIGHTS_DIR
    weights_dir.mkdir(parents=True, exist_ok=True)
    out_path = settings.DEFAULT_WEIGHTS_FILE
    torch.save(model.state_dict(), out_path)
    print(f"[SUCCESS] Trained weights saved to: {out_path}")

if __name__ == "__main__":
    train(epochs=3, batch_size=16, num_workers=2)
