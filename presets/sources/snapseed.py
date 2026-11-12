"""snapseed reader.

snapseed has no preset export at all: looks live inside the app and cannot be
sent anywhere as a file. so what porter reads here is the app's own vocabulary
written down, which is how snapseed looks are actually shared (a screenshot of
the tool values, a note in a chat, a json file in the same shape):

    Tune Image: brightness +20, contrast -15, saturation +10,
                ambience +30, highlights -40, shadows +25, warmth +5
    Details: structure +30, sharpening +10
    Grain: 20
    Vignette: 30

every snapseed slider is read on its own -100..100 scale and divided by 100.

the honest part: snapseed's tools are not lightroom controls. ambience, structure
and tonal contrast are local-contrast engines with no single equivalent, so they
are spread across the closest lightroom controls (see MAPPING below) and the
result is an approximation of the look, not a port of the engine. tools with no
equivalent at all (hdr scape, drama, glamour glow, vintage, retrolux, grain
variants, lens blur, healing, selective masks, double exposure, frames, text,
expand, perspective) are reported as skipped rather than guessed at.
"""

from __future__ import annotations

import json
import re

from ..common import alias_regex, fraction, make_preset

# features that change pixels in ways a lightroom preset cannot express
UNSUPPORTED = {
    "hdr scape": "hdr scape is a tone-mapping engine, no lightroom equivalent",
    "drama": "drama is a tone-mapping engine, no lightroom equivalent",
    "glamour glow": "glamour glow diffuses highlights locally, no lightroom equivalent",
    "vintage": "vintage is a composite of film effects, no single lightroom equivalent",
    "retrolux": "retrolux adds light leaks and scratches, no lightroom equivalent",
    "grunge": "grunge is a composite texture effect, no lightroom equivalent",
    "lens blur": "lens blur is a depth mask, lightroom presets carry no masks",
    "selective": "selective edits are local masks, lightroom presets carry no masks",
    "healing": "healing is pixel retouching, not a look",
    "double exposure": "double exposure blends two frames, not a look",
    "frame": "frames are not part of a lightroom preset",
    "text": "text overlays are not part of a lightroom preset",
    "expand": "expand invents pixels, not a look",
    "perspective": "perspective correction is geometric, not a look",
    "noir": "noir is a composite black and white effect, no single lightroom equivalent",
}

# snapseed control -> lightroom contributions.
# each entry: canonical key -> weight, so one slider can feed several controls.
# numbers are the fraction of that lightroom control at snapseed +/-100.
MAPPING = {
    # tune image
    "brightness": {"exposure": 1.0},        # +/-100 -> +/-2 EV, lightroom's full model scale
    "contrast": {"contrast": 1.0},
    "saturation": {"saturation": 1.0},
    "ambience": {"shadows": 0.55, "clarity": 0.2},
    "highlights": {"highlights": 1.0},
    "shadows": {"shadows": 1.0},
    "warmth": {"temperature": 1.0},         # +/-100 -> +/-3500 K, same window as polarr
    "temperature": {"temperature": 1.0},
    "tint": {"tint": 1.0},
    "black point": {"blacks": -1.0},        # lifting the black point lowers lightroom blacks
    # details
    "structure": {"texture": 0.6, "clarity": 0.35},
    "sharpening": {"sharpen": 1.0},
    "sharpness": {"sharpen": 1.0},
    # grain
    "grain": {"grain_amount": 1.0},
    "grain strength": {"grain_amount": 1.0},
    "grain size": {"grain_size": 1.0},
    # vignette: snapseed darkens as strength rises, lightroom darkens on negatives
    "vignette": {"vignette": -1.0},
    "vignette strength": {"vignette": -1.0},
    "vignette inner brightness": {"vignette_midpoint": -1.0},
    "vignette outer brightness": {"vignette_feather": 1.0},
    # tonal contrast
    "tonal contrast highlights": {"highlights": 0.4},
    "tonal contrast midtones": {"clarity": 0.4},
    "tonal contrast shadows": {"shadows": 0.4},
    "tonal contrast saturation": {"saturation": 0.5},
    # white balance tool
    "white balance temperature": {"temperature": 1.0},
    "white balance tint": {"tint": 1.0},
}

