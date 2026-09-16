import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import tifffile
import cv2

class SARDatasetService:
    """
    Sentinel-1 SAR Scientific Dataset Service (Zenodo Part I/II/III).
    Reads real 2048x2048 dual-polarization (VV + VH, float32 dB) georeferenced SAR scenes
    and their corresponding binary/multi-class ground-truth masks.
    """

    def __init__(self, data_root: Optional[str] = None):
        if data_root is None:
            self.data_root = Path(__file__).resolve().parent.parent.parent.parent / "data"
        else:
            self.data_root = Path(data_root)
            
        self.test_dir = self.data_root / "02_Test_images_and_ground_truth" / "Images"
        self.test_mask_dir = self.data_root / "02_Test_images_and_ground_truth" / "Mask"
        self.train_oil_dir = self.data_root / "01_Train_Val_Oil_Spill_images" / "Oil"
        self.train_lookalike_dir = self.data_root / "01_Train_Val_Lookalike_images" / "Lookalike"
        self.train_no_oil_dir = self.data_root / "01_Train_Val_No_Oil_Images" / "No_oil"

    def list_available_scenes(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Scans for available extracted SAR TIFFs across Part III Test and Part I/II Train.
        """
        scenes = {"oil": [], "lookalike": [], "no_oil": []}
        
        # Priority: Part III Test (georeferenced scenes with ground truth)
        cat_configs = [
            ("oil", self.test_dir / "Oil", self.test_mask_dir / "Oil"),
            ("lookalike", self.test_dir / "Lookalike", self.test_mask_dir / "Lookalike"),
            ("no_oil", self.test_dir / "No oil", self.test_mask_dir / "No oil")
        ]
        
        for category, img_dir, mask_dir in cat_configs:
            if img_dir.exists():
                for tiff_file in sorted(img_dir.glob("*.tif"))[:30]:
                    mask_candidate = mask_dir / f"{tiff_file.stem}_segmentation.tif"
                    has_mask = mask_candidate.exists()
                    scenes[category].append({
                        "scene_id": tiff_file.stem,
                        "filename": tiff_file.name,
                        "category": category,
                        "image_path": str(tiff_file),
                        "has_mask": has_mask,
                        "mask_path": str(mask_candidate) if has_mask else None
                    })
                    
        return scenes

    def _find_matching_mask(self, stem: str, category: str) -> Optional[Path]:
        """
        Finds ground-truth mask corresponding to a given scene stem.
        """
        search_dirs = [
            self.test_mask_dir / ("Oil" if category == "oil" else ("Lookalike" if category == "lookalike" else "No oil")),
        ]

        for d in search_dirs:
            if d.exists():
                candidate = d / f"{stem}_segmentation.tif"
                if candidate.exists():
                    return candidate
                candidate_alt = d / f"{stem}.tif"
                if candidate_alt.exists():
                    return candidate_alt
        return None

    def load_scene(self, file_path: str) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Loads a Sentinel-1 float32 dual-pol GeoTIFF.
        Returns:
            rgb_composite: uint8 (H, W, 3) image calibrated for display & UNet inference
            metadata: dict with radar polarization statistics (VV, VH, Pol-Ratio)
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"SAR TIFF not found at: {file_path}")

        raw_arr = tifffile.imread(str(path))
        metadata: Dict[str, Any] = {
            "scene_id": path.stem,
            "filename": path.name,
            "raw_shape": list(raw_arr.shape),
            "dtype": str(raw_arr.dtype)
        }

        # Handle 2-channel VV/VH float32 Sigma0 in dB
        if raw_arr.ndim == 3 and raw_arr.shape[-1] >= 2:
            vv = raw_arr[:, :, 0]
            vh = raw_arr[:, :, 1]
            
            # Radiometric stats in decibels
            metadata["vv_mean_db"] = float(np.nanmean(vv))
            metadata["vv_min_db"] = float(np.nanmin(vv))
            metadata["vv_max_db"] = float(np.nanmax(vv))
            metadata["vh_mean_db"] = float(np.nanmean(vh))
            
            # Use verified percentile normalization matching prepare_hard_negative_patches.py
            p2_vv, p98_vv = np.percentile(vv, 2), np.percentile(vv, 98)
            p2_vh, p98_vh = np.percentile(vh, 2), np.percentile(vh, 98)
            vv_norm = np.clip((vv - p2_vv) / max(p98_vv - p2_vv, 1e-4) * 255.0, 0, 255).astype(np.uint8)
            vh_norm = np.clip((vh - p2_vh) / max(p98_vh - p2_vh, 1e-4) * 255.0, 0, 255).astype(np.uint8)
            diff = np.clip(((vv - vh) - (-5.0)) / 25.0 * 255.0, 0, 255).astype(np.uint8)
            rgb_composite = np.stack([vv_norm, vh_norm, diff], axis=-1)
        elif raw_arr.ndim == 2:
            p2, p98 = np.percentile(raw_arr, 2), np.percentile(raw_arr, 98)
            norm = np.clip((raw_arr - p2) / max(p98 - p2, 1e-4) * 255.0, 0, 255).astype(np.uint8)
            rgb_composite = np.stack([norm, norm, norm], axis=-1)
        else:
            rgb_composite = cv2.normalize(raw_arr, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)

        return rgb_composite, metadata

    def load_ground_truth_mask(self, mask_path: str) -> np.ndarray:
        """
        Loads ground truth mask (uint8, values in {0, 1} or {0, 1, 2}).
        """
        path = Path(mask_path)
        if not path.exists():
            raise FileNotFoundError(f"Mask file not found at: {mask_path}")
        mask = tifffile.imread(str(path))
        return mask.astype(np.uint8)
