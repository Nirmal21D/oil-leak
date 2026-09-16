import io
import re
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import numpy as np
from PIL import Image
import tifffile
from fastapi import HTTPException

class RasterValidationError(HTTPException):
    def __init__(self, detail: str, status_code: int = 422):
        super().__init__(status_code=status_code, detail=detail)

class RasterValidator:
    """
    Validates input rasters against the AegisSea Sentinel-1 SAR inference contract.
    Guards against incompatible datatypes, dimensional errors, corrupted files,
    and ground-truth mask files accidentally uploaded for inference.
    """

    SUPPORTED_EXTENSIONS = {".tif", ".tiff", ".png", ".jpg", ".jpeg"}

    @classmethod
    def validate_and_load(
        cls,
        content: bytes,
        filename: str
    ) -> Tuple[np.ndarray, bool, Dict[str, Any], Optional[tifffile.TiffFile]]:
        """
        Validates raw bytes and loads a normalized 3-channel tensor image array.
        Returns:
            normalized_array: uint8 (H, W, 3) ready for TileSlidingInference
            is_tiff: bool
            metadata: dict with raw properties
            tif_obj: opened TiffFile if TIFF, else None
        """
        if not content or len(content) == 0:
            raise RasterValidationError("Empty file uploaded. Please select a valid raster file.", status_code=400)

        ext = Path(filename).suffix.lower()
        if ext not in cls.SUPPORTED_EXTENSIONS:
            raise RasterValidationError(
                f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(cls.SUPPORTED_EXTENSIONS))}",
                status_code=400
            )

        is_tiff = ext in {".tif", ".tiff"}

        if is_tiff:
            try:
                bio = io.BytesIO(content)
                tif = tifffile.TiffFile(bio)
                page = tif.pages[0]
                raw = page.asarray()
            except Exception as e:
                raise RasterValidationError(f"Corrupted or unreadable GeoTIFF raster: {str(e)}", status_code=400)

            # 1. Structural Ground-Truth Mask Guard
            # Check filename heuristic
            is_mask_named = bool(re.search(r"(mask|segmentation)", filename, re.IGNORECASE))
            
            # Check raster intrinsic mask characteristics (single-band integer with values in {0, 1, 2, 255})
            is_mask_data = False
            if raw.ndim == 2:
                is_int_type = np.issubdtype(raw.dtype, np.integer)
                if is_int_type:
                    unique_vals = np.unique(raw[:500, :500]) # sample for speed
                    if set(unique_vals).issubset({0, 1, 2, 255}):
                        is_mask_data = True

            if is_mask_named or is_mask_data:
                raise RasterValidationError(
                    "Unsupported input raster. Please upload a Sentinel-1 SAR image from the Images dataset. "
                    "Ground-truth Mask files cannot be used for inference.",
                    status_code=422
                )

            # 2. Dimensions contract check (minimum 256x256 for sliding-window)
            H, W = raw.shape[:2]
            if H < 256 or W < 256:
                raise RasterValidationError(
                    f"Raster dimensions ({W}x{H}) are below the minimum required 256x256 tensor size.",
                    status_code=422
                )

            # 3. SAR Normalization
            normalized_array = cls._normalize_sar_array(raw)

            metadata = {
                "filename": filename,
                "format": "GeoTIFF",
                "width": int(W),
                "height": int(H),
                "raw_dtype": str(raw.dtype),
                "raw_ndim": int(raw.ndim),
                "raw_channels": int(raw.shape[-1]) if raw.ndim == 3 else 1,
            }

            # Return opened bio/tif for geospatial extraction
            bio.seek(0)
            tif_handle = tifffile.TiffFile(bio)
            return normalized_array, True, metadata, tif_handle

        else:
            # Standard PNG / JPG image
            try:
                pil_img = Image.open(io.BytesIO(content)).convert("RGB")
                img_np = np.array(pil_img)
            except Exception as e:
                raise RasterValidationError(f"Invalid image file: {str(e)}", status_code=400)

            H, W = img_np.shape[:2]
            if H < 256 or W < 256:
                raise RasterValidationError(
                    f"Image dimensions ({W}x{H}) are below the minimum required 256x256 tile size.",
                    status_code=422
                )

            metadata = {
                "filename": filename,
                "format": "RGB Image",
                "width": int(W),
                "height": int(H),
                "raw_dtype": str(img_np.dtype),
                "raw_ndim": 3,
                "raw_channels": 3,
            }

            return img_np, False, metadata, None

    @staticmethod
    def _normalize_sar_array(arr: np.ndarray) -> np.ndarray:
        """
        Normalizes SAR VV/VH float32 dB or raw arrays into calibrated 3-channel composite
        matching the U-Net training pipeline (Option 1 benchmark protocol).
        """
        if arr.ndim == 3 and arr.shape[-1] >= 2:
            vv = arr[:, :, 0].astype(np.float32)
            vh = arr[:, :, 1].astype(np.float32)
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
            return ((arr - arr.min()) / (arr.max() - arr.min() + 1e-6) * 255.0).astype(np.uint8)
