"""the shared vocabulary: preset model, value scales and key tables.

readers (sources/) and writers (targets/) both speak this vocabulary, so adding a
new source or a new target only means translating to and from it.
"""

from __future__ import annotations

import base64
import json
import os
import re

# ---------------------------------------------------------------------------
# tuning knobs (documented in README.md)
# ---------------------------------------------------------------------------

# Polarr's exposure slider at full scale (+/-1.0) lands around here in EV.
EXPOSURE_EV_AT_FULL_SCALE = 2.0

# Polarr temperature +/-1.0 -> this Kelvin window around the neutral point.
TEMP_NEUTRAL_K = 5500
TEMP_SPAN_K = 3500

# Polarr tint +/-1.0 -> Lightroom tint units (LR allows -150..150).
TINT_SPAN = 100

# Lightroom preset format version written into the file.
CRS_VERSION = "15.4"

# subtrees that hold local (masked) adjustments and must not leak into global ones
LOCAL_SUBTREES = (
    "local", "locals", "localadjust", "localadjustments", "local_adjustments",
    "mask", "masks", "brush", "brushes", "radial", "radials", "linear",
    "gradient", "gradients", "pointcolor", "pointcolors", "subject", "sky",
)

HSL_COLORS = ("red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta")

# ---------------------------------------------------------------------------
# Polarr key -> Lightroom field mapping
# ---------------------------------------------------------------------------
# kind:
#   bipolar   -1..1  -> Lightroom -100..100
#   unipolar   0..1  -> Lightroom 0..max (see `max`)
#   signed_max -1..1 -> Lightroom -max..max
#   exposure  -1..1  -> EV
#   temp/tint -1..1  -> Kelvin / tint units
#   hue        0..1  -> 0..360 degrees
#   ignore    -> recorded in the report as unmappable
SPEC = {
    # light
    "exposure": ("Exposure2012", "exposure"),
    "contrast": ("Contrast2012", "bipolar"),
    "highlights": ("Highlights2012", "bipolar"),
    "shadows": ("Shadows2012", "bipolar"),
    "whites": ("Whites2012", "bipolar"),
    "blacks": ("Blacks2012", "bipolar"),
    # presence
    "clarity": ("Clarity2012", "bipolar"),
    "texture": ("Texture", "bipolar"),
    "dehaze": ("Dehaze", "bipolar"),
    "vibrance": ("Vibrance", "bipolar"),
    "saturation": ("Saturation", "bipolar"),
    # white balance
    "temperature": ("Temperature", "temp"),
    "tint": ("Tint", "tint"),
    # detail
    "sharpen": ("Sharpness", "unipolar", 100.0),
    "luminance_denoise": ("LuminanceSmoothing", "unipolar", 100.0),
    "color_denoise": ("ColorNoiseReduction", "unipolar", 100.0),
    # effects
    "vignette": ("PostCropVignetteAmount", "bipolar"),
    "vignette_roundness": ("PostCropVignetteRoundness", "bipolar"),
    "vignette_feather": ("PostCropVignetteFeather", "unipolar", 100.0),
    "vignette_midpoint": ("PostCropVignetteMidpoint", "unipolar", 100.0),
    "grain_amount": ("GrainAmount", "unipolar", 100.0),
    "grain_size": ("GrainSize", "unipolar", 100.0),
    "grain_roughness": ("GrainFrequency", "unipolar", 100.0),
    # colour grading (Lightroom 10+ colour grading panel)
    "highlights_hue": ("ColorGradeHighlightHue", "hue"),
    "highlights_saturation": ("ColorGradeHighlightSat", "unipolar", 100.0),
    "shadows_hue": ("ColorGradeShadowHue", "hue"),
    "shadows_saturation": ("ColorGradeShadowSat", "unipolar", 100.0),
    "midtone_hue": ("ColorGradeMidtoneHue", "hue"),
    "midtone_saturation": ("ColorGradeMidtoneSat", "unipolar", 100.0),
    "balance": ("ColorGradeBalance", "bipolar"),
}

