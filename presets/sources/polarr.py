"""polarr reader.

reads a polarr preset from whatever form it arrives in: a .json export (mobile or
desktop, flat or nested), a pack file, a zip member, a qr code image, a share
link, a bare filter id or a raw base64 filter code.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

from ..common import (
    NAME_KEYS,
    SPEC,
    UNSUPPORTED_KEYS,
    Preset,
    _maybe_decode_code,
    is_local_key,
    norm_key,
)

# ---------------------------------------------------------------------------
# polarr qr codes and filter links
# ---------------------------------------------------------------------------
# A Polarr QR code (and the "share filter" link behind it) contains a URL whose
# last path segment is a filter id. Polarr's own scan endpoint
# /v1/ppe/filters/<id>/scan answers with {"contentUrl": ...}, which points at
# the filter JSON. That JSON is {"name": {"en": ...}, "state": {...}, ...}, and
# "state" is exactly the adjustment map this converter already understands.

QR_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif")
SCAN_BASES = ("https://api.polarr.co/v1", "https://api.polaxiong.com/v1")
POLARR_HOSTS = ("polarr.co", "polarr.com", "polaxiong.com")
USER_AGENT = "porter/1.1"


def decode_qr(path):
    """Read every QR payload out of an image."""
    try:
        import cv2
    except ImportError as exc:
        raise RuntimeError(
            "reading QR images needs opencv: pip install opencv-python-headless") from exc
    image = cv2.imread(path)
    if image is None:
        raise ValueError(f"cannot read image: {os.path.basename(path)}")
    detector = cv2.QRCodeDetector()
    texts = []
    try:
        ok, decoded, _pts, _ = detector.detectAndDecodeMulti(image)
        if ok:
            texts = [t for t in decoded if t]
    except Exception:
        pass
    if not texts:
        text, _pts, _ = detector.detectAndDecode(image)
        if text:
            texts = [text]
    texts = [t.strip() for t in texts if t and t.strip()]
    if not texts:
        raise ValueError(f"no QR code found in {os.path.basename(path)}")
    return texts


def _http_get(url, timeout=30):
    request = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
    })
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def _is_polarr_host(host):
    host = (host or "").lower()
    return any(host == h or host.endswith("." + h) for h in POLARR_HOSTS)


def filter_id_from_url(url):
    """Polarr filter ids sit in the last path segment, or in an ?id= parameter."""
    parsed = urllib.parse.urlparse(url)
    query = urllib.parse.parse_qs(parsed.query)
    for key in ("id", "filter", "filter_id", "f"):
        if query.get(key):
            return query[key][0].strip() or None
    segments = [seg for seg in parsed.path.split("/") if seg]
    if not segments:
        return None
    last = re.sub(r"\.(json|html?|php)$", "", segments[-1], flags=re.I)
    return last or None


def fetch_filter_by_id(filter_id):
    """Resolve a Polarr filter id through Polarr's public scan endpoint."""
    last_error = None
    for base in SCAN_BASES:
        url = f"{base}/ppe/filters/{urllib.parse.quote(str(filter_id))}/scan"
        try:
            payload = json.loads(_http_get(url).decode("utf-8", "replace"))
        except (urllib.error.URLError, json.JSONDecodeError, OSError) as exc:
            last_error = exc
            continue
        content_url = payload.get("contentUrl") if isinstance(payload, dict) else None
        if not content_url:
            continue
        try:
            return json.loads(_http_get(content_url).decode("utf-8", "replace"))
        except (urllib.error.URLError, json.JSONDecodeError, OSError) as exc:
            last_error = exc
    if last_error is not None:
        raise ValueError(f"polarr filter {filter_id!r} could not be fetched ({last_error})")
    raise ValueError(f"polarr filter {filter_id!r} not found")


