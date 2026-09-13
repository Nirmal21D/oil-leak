#!/usr/bin/env python3
"""
fetch_oil_spill_datasets.py

Downloads, MD5-verifies, and extracts the Zenodo Sentinel-1 SAR Oil Spill
datasets used for SIH PS 26143 (Marine Oil Spill Detection & Vessel Attribution).

Usage examples:
    python fetch_oil_spill_datasets.py --list
    python fetch_oil_spill_datasets.py --set sos_refined            # smallest, start here
    python fetch_oil_spill_datasets.py --set part3                  # test set, pipeline wiring
    python fetch_oil_spill_datasets.py --set part1                  # main training set (40.7 GB)
    python fetch_oil_spill_datasets.py --set part2                  # no-oil + lookalike (45.9 GB)
    python fetch_oil_spill_datasets.py --set part1 --no-extract     # download only, skip extraction
    python fetch_oil_spill_datasets.py --set all --out ./data

Requires: requests, tqdm, py7zr (for extraction)
    pip install requests tqdm py7zr

Notes:
- Downloads are resumable: if a partial file exists, the script resumes via HTTP Range.
- Every file's MD5 is verified against Zenodo's published checksum before extraction.
- .7z archives are extracted with py7zr (pure Python, no system 7z binary required).
- These are large files. Free disk space before running part1/part2 (need ~90 GB free
  for both, plus extraction headroom -- extracted TIFFs are roughly the same size again).
"""

import argparse
import hashlib
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Missing dependency: pip install requests")

try:
    from tqdm import tqdm
except ImportError:
    tqdm = None  # progress bar is optional


# ---------------------------------------------------------------------------
# Dataset registry -- verified directly against the live Zenodo records
# (zenodo.org/records/8346860, 8253899, 13761290, 15298010) on 2026-09-12.
# ---------------------------------------------------------------------------

DATASETS = {
    "sos_refined": {
        "label": "Refined Deep-SAR Oil Spill (SOS) -- 1.2 GB total, START HERE",
        "doi": "10.5281/zenodo.15298010",
        "files": [
            {
                "name": "images.zip",
                "url": "https://zenodo.org/records/15298010/files/images.zip?download=1",
                "md5": "e5272875611e8b5a2a0d49972224c842",
                "size_hint": "1.1 GB",
            },
            {
                "name": "masks.zip",
                "url": "https://zenodo.org/records/15298010/files/masks.zip?download=1",
                "md5": "09c8a279603c8d7b73c6dc64f91e1106",
                "size_hint": "28.3 MB",
            },
        ],
    },
    "part3": {
        "label": "Part III -- Test set, 150/150/150 oil+no-oil+lookalike -- 9.9 GB, pipeline wiring only",
        "doi": "10.5281/zenodo.13761290",
        "files": [
            {
                "name": "02_Test_images_and_ground_truth.7z",
                "url": "https://zenodo.org/records/13761290/files/02_Test_images_and_ground_truth.7z?download=1",
                "md5": "5dce64cd7ff9d80189d13504bd3bcbf5",
                "size_hint": "9.9 GB",
            },
        ],
    },
    "part1": {
        "label": "Part I -- 1200 oil-spill train/val images + masks -- 40.7 GB, main training set",
        "doi": "10.5281/zenodo.8346860",
        "files": [
            {
                "name": "01_Train_Val_Oil_Spill_images.7z",
                "url": "https://zenodo.org/records/8346860/files/01_Train_Val_Oil_Spill_images.7z?download=1",
                "md5": "e2a6a5b473ca587474d8daee9cd54e10",
                "size_hint": "40.7 GB",
            },
            {
                "name": "01_Train_Val_Oil_Spill_mask.7z",
                "url": "https://zenodo.org/records/8346860/files/01_Train_Val_Oil_Spill_mask.7z?download=1",
                "md5": "9bc53c38db2ab82d15bf6914352403ef",
                "size_hint": "6.2 MB",
            },
        ],
    },
    "part2": {
        "label": "Part II -- 685 no-oil + 685 lookalike train/val images + masks -- 45.9 GB",
        "doi": "10.5281/zenodo.8253899",
        "files": [
            {
                "name": "01_Train_Val_Lookalike_images.7z",
                "url": "https://zenodo.org/records/8253899/files/01_Train_Val_Lookalike_images.7z?download=1",
                "md5": "e0af26e0b2ad7979b889a91ed5df9a41",
                "size_hint": "23.0 GB",
            },
            {
                "name": "01_Train_Val_Lookalike_mask.7z",
                "url": "https://zenodo.org/records/8253899/files/01_Train_Val_Lookalike_mask.7z?download=1",
                "md5": "ed7370a3dac9fff9287b5254349fdc26",
                "size_hint": "426.8 kB",
            },
            {
                "name": "01_Train_Val_No_Oil_Images.7z",
                "url": "https://zenodo.org/records/8253899/files/01_Train_Val_No_Oil_Images.7z?download=1",
                "md5": "6836df2bea59ebb73479ffea71828e14",
                "size_hint": "22.9 GB",
            },
            {
                "name": "01_Train_Val_No_Oil_mask.7z",
                "url": "https://zenodo.org/records/8253899/files/01_Train_Val_No_Oil_mask.7z?download=1",
                "md5": "1b152ee4dd93173015197d0a82b2c864",
                "size_hint": "416.7 kB",
            },
        ],
    },
}


