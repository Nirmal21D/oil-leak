import os
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

try:
    import segmentation_models_pytorch as smp
    HAS_SMP = True
except ImportError:
    HAS_SMP = False

class OilSpillUNet(nn.Module):
    """
    3-Class U-Net for Marine Oil Spill Detection:
    - Class 0: Background / No-Oil
    - Class 1: Oil Spill
    - Class 2: Lookalike Slick (biogenic / low-wind)
    """
    def __init__(self, in_channels: int = 3, num_classes: int = 3, encoder_name: str = "resnet34"):
        super().__init__()
        self.num_classes = num_classes
        if HAS_SMP:
            self.model = smp.Unet(
                encoder_name=encoder_name,
                encoder_weights="imagenet",
                in_channels=in_channels,
                classes=num_classes,
                activation=None  # We return raw logits
            )
        else:
            # Fallback basic U-Net backbone if smp isn't installed yet
            self.model = self._build_basic_unet(in_channels, num_classes)

    def _build_basic_unet(self, in_channels: int, num_classes: int) -> nn.Module:
        class ConvBlock(nn.Module):
            def __init__(self, c_in, c_out):
                super().__init__()
                self.conv = nn.Sequential(
                    nn.Conv2d(c_in, c_out, 3, padding=1),
                    nn.BatchNorm2d(c_out),
                    nn.ReLU(inplace=True),
                    nn.Conv2d(c_out, c_out, 3, padding=1),
                    nn.BatchNorm2d(c_out),
                    nn.ReLU(inplace=True)
                )
            def forward(self, x): return self.conv(x)

        class BasicUNet(nn.Module):
            def __init__(self, in_c, out_c):
                super().__init__()
                self.enc1 = ConvBlock(in_c, 32)
                self.pool1 = nn.MaxPool2d(2)
                self.enc2 = ConvBlock(32, 64)
                self.pool2 = nn.MaxPool2d(2)
                self.bottleneck = ConvBlock(64, 128)
                self.up2 = nn.ConvTranspose2d(128, 64, 2, stride=2)
                self.dec2 = ConvBlock(128, 64)
                self.up1 = nn.ConvTranspose2d(64, 32, 2, stride=2)
                self.dec1 = ConvBlock(64, 32)
                self.out = nn.Conv2d(32, out_c, 1)

            def forward(self, x):
                e1 = self.enc1(x)
                e2 = self.enc2(self.pool1(e1))
                b = self.bottleneck(self.pool2(e2))
                d2 = self.dec2(torch.cat([self.up2(b), e2], dim=1))
                d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
                return self.out(d1)

        return BasicUNet(in_channels, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)

class TileSlidingInference:
    """
    Sliding-window inference wrapper for large SAR scenes (e.g. 2048x2048)
    trained on 256x256 patches with 50% overlap.
    """
    def __init__(self, model: nn.Module, tile_size: int = 256, stride: int = 128, device: str = "cpu"):
        self.model = model
        self.tile_size = tile_size
        self.stride = stride
        self.device = torch.device(device)
        self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def predict_scene(self, scene_rgb: np.ndarray) -> np.ndarray:
        """
        Input: numpy array (H, W, 3) or (H, W) normalized to [0, 1] or uint8 [0, 255]
        Output: class predictions numpy array (H, W) with values in {0, 1, 2}
        """
        if scene_rgb.ndim == 2:
            scene_rgb = np.stack([scene_rgb]*3, axis=-1)
        
        H, W, C = scene_rgb.shape
        # Pad to multiple of tile_size if needed
        pad_h = (self.tile_size - (H % self.tile_size)) % self.tile_size
        pad_w = (self.tile_size - (W % self.tile_size)) % self.tile_size
        
        padded = np.pad(scene_rgb, ((0, pad_h), (0, pad_w), (0, 0)), mode="reflect")
        pH, pW, _ = padded.shape
        
        num_classes = getattr(self.model, 'num_classes', 2)
        probs_accum = np.zeros((num_classes, pH, pW), dtype=np.float32)
        count_accum = np.zeros((1, pH, pW), dtype=np.float32)
        
        for y in range(0, pH - self.tile_size + 1, self.stride):
            for x in range(0, pW - self.tile_size + 1, self.stride):
                crop = padded[y:y+self.tile_size, x:x+self.tile_size]
                # Convert to FloatTensor (1, 3, 256, 256) normalized [0, 1]
                tensor_crop = torch.from_numpy(crop).permute(2, 0, 1).unsqueeze(0).float()
                if tensor_crop.max() > 1.0:
                    tensor_crop /= 255.0
                    
                tensor_crop = tensor_crop.to(self.device)
                logits = self.model(tensor_crop)
                probs = F.softmax(logits, dim=1).squeeze(0).cpu().numpy()
                
                probs_accum[:, y:y+self.tile_size, x:x+self.tile_size] += probs
                count_accum[:, y:y+self.tile_size, x:x+self.tile_size] += 1.0
                
        probs_avg = probs_accum / np.maximum(count_accum, 1e-6)
        probs_cropped = probs_avg[:, :H, :W]
        mask_pred = np.argmax(probs_cropped, axis=0)
        return mask_pred

def load_detector_model(weights_path: str = None, device: str = "cpu") -> OilSpillUNet:
    num_classes = 2
    state_dict = None
    if weights_path and Path(weights_path).exists():
        try:
            state_dict = torch.load(weights_path, map_location=device)
            if "model.segmentation_head.0.weight" in state_dict:
                num_classes = state_dict["model.segmentation_head.0.weight"].shape[0]
            elif "segmentation_head.0.weight" in state_dict:
                num_classes = state_dict["segmentation_head.0.weight"].shape[0]
        except Exception as e:
            print(f"[MODEL WARNING] Pre-inspection failed for {weights_path}: {e}")

    model = OilSpillUNet(in_channels=3, num_classes=num_classes)
    if state_dict is not None:
        try:
            model.load_state_dict(state_dict)
            print(f"[MODEL] Successfully loaded {num_classes}-class weights from: {weights_path}")
        except Exception as e:
            print(f"[MODEL WARNING] Failed to load weights from {weights_path}: {e}")
    else:
        print("[MODEL INFO] Running with initialized backbone weights (untrained baseline).")
    model.eval()
    return model

if __name__ == "__main__":
    print("Testing OilSpillUNet model initialization...")
    model = load_detector_model()
    dummy_input = torch.randn(2, 3, 256, 256)
    out = model(dummy_input)
    print(f"Forward pass output shape: {out.shape} (Expected: (2, 3, 256, 256))")
    
    dummy_scene = np.random.randint(0, 256, (1024, 1024, 3), dtype=np.uint8)
    inferencer = TileSlidingInference(model, tile_size=256, stride=128)
    mask = inferencer.predict_scene(dummy_scene)
    print(f"Sliding-window predicted mask shape: {mask.shape}, Unique classes: {np.unique(mask)}")
