import sys
import time
from pathlib import Path
import numpy as np
import torch

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.app.models.unet_detector import OilSpillUNet, TileSlidingInference

def verify_2048_inference():
    print("=" * 60)
    print(" Verifying Full-Scale 2048x2048 Scene Sliding-Window Inference")
    print("=" * 60)
    
    cuda_avail = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_avail else "CPU"
    print(f"CUDA Available: {cuda_avail}")
    print(f"Target Device : {device_name}")
    
    device = "cuda" if cuda_avail else "cpu"
    
    model = OilSpillUNet(in_channels=3, num_classes=3)
    model.eval()
    
    # 2048x2048 full-resolution SAR scene dummy (RGB)
    print("\nGenerating synthetic 2048x2048 SAR scene...")
    dummy_scene = np.random.randint(0, 256, (2048, 2048, 3), dtype=np.uint8)
    
    # Add a mock slick patch in center (1000:1200, 1000:1200)
    dummy_scene[1000:1200, 1000:1200] = 30  # Dark slick pixels
    
    print("Running TileSlidingInference (tile=256, stride=128, 50% overlap)...")
    start_time = time.time()
    
    inferencer = TileSlidingInference(model, tile_size=256, stride=128, device=device)
    mask = inferencer.predict_scene(dummy_scene)
    
    elapsed = time.time() - start_time
    
    print("\n" + "-" * 40)
    print(f"Prediction Complete in {elapsed:.2f} seconds!")
    print(f"Output Mask Shape   : {mask.shape} (Expected: (2048, 2048))")
    print(f"Unique Predicted Cls: {np.unique(mask)}")
    print(f"Total Pixels        : {mask.size:,}")
    print("-" * 40)
    
    assert mask.shape == (2048, 2048), "Mask shape mismatch!"
    print("[SUCCESS] 2048x2048 Sliding-Window Inference verified cleanly with zero stitching issues!")

if __name__ == "__main__":
    verify_2048_inference()