# black and white mixer (lightroom's grayscale panel)
for _c in HSL_COLORS:
    SPEC[f"gray_mixer_{_c}"] = (f"GrayMixer{_c.capitalize()}", "bipolar")

# HSL gets generated from the eight colour names
for _c in HSL_COLORS:
    SPEC[f"hue_{_c}"] = (f"HueAdjustment{_c.capitalize()}", "bipolar")
    SPEC[f"saturation_{_c}"] = (f"SaturationAdjustment{_c.capitalize()}", "bipolar")
    SPEC[f"luminance_{_c}"] = (f"LuminanceAdjustment{_c.capitalize()}", "bipolar")

# aliases seen across Polarr builds / third-party exports
ALIASES = {
    "temp": "temperature",
    "exposure_ev": "exposure",
    "brightness": "exposure",
    "fade": "blacks",
    "sharpness": "sharpen",
    "sharpening": "sharpen",
    "diffusion": "texture",
    "vignetteamount": "vignette",
    "vignette_amount": "vignette",
    "vignette_feather_amount": "vignette_feather",
    "grain": "grain_amount",
    "grainamt": "grain_amount",
    "grainsize": "grain_size",
    "grain_frequency": "grain_roughness",
    "noise": "luminance_denoise",
    "luminance_noise_reduction": "luminance_denoise",
    "luminance_denoise_amount": "luminance_denoise",
    "color_noise_reduction": "color_denoise",
    "color_noise": "color_denoise",
    "denoise": "luminance_denoise",
    "highlight_hue": "highlights_hue",
    "highlight_saturation": "highlights_saturation",
    "shadow_hue": "shadows_hue",
    "shadow_saturation": "shadows_saturation",
    "grading_balance": "balance",
    "split_balance": "balance",
    "hue_magenta": "hue_magenta",
    "yellow_hue": "hue_yellow",
    "yellow_saturation": "saturation_yellow",
    "yellow_luminance": "luminance_yellow",
}

# names worth trying at the top of the JSON
NAME_KEYS = ("name", "preset_name", "presetname", "filter_name", "filtername",
             "title", "label", "preset")

# things we can see but cannot carry across
UNSUPPORTED_KEYS = {
    "lut", "luts", "lut_id", "lutname", "filter_id", "filterid", "profile",
    "profile_url", "ai_style", "aistyle", "distortion_horizontal",
    "distortion_vertical", "perspective_vertical", "perspective_horizontal",
    "fringing", "chromatic_aberration", "crop", "orientation", "flipx", "flipy",
    "mosaic_size", "mosaic_pattern", "gamma", "diffuse", "localadjustments",
    "rotate90", "flip_x", "flip_y", "distortion_amount", "blur", "blur_opacity",
    "grid_size", "spots", "face_features", "text", "render_watermark",
    "vignette_size", "vignette_highlights", "shadow_tint", "red_hue",
}


def norm_key(key: str) -> str:
    """lowercase, collapse punctuation to single underscores."""
    k = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", str(key).strip())
    k = re.sub(r"[\s\-./]+", "_", k).lower()
    k = re.sub(r"[^a-z0-9_]", "", k)
    k = re.sub(r"_+", "_", k).strip("_")
    return ALIASES.get(k, k)


def is_local_key(key: str) -> bool:
    n = norm_key(key)
    return any(n == s or n.startswith(s) or n.endswith(s) for s in LOCAL_SUBTREES)



# ---------------------------------------------------------------------------
# the canonical space every source converts into
# ---------------------------------------------------------------------------
# Preset.values holds canonical fractions, never a source's own units:
#
#   bipolar keys   -1.0 .. +1.0          (lightroom -100..100)
#   unipolar keys   0.0 .. +1.0          (lightroom 0..max)
#   hue keys        0.0 .. +1.0 of a turn
#
# A reader divides its own slider range by that range's full scale; the
# lightroom writer multiplies back out. That is the whole contract, so a new
# source is a table of ranges, not a new pipeline.


