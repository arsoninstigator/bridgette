"""source routing: decide which reader owns an input, then hand it over.

bundle files carry no extension contract across these apps, so the router looks
at the content first and only falls back to guessing. `--from` skips the guess.
"""

from __future__ import annotations

import json
import os
import re

from .common import SPEC
from .sources import polarr, snapseed, vsco

SOURCES = {
    "polarr": polarr,
    "snapseed": snapseed,
    "vsco": vsco,
}

# words that only one of the three apps uses. polarr has by far the largest
# vocabulary, so it wins ties and any object with several canonical keys.
SNAPSEED_WORDS = (
    "snapseed", "ambience", "structure", "warmth", "tune image", "tonal contrast",
    "hdr scape", "glamour glow", "retrolux", "drama", "selective", "healing",
    "expand", "double exposure", "noir", "lens blur", "details", "sharpening",
    "black and white", "black & white", "b&w",
)
VSCO_WORDS = (
    "vsco", "recipe", "fade", "skin tone", "split tone", "definition",
    "shadow hue", "highlight hue",
)
POLARR_MARKERS = (
    "state", "curves_all", "curves_red", "local_adjustments", "sync_id",
    "filter_url", "distortion_horizontal", "blur_opacity", "mosaic_size",
    "grain_amount", "vignette_feather", "flip_x", "rotate90",
)

# a bare preset code on its own line, the way vsco recipe cards start
FILTER_CODE_LINE = re.compile(r"(?m)^\s*(?:AL|AU|A|B|C|D|E|F|G|H|J|K|M|N|O|P|Q|S|T|U|X)\d{1,2}\s*$")

IMAGE_EXTENSIONS = polarr.QR_EXTENSIONS
TEXT_EXTENSIONS = (".json", ".polarr", ".txt", ".md", ".yaml", ".yml", ".recipe", ".look")


def _as_object(text):
    try:
        obj = json.loads(text)
    except Exception:
        return None
    return obj if isinstance(obj, (dict, list)) else None


def _has_polarr_markers(obj):
    if isinstance(obj, list):
        return any(_has_polarr_markers(item) for item in obj[:20])
    if not isinstance(obj, dict):
        return False
    keys = {str(k).lower() for k in obj}
    if len(keys & set(POLARR_MARKERS)) >= 2:
        return True
    for value in obj.values():
        if isinstance(value, dict) and len({str(k).lower() for k in value} & set(POLARR_MARKERS)) >= 2:
            return True
    return False


def _count_keys(obj, wanted, depth=0):
    """How many of `wanted` appear as keys, looking one level into nested objects."""
    if depth > 2:
        return 0
    if isinstance(obj, list):
        return max((_count_keys(item, wanted, depth + 1) for item in obj[:20]), default=0)
    if not isinstance(obj, dict):
        return 0
    own = sum(1 for key in obj if str(key).lower() in wanted)
    nested = max((_count_keys(value, wanted, depth + 1) for value in obj.values()
                  if isinstance(value, (dict, list))), default=0)
    return max(own, nested)


def detect(text, obj=None):
    """Best guess at the app a chunk of text came from."""
    lowered = (text or "").lower()
    if "snapseed" in lowered:
        return "snapseed"
    if "vsco" in lowered:
        return "vsco"

    canonical = {key.lower() for key in SPEC}
    scores = {
        "snapseed": sum(1 for word in SNAPSEED_WORDS if word in lowered),
        "vsco": sum(1 for word in VSCO_WORDS if word in lowered),
        "polarr": sum(1 for word in POLARR_MARKERS if word in lowered),
    }
    if FILTER_CODE_LINE.search(text or ""):
        scores["vsco"] += 3
    if obj is not None:
        scores["polarr"] += _count_keys(obj, set(POLARR_MARKERS))
        shared = _count_keys(obj, canonical)
        if shared >= 3:
            scores["polarr"] += 3

    best = max(scores.values())
    if best == 0:
        return "polarr"
    for kind in ("snapseed", "vsco", "polarr"):
        if scores[kind] == best:
            return kind
    return "polarr"


def _label(item):
    if isinstance(item, tuple):
        return os.path.basename(item[0])
    return os.path.basename(str(item))


def _text_of(item):
    """(text, is_path) for a source item."""
    if isinstance(item, tuple):
        return item[1], False
    path = str(item)
    if os.path.exists(path):
        if path.lower().endswith(IMAGE_EXTENSIONS):
            return None, True
        with open(path, "r", encoding="utf-8-sig", errors="replace") as fh:
            return fh.read(), True
    return path, False


def read(item, kind=None):
    """Read one input into Preset objects, whichever reader owns it."""
    label = _label(item)
    text, is_path = _text_of(item)

    if kind and kind in SOURCES:
        return _read_with(kind, item, text, label)

    # images and links are polarr's territory (qr codes, share links, filter ids)
    if text is None:
        return _read_with("polarr", item, None, label)

    lowered = (text or "").strip().lower()
    if lowered.startswith(("http://", "https://")):
        if "vsco" in lowered:
            raise ValueError(
                "vsco has no public recipe api (vsco.co answers 403 to logged-out "
                "requests), so paste the recipe card text or save it as .txt/.json")
        return _read_with("polarr", item, text, label)

    obj = _as_object(text)
    if obj is None and _maybe_binary_code(text):
        return _read_with("polarr", item, text, label)

    chosen = detect(text, obj)
    return _read_with(chosen, item, text, label)


def _maybe_binary_code(text):
    """A long single-token blob is a base64 filter code, not prose."""
    stripped = (text or "").strip()
    if not stripped or any(ch.isspace() for ch in stripped[:-1] or " "):
        return False
    return len(stripped) >= 24 and stripped.startswith(("ey", "H4s", "polarr:", "filter:"))


def _read_with(kind, item, text, label):
    if kind == "polarr":
        if isinstance(item, tuple):
            source = item[1]
        elif os.path.exists(str(item)):
            source = str(item)
        else:
            source = text if text is not None else str(item)
        return polarr.parse_presets(polarr.load_json(source), label)
    if text is None:
        raise ValueError(f"{kind} input must be text, not {label}")
    return SOURCES[kind].parse(text, label)
