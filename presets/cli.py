"""command line: expand inputs, convert each preset, write the xmp files."""

from __future__ import annotations

import argparse
import os
import re
import sys
import zipfile

from . import router
from .common import safe_filename, unique_path
from .targets.lightroom import build_xmp

def _is_inline_source(text):
    """A pasted URL, filter id, base64 filter code or raw JSON string."""
    text = (text or "").strip()
    if not text:
        return False
    if text.startswith(("http://", "https://", "{", "[")):
        return True
    if re.fullmatch(r"[A-Za-z0-9_-]{5,64}", text):
        return True
    return len(text) >= 24 and bool(re.fullmatch(r"[A-Za-z0-9+/=_\s-]+", text))


def gather_inputs(paths):
    """Expand files, folders and zips into a flat list of sources.

    Each source is either a path string, or a (name, text) tuple for a member
    of a zip archive.
    """
    found = []

    def expand(path):
        if os.path.isdir(path):
            for root, _dirs, files in os.walk(path):
                for f in sorted(files):
                    expand(os.path.join(root, f))
        elif path.lower().endswith(".zip"):
            with zipfile.ZipFile(path) as zf:
                for info in zf.infolist():
                    if info.is_dir() or not info.filename.lower().endswith(router.TEXT_EXTENSIONS):
                        continue
                    with zf.open(info) as fh:
                        found.append((info.filename, fh.read().decode("utf-8-sig", "replace")))
        elif os.path.exists(path):
            found.append(path)
        elif _is_inline_source(path):
            found.append(path)

    for path in paths:
        expand(path)
    return found


def convert(paths, out_dir, group="", report=False, kind=None):
    os.makedirs(out_dir, exist_ok=True)
    written = []
    errors = []
    for item in gather_inputs(paths):
        try:
            presets = router.read(item, kind=kind)
        except (ValueError, OSError, RuntimeError) as exc:
            errors.append(f"{router._label(item)}: {exc}")
            continue
        for preset in presets:
            xmp, warnings = build_xmp(preset, group=group)
            path = unique_path(out_dir, safe_filename(preset.name))
            with open(path, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(xmp)
            written.append((path, preset, warnings))
            if report:
                print(f"  {preset.name}  ->  {os.path.basename(path)}")
                for msg in warnings:
                    print(f"      note: {msg}")
                for k in sorted(preset.values):
                    value = preset.values[k]
                    shown = f"{value:.4g}" if isinstance(value, float) else value
                    print(f"      map: {k} = {shown}")
                for ch, pts in preset.curves.items():
                    print(f"      curve {ch}: {len(pts)} points")
    for message in errors:
        print(f"  skipped {message}", file=sys.stderr)
    return written


def main(argv=None):
    ap = argparse.ArgumentParser(
        prog="presets",
        description="Convert Polarr, Snapseed and VSCO looks into Lightroom .xmp presets.")
    ap.add_argument("inputs", nargs="+",
                    help="preset .json files, folders, .zip archives, QR code images, "
                         "share links, filter ids, base64 filter codes, or a pasted "
                         "Snapseed / VSCO recipe card")
    ap.add_argument("-o", "--out", default="lightroom-presets",
                    help="output folder (default: lightroom-presets)")
    ap.add_argument("-g", "--group", default="",
                    help="Lightroom preset group/folder name")
    ap.add_argument("-z", "--zip", dest="zip_path", default=None,
                    help="also write a .zip of the generated presets")
    ap.add_argument("-r", "--report", action="store_true",
                    help="print the per-preset mapping as it converts")
    ap.add_argument("-f", "--from", dest="kind", default=None,
                    choices=sorted(router.SOURCES),
                    help="force a reader instead of detecting it from the content")
    args = ap.parse_args(argv)

    for given in args.inputs:
        text = given.strip()
        if os.path.exists(text) or text.startswith(("{", "[", "http://", "https://")):
            continue
        if re.fullmatch(r"[A-Za-z0-9_-]{5,64}", text):
            continue
        if re.fullmatch(r"[A-Za-z0-9+/=_\s-]{24,}", text):
            continue
        ap.error(f"no such file: {given}")

    try:
        written = convert(args.inputs, args.out, group=args.group,
                          report=args.report, kind=args.kind)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if not written:
        print("error: nothing converted", file=sys.stderr)
        return 1

    if args.zip_path:
        with zipfile.ZipFile(args.zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for path, _preset, _warn in written:
                zf.write(path, arcname=os.path.basename(path))

    print(f"converted {len(written)} preset(s) -> {args.out}")
    if args.zip_path:
        print(f"zip: {args.zip_path}")
    print("import: Lightroom Classic > Presets panel > + > Import Presets...")
    return 0