def clamp(value, low=-1.0, high=1.0):
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    if low > v:
        return low
    if high < v:
        return high
    return v


def clamp_canonical(key, value):
    """Clamp into the range the lightroom writer expects for that key."""
    spec = SPEC.get(key)
    kind = spec[1] if spec else "bipolar"
    if kind == "unipolar":
        return clamp(value, 0.0, 1.0)
    if kind == "hue":
        return clamp(value, 0.0, 1.0)
    if kind == "temp":
        return clamp(value, -1.0, 1.0)
    return clamp(value, -1.0, 1.0)


def fraction(value, full_scale=100.0):
    """A reading as the app shows it -> canonical fraction (-1..1 or 0..1)."""
    try:
        v = float(str(value).replace(",", ".").strip())
    except (TypeError, ValueError):
        return None
    if not full_scale:
        return None
    return v / float(full_scale)


def alias_regex(names):
    """`tool value` pairs in prose, matched on the app's own words."""
    ordered = sorted(set(names), key=len, reverse=True)
    body = "|".join(re.escape(n) for n in ordered)
    return re.compile(r"\b(" + body + r")\b\s*[:=]?\s*([+-]?\d+(?:[.,]\d+)?)",
                      re.IGNORECASE)


def make_preset(name, values, curves=None, source="", notes=None):
    clean = {}
    for key, value in (values or {}).items():
        if value is None:
            continue
        if key.startswith("__"):  # pseudo keys the writer understands
            clean[key] = value
            continue
        if key not in SPEC:
            continue
        clamped = clamp_canonical(key, value)
        if clamped is not None:
            clean[key] = clamped
    return Preset(name, clean, curves or {}, source, list(notes or []))


# ---------------------------------------------------------------------------
# reading presets
# ---------------------------------------------------------------------------

class Preset:
    def __init__(self, name, values, curves, source, notes):
        self.name = name            # display name
        self.values = values        # canonical polarr key -> raw number
        self.curves = curves        # "rgb"/"red"/... -> [(x, y)] in 0..255
        self.source = source
        self.notes = notes          # unmapped / skipped keys

    def __repr__(self):
        return f"<Preset {self.name!r} {len(self.values)} values>"


def _maybe_decode_code(text: str):
    """A Polarr filter code: base64 (sometimes urlsafe, sometimes prefixed)."""
    s = text.strip().strip('"').strip("'")
    if len(s) < 24:
        return None
    candidates = [s]
    for prefix in ("polarr:", "filter:", "POLARR:"):
        if s.startswith(prefix):
            candidates.append(s[len(prefix):])
    for c in candidates:
        for alt in (c, c.replace("-", "+").replace("_", "/")):
            pad = alt + "=" * (-len(alt) % 4)
            try:
                raw = base64.b64decode(pad, validate=False)
            except Exception:
                continue
            try:
                obj = json.loads(raw.decode("utf-8"))
            except Exception:
                continue
            if isinstance(obj, (dict, list)):
                return obj
    return None


def _norm(v: float) -> float:
    """Detect scale: Polarr stores -1..1, but some exports store -100..100."""
    if abs(v) > 1.5:
        v = v / 100.0
    return max(-1.0, min(1.0, v))

# ---------------------------------------------------------------------------

BAD_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def safe_filename(name: str) -> str:
    name = BAD_CHARS.sub("", name).strip(" .")
    name = re.sub(r"\s+", " ", name)
    return name or "preset"


def unique_path(folder, base):
    path = os.path.join(folder, f"{base}.xmp")
    i = 2
    while os.path.exists(path):
        path = os.path.join(folder, f"{base} {i}.xmp")
        i += 1
    return path

