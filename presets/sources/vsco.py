"""vsco reader.

vsco ships no preset export format and no public recipe api (vsco.co answers
403 to unauthenticated requests), so a vsco look reaches porter the way people
actually pass them around: the recipe card as text, a pasted settings list, or a
json file in the same shape. the numbers are read exactly as the app shows them
and divided by the slider range in RANGES below.

the ranges are calibrated to the vsco app as of 2026; they are constants, not
mysteries. if your build shows a different scale, edit the table and every
conversion follows.

a vsco recipe is usually a preset code plus slider readouts:

    A6
    Exposure +1.5
    Contrast +2
    Saturation -1
    Fade +6
    Grain +4
    Vignette +3

or the same thing as json:

    {"filter": "A6", "tools": {"exposure": 1.5, "contrast": 2, "fade": 6}}
"""

from __future__ import annotations

import json
import re

from ..common import alias_regex, fraction, make_preset

# value in the app that counts as a full push on that slider
RANGES = {
    "exposure": 2.0,        # exposure reads in EV
    "contrast": 6.0,
    "saturation": 6.0,
    "temperature": 6.0,
    "tint": 6.0,
    "highlights": 6.0,
    "shadows": 6.0,
    "clarity": 6.0,
    "definition": 6.0,
    "fade": 12.0,
    "grain": 12.0,
    "vignette": 12.0,
    "sharpen": 12.0,
    "skin_tone": 6.0,
}

HSL_BANDS = ("red", "orange", "yellow", "green", "aqua", "blue", "purple", "magenta")


def _tool_table():
    """alias -> (canonical key, sign, range name)"""
    table = {
        "exposure": ("exposure", 1, "exposure"),
        "brightness": ("exposure", 1, "exposure"),
        "contrast": ("contrast", 1, "contrast"),
        "saturation": ("saturation", 1, "saturation"),
        "temperature": ("temperature", 1, "temperature"),
        "temp": ("temperature", 1, "temperature"),
        "tint": ("tint", 1, "tint"),
        "highlights": ("highlights", 1, "highlights"),
        "shadows": ("shadows", 1, "shadows"),
        "clarity": ("clarity", 1, "clarity"),
        "definition": ("texture", 1, "definition"),
        "texture": ("texture", 1, "definition"),
        "sharpen": ("sharpen", 1, "sharpen"),
        "sharpening": ("sharpen", 1, "sharpen"),
        "fade": ("blacks", 1, "fade"),
        "grain": ("grain_amount", 1, "grain"),
        "grain size": ("grain_size", 1, "grain"),
        # vsco's vignette darkens corners as it rises; lightroom darkens on
        # negative amounts, so the sign flips.
        "vignette": ("vignette", -1, "vignette"),
        # split tone: vsco gives hue in degrees plus a strength
        "shadow hue": ("shadows_hue", 1, None),
        "highlight hue": ("highlights_hue", 1, None),
        "shadow saturation": ("shadows_saturation", 1, "skin_tone"),
        "highlight saturation": ("highlights_saturation", 1, "skin_tone"),
        "split balance": ("balance", 1, "skin_tone"),
    }
    for band in HSL_BANDS:
        table[f"{band} hue"] = (f"hue_{band}", 1, "hsl")
        table[f"{band} saturation"] = (f"saturation_{band}", 1, "hsl")
        table[f"{band} sat"] = (f"saturation_{band}", 1, "hsl")
        table[f"{band} luminance"] = (f"luminance_{band}", 1, "hsl")
        table[f"{band} lum"] = (f"luminance_{band}", 1, "hsl")
    return table


TOOLS = _tool_table()
HSL_RANGE = 6.0

# vsco has no equivalent for these; they are reported, never silently dropped
UNSUPPORTED = {
    "skin tone": "vsco's skin tone tool has no lightroom equivalent",
    "sharpen edges": "sharpening edge masking differs between the two apps",
    "grain roughness": "grain texture differs between the two apps",
    "clarity strength": "use clarity",
    "border": "frames and borders are not part of a lightroom preset",
    "frame": "frames and borders are not part of a lightroom preset",
}

# preset codes as the app names them: A1..A10, B1..B3, C1..C3, ... AL1..AL3,
# AU1..AU5, X1..X6, and the newer word-based names are kept as written.
FILTER_CODE = re.compile(r"\b((?:AL|AU|A|B|C|D|E|F|G|H|J|K|M|N|O|P|Q|S|T|U|X)\d{1,2})\b")


def looks_like(obj_or_text):
    """Cheap check: does this look like a vsco recipe rather than something else?"""
    text = obj_or_text if isinstance(obj_or_text, str) else json.dumps(obj_or_text)
    lowered = text.lower()
    if any(word in lowered for word in ("vsco", "recipe")):
        return True
    hits = sum(1 for alias in TOOLS if re.search(r"\b" + re.escape(alias) + r"\b", lowered))
    return hits >= 3 and "curves" not in lowered