# snapseed's black and white colour filters -> lightroom grayscale mixer
BW_FILTERS = {
    "neutral": {},
    "red": {"gray_mixer_red": 0.85, "gray_mixer_orange": 0.2},
    "orange": {"gray_mixer_orange": 0.85, "gray_mixer_red": 0.25},
    "yellow": {"gray_mixer_yellow": 0.8, "gray_mixer_orange": 0.3},
    "green": {"gray_mixer_green": 0.75, "gray_mixer_yellow": 0.2},
    "blue": {"gray_mixer_blue": 0.8, "gray_mixer_aqua": 0.2},
}

ALIASES_ALL = sorted(set(MAPPING) | set(UNSUPPORTED), key=len, reverse=True)
PAIR_RE = alias_regex(ALIASES_ALL)
CURVE_RE = re.compile(
    r"(?i)\bcurves?\b(?:\s+(red|green|blue|rgb|master))?\s*[:=]?\s*([^\n]*)")
BW_RE = re.compile(r"(?i)\b(black\s*(?:&|and)\s*white|b&w|monochrome)\b")


def looks_like(obj_or_text):
    text = obj_or_text if isinstance(obj_or_text, str) else json.dumps(obj_or_text)
    lowered = text.lower()
    if "snapseed" in lowered:
        return True
    hits = sum(1 for word in ("ambience", "structure", "warmth", "tune image",
                              "sharpening", "hdr scape", "tonal contrast")
               if word in lowered)
    return hits >= 2


def _tool_container(obj):
    if not isinstance(obj, dict):
        return {}
    for key in ("tools", "adjustments", "settings", "values", "tune", "look", "edits"):
        inner = obj.get(key)
        if isinstance(inner, dict):
            merged = dict(obj)
            merged.pop(key, None)
            merged.update(inner)
            return merged
    return obj


def _contrib(values, mapping, magnitude):
    for key, weight in mapping.items():
        values[key] = values.get(key, 0.0) + weight * magnitude


def _values_from_obj(obj):
    values = {}
    notes = []
    container = _tool_container(obj)
    if isinstance(obj, dict):
        for marker in ("snapseed", "look", "name", "title", "preset"):
            if isinstance(obj.get(marker), (str, dict)) and marker != "look":
                container.pop(marker, None)
    for key, raw in container.items():
        alias = re.sub(r"\s+", " ", str(key).strip().lower().replace("_", " ").replace("-", " "))
        if alias in {"grain", "vignette", "details", "tune image", "tune"} and isinstance(raw, dict):
            for sub, sub_value in raw.items():
                sub_alias = re.sub(r"\s+", " ", str(sub).strip().lower().replace("_", " "))
                if sub_alias in MAPPING:
                    magnitude = fraction(sub_value, 100.0)
                    if magnitude is not None:
                        _contrib(values, MAPPING[sub_alias], magnitude)
                else:
                    notes.append(sub_alias)
            continue
        if alias in ("black and white", "black_and_white", "black white", "bw", "b w", "monochrome"):
            values["__grayscale__"] = True
            if isinstance(raw, dict):
                for sub, sub_value in raw.items():
                    sub_alias = re.sub(r"\s+", " ", str(sub).strip().lower().replace("_", " "))
                    if sub_alias in ("filter", "colour filter", "color filter", "tone"):
                        chosen = str(sub_value).strip().lower()
                        if chosen in BW_FILTERS:
                            for mixer, weight in BW_FILTERS[chosen].items():
                                values[mixer] = values.get(mixer, 0.0) + weight
                        else:
                            notes.append(f"b&w filter {chosen}")
                    elif sub_alias in MAPPING:
                        magnitude = fraction(sub_value, 100.0)
                        if magnitude is not None:
                            _contrib(values, MAPPING[sub_alias], magnitude)
                    else:
                        notes.append(sub_alias)
            continue
        if alias in UNSUPPORTED:
            notes.append(UNSUPPORTED[alias])
            continue
        if alias not in MAPPING:
            notes.append(alias)
            continue
        magnitude = fraction(raw, 100.0)
        if magnitude is None:
            notes.append(alias)
            continue
        _contrib(values, MAPPING[alias], magnitude)
    return values, notes


