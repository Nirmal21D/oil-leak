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
            
        self.images_dir = self.data_root / "Images"
        self.mask_oil_dir = self.data_root / "Mask_oil"
        self.mask_lookalike_dir = self.data_root / "Mask_lookalike"
        self.mask_no_oil_dir = self.data_root / "Mask_no_oil"

    def list_available_scenes(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Scans for available extracted SAR TIFFs in data/Images and data/
        """
        scenes = {"oil": [], "lookalike": [], "no_oil": []}
        
        # Check in Images/
        if self.images_dir.exists():
            for category, subfolder in [("oil", "Oil"), ("lookalike", "Lookalike"), ("no_oil", "No oil")]:
                cat_dir = self.images_dir / subfolder
                if not cat_dir.exists():
                    cat_dir = self.images_dir / subfolder.replace(" ", "_")
                if cat_dir.exists():
                    for tiff_file in sorted(cat_dir.glob("*.tif"))[:30]:  # index top 30 per category for fast access
                        mask_path = self._find_matching_mask(tiff_file.stem, category)
                        scenes[category].append({
                            "scene_id": tiff_file.stem,
                            "filename": tiff_file.name,
                            "category": category,
                            "image_path": str(tiff_file),
                            "has_mask": mask_path is not None,
                            "mask_path": str(mask_path) if mask_path else None
                        })
        return scenes

    def _find_matching_mask(self, stem: str, category: str) -> Optional[Path]:
        """
        Finds ground-truth mask corresponding to a given scene stem.
        """
        search_dirs = []
        if category == "oil":
            search_dirs = [self.mask_oil_dir, self.images_dir / "Mask_oil", self.data_root / "02_Test_images_and_ground_truth" / "Mask_oil"]
        elif category == "lookalike":
            search_dirs = [self.mask_lookalike_dir, self.images_dir / "Mask_lookalike"]
        elif category == "no_oil":
            search_dirs = [self.mask_no_oil_dir, self.images_dir / "Mask_no_oil"]

        for d in search_dirs:
            if d.exists():
                candidate = d / f"{stem}.tif"
                if candidate.exists():
                    return candidate
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
            
            # Normalize dB ranges (-35 dB to -5 dB typical for sea surface) to [0, 255]
            vv_norm = np.clip((vv - (-35.0)) / ((-5.0) - (-35.0)) * 255.0, 0, 255).astype(np.uint8)
            vh_norm = np.clip((vh - (-40.0)) / ((-10.0) - (-40.0)) * 255.0, 0, 255).astype(np.uint8)
            
            # Polarimetric difference ratio: VV - VH isolates damping anomalies
            diff = np.clip((vv - vh - 0.0) / (20.0 - 0.0) * 255.0, 0, 255).astype(np.uint8)
            rgb_composite = np.stack([vv_norm, vh_norm, diff], axis=-1)
        elif raw_arr.ndim == 2:
            norm = np.clip((raw_arr - np.nanmin(raw_arr)) / (np.nanmax(raw_arr) - np.nanmin(raw_arr) + 1e-6) * 255.0, 0, 255).astype(np.uint8)
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
