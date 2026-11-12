"""presets: bridge photo-app filters into lightroom-importable develop presets.

today the only source is polarr and the only target is lightroom .xmp. add a
source by writing presets/sources/<app>.py that returns Preset objects, add a
target by writing presets/targets/<app>.py that consumes them. see
../../docs/bridge-contract.md.
"""

from __future__ import annotations

__version__ = "1.2.0"

from .common import (  # noqa: E402
    ALIASES,
    BAD_CHARS,
    CRS_VERSION,
    EXPOSURE_EV_AT_FULL_SCALE,
    HSL_COLORS,
    LOCAL_SUBTREES,
    SPEC,
    TEMP_NEUTRAL_K,
    TEMP_SPAN_K,
    TINT_SPAN,
    UNSUPPORTED_KEYS,
    Preset,
    _maybe_decode_code,
    _norm,
    is_local_key,
    norm_key,
    safe_filename,
    unique_path,
)
from .sources.polarr import (  # noqa: E402
    POLARR_HOSTS,
    QR_EXTENSIONS,
    SCAN_BASES,
    USER_AGENT,
    decode_qr,
    fetch_filter_by_id,
    fetch_filter_url,
    filter_id_from_url,
    load_json,
    parse_presets,
)
from .targets.lightroom import (  # noqa: E402
    build_lightroom,
    build_xmp,
    curve_seq,
    fmt_value,
    _lr_value,
)
from .cli import convert, gather_inputs, main  # noqa: E402

__all__ = [
    "ALIASES", "CRS_VERSION", "HSL_COLORS", "LOCAL_SUBTREES", "SPEC",
    "UNSUPPORTED_KEYS", "Preset", "POLARR_HOSTS", "QR_EXTENSIONS", "SCAN_BASES",
    "USER_AGENT", "build_lightroom", "build_xmp", "convert", "curve_seq",
    "decode_qr", "fetch_filter_by_id", "fetch_filter_url", "filter_id_from_url",
    "fmt_value", "gather_inputs", "is_local_key", "load_json", "main",
    "norm_key", "parse_presets", "safe_filename", "unique_path", "__version__",
]