def _looks_like_filter(obj):
    if isinstance(obj, list):
        return any(_looks_like_filter(item) for item in obj[:20])
    if not isinstance(obj, dict):
        return False
    for key in ("state", "adjustments", "filter", "preset"):
        inner = obj.get(key)
        if isinstance(inner, dict):
            hits = sum(1 for k in inner if norm_key(k) in SPEC)
            if hits >= 2:
                return True
    hits = sum(1 for k in obj if norm_key(k) in SPEC)
    return hits >= 2


def _embedded_filters(text, max_blobs=6):
    """Find JSON filter objects buried in an HTML or JS page."""
    decoder = json.JSONDecoder()
    found = []
    for match in list(re.finditer(r"[\[{]", text))[:400]:
        chunk = text[match.start():match.start() + 500000]
        try:
            obj, _end = decoder.raw_decode(chunk)
        except Exception:
            continue
        if _looks_like_filter(obj):
            found.append(obj)
            if len(found) >= max_blobs:
                break
    return found


def fetch_filter_url(url):
    """Turn a share link, QR payload or scan response into filter JSON."""
    parsed = urllib.parse.urlparse(url)
    if _is_polarr_host(parsed.hostname):
        filter_id = filter_id_from_url(url)
        if filter_id:
            try:
                return fetch_filter_by_id(filter_id)
            except ValueError:
                pass
    raw = _http_get(url)
    text = raw.decode("utf-8", "replace")
    try:
        obj = json.loads(text)
    except json.JSONDecodeError:
        obj = None
    if isinstance(obj, dict) and obj.get("contentUrl"):
        return json.loads(_http_get(obj["contentUrl"]).decode("utf-8", "replace"))
    if _looks_like_filter(obj):
        return obj
    embedded = _embedded_filters(text)
    if embedded:
        return embedded[0]
    raise ValueError(f"no polarr filter data found at {url}")


def load_json(source: str):
    """Load presets from a file, QR image, URL, JSON string or filter code."""
    text = source
    if os.path.exists(source):
        if source.lower().endswith(QR_EXTENSIONS):
            last_error = None
            for payload in decode_qr(source):
                try:
                    return load_json(payload)
                except ValueError as exc:
                    last_error = exc
            raise ValueError(
                f"the QR code in {os.path.basename(source)} is not a polarr filter"
                + (f" ({last_error})" if last_error else ""))
        with open(source, "r", encoding="utf-8-sig", errors="replace") as fh:
            text = fh.read()
    text = text.strip()
    if text.startswith(("http://", "https://")):
        return fetch_filter_url(text)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, (dict, list)):
            return parsed
    except Exception:
        pass
    decoded = _maybe_decode_code(text)
    if decoded is not None:
        return decoded
    if re.fullmatch(r"[A-Za-z0-9_-]{5,64}", text) and not text.startswith("{"):
        return fetch_filter_by_id(text)
    raise ValueError(f"could not read presets from {source[:60]!r}")


LANG_PREFERENCE = ("en", "en_us", "en-us", "default", "name", "zh", "zh_cn")


def _name_from(value):
    """Polarr names are sometimes localized dicts: {"en": "...", "zh": "..."}."""
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, dict):
        for lang in LANG_PREFERENCE:
            got = value.get(lang)
            if isinstance(got, str) and got.strip():
                return got.strip()
        for item in value.values():
            if isinstance(item, str) and item.strip():
                return item.strip()
    return None


def _find_name(obj, fallback):
    if isinstance(obj, dict):
        for want in NAME_KEYS:
            for k, v in obj.items():
                if norm_key(k) == want:
                    got = _name_from(v)
                    if got:
                        return got
        for v in obj.values():
            if isinstance(v, dict):
                got = _find_name(v, None)
                if got:
                    return got
    return fallback