def download_file(url: str, dest: Path, expected_md5: str, max_retries: int = 5) -> None:
    """Resumable download with progress bar and retry loop for transient Zenodo timeouts."""
    if dest.exists() and verify_md5(dest, expected_md5, quiet=True):
        print(f"  [ok] {dest.name} already downloaded and verified, skipping.")
        return

    import time
    for attempt in range(1, max_retries + 1):
        try:
            resume_pos = dest.stat().st_size if dest.exists() else 0
            headers = {"Range": f"bytes={resume_pos}-"} if resume_pos else {}

            with requests.get(url, headers=headers, stream=True, timeout=120) as r:
                if r.status_code not in (200, 206):
                    r.raise_for_status()
                total = int(r.headers.get("content-length", 0)) + resume_pos
                mode = "ab" if resume_pos else "wb"
                with open(dest, mode) as f:
                    progress = None
                    if tqdm is not None:
                        progress = tqdm(
                            total=total, initial=resume_pos, unit="B", unit_scale=True,
                            desc=dest.name,
                        )
                    for chunk in r.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            f.write(chunk)
                            if progress:
                                progress.update(len(chunk))
                    if progress:
                        progress.close()

            if verify_md5(dest, expected_md5):
                return
            else:
                print(f"  [warn] Checksum mismatch on attempt {attempt}/{max_retries}. Retrying...")
        except Exception as e:
            print(f"  [warn] Download attempt {attempt}/{max_retries} failed ({e}). Retrying in {attempt * 3}s...")
            time.sleep(attempt * 3)

    if not verify_md5(dest, expected_md5):
        raise RuntimeError(
            f"Checksum mismatch for {dest.name} -- re-download required after {max_retries} attempts."
        )


def verify_md5(path: Path, expected: str, quiet: bool = False) -> bool:
    if not path.exists():
        return False
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    ok = h.hexdigest() == expected
    if not quiet:
        status = "OK" if ok else "MISMATCH"
        print(f"  [{status}] md5 {dest_name(path)}: {h.hexdigest()} (expected {expected})")
    return ok


def dest_name(path: Path) -> str:
    return path.name


def extract_7z(path: Path, out_dir: Path) -> None:
    try:
        import py7zr
    except ImportError:
        print(f"  [skip] py7zr not installed -- leaving {path.name} un-extracted. "
              f"Run: pip install py7zr")
        return
    print(f"  extracting {path.name} ...")
    with py7zr.SevenZipFile(path, mode="r") as z:
        z.extractall(path=out_dir)
    print(f"  done -> {out_dir}")


def extract_zip(path: Path, out_dir: Path) -> None:
    import zipfile
    print(f"  extracting {path.name} ...")
    with zipfile.ZipFile(path, "r") as z:
        z.extractall(path=out_dir)
    print(f"  done -> {out_dir}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--set", choices=list(DATASETS.keys()) + ["all"],
                         help="Which dataset to fetch")
    parser.add_argument("--out", default="./oil_spill_data", help="Output directory")
    parser.add_argument("--no-extract", action="store_true", help="Download only, skip extraction")
    parser.add_argument("--list", action="store_true", help="List available dataset sets and exit")
    args = parser.parse_args()

    if args.list or not args.set:
        print("\nAvailable --set values:\n")
        for key, info in DATASETS.items():
            print(f"  {key:15s} {info['label']}  (DOI {info['doi']})")
        print("\nExample: python fetch_oil_spill_datasets.py --set sos_refined\n")
        return

    targets = list(DATASETS.keys()) if args.set == "all" else [args.set]
    out_root = Path(args.out)
    out_root.mkdir(parents=True, exist_ok=True)

    for key in targets:
        info = DATASETS[key]
        set_dir = out_root / key
        set_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n=== {key}: {info['label']} ===")
        for file_info in info["files"]:
            dest = set_dir / file_info["name"]
            print(f"-> {file_info['name']} ({file_info['size_hint']})")
            download_file(file_info["url"], dest, file_info["md5"])
            if not args.no_extract:
                if dest.suffix == ".7z":
                    extract_7z(dest, set_dir)
                elif dest.suffix == ".zip":
                    extract_zip(dest, set_dir)

    print("\nAll requested datasets are downloaded and verified.")
    print(f"Data is in: {out_root.resolve()}")


if __name__ == "__main__":
    main()