def _filter_name(text, obj=None):
    if isinstance(obj, dict):
        for key in ("filter", "preset", "look", "name", "title"):
            value = obj.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        for key in ("recipe", "look"):
            inner = obj.get(key)
            if isinstance(inner, dict):
                got = _filter_name(text, inner)
                if got:
                    return got
    for match in re.finditer(r"(?im)^\s*(?:filter|preset|look)\s*[:=]\s*(.+)$", text):
        candidate = match.group(1).strip().strip('"').strip("'")
        if candidate:
            return candidate
    match = FILTER_CODE.search(text)
    if match:
        return match.group(1)
    return None


def _tool_container(obj):
    """Find the dict that actually holds the slider readings."""
    if not isinstance(obj, dict):
        return {}
    for key in ("tools", "adjustments", "settings", "values", "recipe", "look", "sliders"):
        inner = obj.get(key)
        if isinstance(inner, dict):
            return inner
    return obj


BW_RE = re.compile(r"(?i)\b(black\s*(?:&|and)\s*white|b&w|monochrome)\b")


def _values_from_obj(obj):
    values = {}
    notes = []
    if isinstance(obj, dict):
        for marker in ("black_and_white", "black and white", "bw", "monochrome"):
            if marker in obj and obj[marker] not in (None, False, 0, "0"):
                values["__grayscale__"] = True
    for key, raw in _tool_container(obj).items():
        alias = str(key).strip().lower().replace("_", " ").replace("-", " ")
        alias = re.sub(r"\s+", " ", alias)
        if isinstance(raw, dict):
            # a per-band object such as {"blue": {"hue": 3, "luminance": -6}}
            handled = False
            for sub, sub_value in raw.items():
                inner = alias + " " + re.sub(r"\s+", " ", str(sub).strip().lower())
                if inner not in TOOLS:
                    continue
                key2, sign, range_name = TOOLS[inner]
                span = HSL_RANGE if range_name == "hsl" else RANGES.get(range_name or "", 100.0)
                got = fraction(sub_value, span)
                if got is not None:
                    values[key2] = sign * got
                    handled = True
            if not handled:
                notes.append(alias)
            continue
        if alias in UNSUPPORTED:
            notes.append(UNSUPPORTED[alias])
            continue
        if alias not in TOOLS:
            notes.append(alias)
            continue
        key2, sign, range_name = TOOLS[alias]
        if range_name is None:
            # hue readings are already in degrees
            try:
                values[key2] = (float(raw) % 360.0) / 360.0
            except (TypeError, ValueError):
                notes.append(alias)
            continue
        span = HSL_RANGE if range_name == "hsl" else RANGES.get(range_name, 100.0)
        got = fraction(raw, span)
        if got is None:
            notes.append(alias)
            continue
        values[key2] = sign * got
    return values, notes


def _values_from_text(text):
    values = {}
    notes = []
    if BW_RE.search(text):
        values["__grayscale__"] = True
    known = sorted(TOOLS, key=len, reverse=True)
    pattern = alias_regex(known)
    for match in pattern.finditer(text):
        alias = re.sub(r"\s+", " ", match.group(1).strip().lower())
        raw = match.group(2)
        if alias not in TOOLS:
            continue
        key2, sign, range_name = TOOLS[alias]
        if range_name is None:
            try:
                values[key2] = (float(raw) % 360.0) / 360.0
            except (TypeError, ValueError):
                notes.append(alias)
            continue
        span = HSL_RANGE if range_name == "hsl" else RANGES.get(range_name, 100.0)
        got = fraction(raw, span)
        if got is None:
            notes.append(alias)
            continue
        values[key2] = sign * got
    for alias, reason in UNSUPPORTED.items():
        if re.search(r"\b" + re.escape(alias) + r"\b", text.lower()):
            notes.append(reason)
    return values, notes


def _split_cards(text):
    """Several recipes pasted together: one per preset code line."""
    lines = text.splitlines()
    if not any(FILTER_CODE.fullmatch(line.strip()) for line in lines):
        return [text]
    cards, current = [], []
    for line in lines:
        stripped = line.strip()
        if FILTER_CODE.fullmatch(stripped) and any(l.strip() for l in current):
            cards.append("\n".join(current))
            current = []
        current.append(line)
    if any(l.strip() for l in current):
        cards.append("\n".join(current))
    return [card for card in cards if card.strip()]


def parse(text_or_obj, source="", name=None):
    """Turn one or many vsco recipes into Preset objects."""
    if isinstance(text_or_obj, (dict, list)):
        obj = text_or_obj
        if isinstance(obj, list):
            out = []
            for item in obj:
                out.extend(parse(item, source, name))
            return out
        preset_name = name or _filter_name("", obj)
        values, notes = _values_from_obj(obj)
        if not values:
            raise ValueError(f"no recognised vsco sliders in {source or 'input'}")
        return [make_preset(preset_name or "VSCO Look", values, None, source or "vsco", notes)]

    text = (text_or_obj or "").strip()
    if not text:
        raise ValueError("empty vsco recipe")
    if text.startswith(("{", "[")):
        return parse(json.loads(text), source, name)

    presets = []
    for card in _split_cards(text):
        values, notes = _values_from_text(card)
        if not values:
            continue
        preset_name = name or _filter_name(card) or "VSCO Look"
        presets.append(make_preset(preset_name, values, None, source or "vsco", notes))
    if not presets:
        raise ValueError(f"no recognised vsco sliders in {source or 'input'}")
    return presets