def _parse_curves(text):
    """`curves 0,0 64,70 128,140 255,255`, optionally per channel."""
    curves = {}
    for match in CURVE_RE.finditer(text):
        channel = (match.group(1) or "rgb").lower()
        channel = "rgb" if channel == "master" else channel
        pairs = []
        for chunk in re.split(r"[;\s]+", (match.group(2) or "").strip()):
            chunk = chunk.strip(" ,")
            if not chunk:
                continue
            parts = [part for part in re.split(r"[,:]", chunk) if part.strip()]
            if len(parts) != 2:
                continue
            try:
                x, y = float(parts[0]), float(parts[1])
            except ValueError:
                continue
            if 0 <= x <= 255 and 0 <= y <= 255:
                pairs.append((x, y))
        if len(pairs) >= 2:
            curves[channel] = sorted(pairs)
    return curves


def _values_from_text(text):
    values = {}
    notes = []
    if BW_RE.search(text):
        values["__grayscale__"] = True
        for name, mix in BW_FILTERS.items():
            if name != "neutral" and re.search(r"\bfilter\s*[:=]?\s*" + name + r"\b", text, re.I):
                for mixer, weight in mix.items():
                    values[mixer] = values.get(mixer, 0.0) + weight
    for match in PAIR_RE.finditer(text):
        alias = re.sub(r"\s+", " ", match.group(1).strip().lower())
        if alias in UNSUPPORTED:
            if UNSUPPORTED[alias] not in notes:
                notes.append(UNSUPPORTED[alias])
            continue
        if alias not in MAPPING:
            continue
        magnitude = fraction(match.group(2), 100.0)
        if magnitude is None:
            continue
        _contrib(values, MAPPING[alias], magnitude)
    for alias, reason in UNSUPPORTED.items():
        if alias in ("hdr scape", "drama", "glamour glow", "vintage", "retrolux",
                     "noir", "selective", "lens blur") and reason not in notes:
            if re.search(r"\b" + re.escape(alias) + r"\b", text.lower()):
                notes.append(reason)
    return values, notes


def _name_from(text, obj=None):
    if isinstance(obj, dict):
        for key in ("name", "look", "title", "preset"):
            value = obj.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    for match in re.finditer(r"(?im)^\s*(?:look|name|preset)\s*[:=]\s*(.+)$", text):
        candidate = match.group(1).strip().strip('"').strip("'")
        if candidate:
            return candidate
    return None


def parse(text_or_obj, source="", name=None):
    if isinstance(text_or_obj, list):
        out = []
        for item in text_or_obj:
            out.extend(parse(item, source, name))
        return out

    if isinstance(text_or_obj, dict):
        values, notes = _values_from_obj(text_or_obj)
        preset_name = name or _name_from("", text_or_obj) or "Snapseed Look"
        if not values:
            raise ValueError(f"no recognised snapseed tools in {source or 'input'}")
        return [make_preset(preset_name, values, None, source or "snapseed", notes)]

    text = (text_or_obj or "").strip()
    if not text:
        raise ValueError("empty snapseed look")
    if text.startswith(("{", "[")):
        return parse(json.loads(text), source, name)

    values, notes = _values_from_text(text)
    curves = _parse_curves(text)
    if not values and not curves:
        raise ValueError(f"no recognised snapseed tools in {source or 'input'}")
    preset_name = name or _name_from(text) or "Snapseed Look"
    return [make_preset(preset_name, values, curves, source or "snapseed", notes)]