def _curve_points(raw):
    """Normalise assorted Polarr curve shapes into [(x, y)] on a 0..255 scale."""
    pts = []
    if isinstance(raw, dict):
        raw = raw.get("points") or raw.get("values") or raw.get("curve")
    if not isinstance(raw, list):
        return []
    for item in raw:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            x, y = item[0], item[1]
        elif isinstance(item, dict):
            x, y = item.get("x"), item.get("y")
        else:
            continue
        try:
            x, y = float(x), float(y)
        except (TypeError, ValueError):
            continue
        pts.append((x, y))
    if not pts:
        return []
    biggest = max(max(abs(x), abs(y)) for x, y in pts)
    scale = 1.0 if biggest > 1.5 else 255.0
    out = []
    for x, y in pts:
        out.append((max(0.0, min(255.0, x * scale)), max(0.0, min(255.0, y * scale))))
    out.sort()
    return out


CURVE_CHANNELS = ("rgb", "red", "green", "blue", "all", "master", "curve", "curves")


def _channel_from(hint: str) -> str:
    h = hint.lower()
    for name in ("red", "green", "blue"):
        if name in h:
            return name
    return "rgb"


def _extract_curves(value, hint: str):
    """Pull {channel: [(x, y)]} out of Polarr curve structures."""
    found = {}
    pts = _curve_points(value)
    if pts:
        found[_channel_from(hint)] = pts
        return found
    if isinstance(value, dict):
        for k, v in value.items():
            nk = norm_key(k)
            if not any(c in nk for c in CURVE_CHANNELS):
                continue
            for ch, p in _extract_curves(v, nk).items():
                found.setdefault(ch, p)
    return found


def _walk(obj, values, curves, notes, depth=0):
    if depth > 12:
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            nk = norm_key(k)
            if is_local_key(k):
                continue
            if isinstance(v, bool):
                if ("grayscale" in nk or "monochrome" in nk or nk == "bw") and v:
                    values["__grayscale__"] = 1
                continue
            if isinstance(v, (int, float)):
                if nk in SPEC:
                    values[nk] = float(v)
                elif nk in UNSUPPORTED_KEYS:
                    notes.add(nk)
                elif nk not in NAME_KEYS:
                    notes.add(nk)
                continue
            if isinstance(v, str):
                if nk in ("lut", "luts", "profile", "profiles", "lut_id", "lutname"):
                    notes.add("lut")
                elif nk in UNSUPPORTED_KEYS:
                    notes.add(nk)
                continue
            if isinstance(v, (dict, list)):
                if "curve" in nk or nk in CURVE_CHANNELS:
                    got = _extract_curves(v, nk)
                    if got:
                        for ch, pts in got.items():
                            curves.setdefault(ch, pts)
                        continue
                if nk in ("lut", "luts", "profile", "profiles"):
                    notes.add("lut")
                    continue
                _walk(v, values, curves, notes, depth + 1)


def parse_presets(obj, source_name: str):
    """Turn loaded JSON into a list of Preset objects."""
    notes = set()

    # A pack: list of presets, or {"filters": [...]}, or {"presets": {...}}
    candidates = None
    if isinstance(obj, list) and obj and all(isinstance(i, dict) for i in obj):
        candidates = obj
    elif isinstance(obj, dict):
        for key in ("presets", "filters", "filter_list", "items"):
            if isinstance(obj.get(key), list) and obj[key]:
                candidates = obj[key]
                break

    items = []
    if candidates is not None:
        for idx, entry in enumerate(candidates):
            items.append((entry, f"{source_name} #{idx + 1}"))
    else:
        items.append((obj, source_name))

    presets = []
    base = os.path.splitext(os.path.basename(source_name))[0] or "preset"
    for entry, label in items:
        values, curves, item_notes = {}, {}, set()
        _walk(entry, values, curves, item_notes)
        if not values and not curves:
            raise ValueError(f"no Polarr adjustments found in {label}")
        name = _find_name(entry, base) or "preset"
        presets.append(Preset(name, values, curves, label, item_notes))
    del notes
    return presets

