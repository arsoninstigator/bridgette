"""lightroom writer: polarr values become crs fields, then an .xmp preset."""

from __future__ import annotations

import json
import uuid
from xml.sax.saxutils import escape

from ..common import (
    CRS_VERSION,
    EXPOSURE_EV_AT_FULL_SCALE,
    HSL_COLORS,
    SPEC,
    TEMP_NEUTRAL_K,
    TEMP_SPAN_K,
    TINT_SPAN,
    UNSUPPORTED_KEYS,
    Preset,
    _norm,
)

def _lr_value(raw, kind_tuple):
    field, kind = kind_tuple[0], kind_tuple[1]
    n = _norm(raw)
    if kind == "bipolar":
        return field, round(n * 100.0)
    if kind == "unipolar":
        top = kind_tuple[2] if len(kind_tuple) > 2 else 100.0
        return field, round(max(0.0, min(1.0, n)) * top)
    if kind == "exposure":
        return field, round(n * EXPOSURE_EV_AT_FULL_SCALE, 2)
    if kind == "temp":
        return field, round(TEMP_NEUTRAL_K + n * TEMP_SPAN_K)
    if kind == "tint":
        return field, round(n * TINT_SPAN)
    if kind == "hue":
        deg = n * 360.0 if abs(raw) <= 1.5 else (raw if abs(raw) <= 360 else (raw % 360))
        return field, round(deg % 360)
    raise ValueError(kind)


def build_lightroom(preset: Preset):
    """Return (ordered dict of crs fields, list of warning strings)."""
    warnings = []
    fields = {}

    # neutral baseline so the preset fully defines the look
    defaults = {
        "WhiteBalance": "As Shot",
        "Exposure2012": 0,
        "Contrast2012": 0,
        "Highlights2012": 0,
        "Shadows2012": 0,
        "Whites2012": 0,
        "Blacks2012": 0,
        "Texture": 0,
        "Clarity2012": 0,
        "Dehaze": 0,
        "Vibrance": 0,
        "Saturation": 0,
        "ParametricShadows": 0,
        "ParametricDarks": 0,
        "ParametricLights": 0,
        "ParametricHighlights": 0,
        "ParametricShadowSplit": 25,
        "ParametricMidtoneSplit": 50,
        "ParametricHighlightSplit": 75,
        "Sharpness": 0,
        "SharpenRadius": 1.0,
        "SharpenDetail": 25,
        "SharpenEdgeMasking": 0,
        "LuminanceSmoothing": 0,
        "ColorNoiseReduction": 0,
        "PostCropVignetteAmount": 0,
        "PostCropVignetteMidpoint": 50,
        "PostCropVignetteFeather": 50,
        "PostCropVignetteRoundness": 0,
        "PostCropVignetteStyle": 1,
        "GrainAmount": 0,
        "GrainSize": 25,
        "GrainFrequency": 50,
        "ConvertToGrayscale": "False",
        "HasSettings": "True",
    }
    fields.update(defaults)

    for key in HSL_COLORS:
        for prefix, template in (("hue", "HueAdjustment"),
                                 ("saturation", "SaturationAdjustment"),
                                 ("luminance", "LuminanceAdjustment")):
            fields[f"{template}{key.capitalize()}"] = 0

    grading_present = any(k in preset.values for k in
                          ("highlights_hue", "shadows_hue", "midtone_hue"))
    if grading_present:
        for zone in ("Highlight", "Midtone", "Shadow"):
            fields[f"ColorGrade{zone}Hue"] = 0
            fields[f"ColorGrade{zone}Sat"] = 0
            fields[f"ColorGrade{zone}Lum"] = 0
        fields["ColorGradeBlending"] = 50
        fields["ColorGradeBalance"] = 0

    wb_touched = False
    for key, raw in preset.values.items():
        if key == "__grayscale__":
            fields["ConvertToGrayscale"] = "True"
            continue
        if key not in SPEC:
            continue
        name, value = _lr_value(raw, SPEC[key])
        fields[name] = value
        if name in ("Temperature", "Tint"):
            wb_touched = True

    # Polarr 0 means "leave the capture's white balance alone", so a filter that
    # does not shift temperature or tint stays As Shot instead of forcing 5500K.
    raw_wb = (float(preset.values.get("temperature", 0.0) or 0.0),
              float(preset.values.get("tint", 0.0) or 0.0))
    if wb_touched and (abs(raw_wb[0]) > 1e-9 or abs(raw_wb[1]) > 1e-9):
        fields["WhiteBalance"] = "Custom"
        fields.setdefault("Temperature", TEMP_NEUTRAL_K)
        fields.setdefault("Tint", 0)
    else:
        fields["WhiteBalance"] = "As Shot"
        fields.pop("Temperature", None)
        fields.pop("Tint", None)

    if preset.curves:
        fields["ToneCurveName2012"] = "Custom"
    else:
        fields["ToneCurveName2012"] = "Linear"

    for note in sorted(preset.notes):
        if note in UNSUPPORTED_KEYS or "lut" in note or "mosaic" in note:
            warnings.append(f"skipped (no Lightroom equivalent): {note}")

    return fields, warnings


def fmt_value(v):
    if isinstance(v, str):
        return v
    if isinstance(v, bool):
        return "True" if v else "False"
    if isinstance(v, int):
        return f"{v:+d}" if v != 0 else "0"
    if float(v).is_integer():
        i = int(v)
        return f"{i:+d}" if i != 0 else "0"
    return f"{v:+.2f}"


def curve_seq(channel, points):
    if not points:
        points = [(0.0, 0.0), (255.0, 255.0)]
    pts = sorted({(round(x, 1), round(y, 1)) for x, y in points})
    if pts[0][0] > 0:
        pts.insert(0, (0.0, min(pts[0][1], 0.0)))
    if pts[-1][0] < 255:
        pts.append((255.0, max(pts[-1][1], 255.0)))
    lines = []
    for x, y in pts:
        xs = f"{x:g}" if not float(x).is_integer() else str(int(x))
        ys = f"{y:g}" if not float(y).is_integer() else str(int(y))
        lines.append(f"    <rdf:li>{xs}, {ys}</rdf:li>")
    return "\n".join(lines)


def build_xmp(preset: Preset, group=""):
    fields, warnings = build_lightroom(preset)
    safe_name = escape(preset.name)
    digest = uuid.uuid5(uuid.NAMESPACE_URL,
                        preset.name + json.dumps(preset.values, sort_keys=True, default=str))
    uid = digest.hex.upper()

    attrs = [
        ('PresetType', 'Normal'),
        ('Cluster', ''),
        ('UUID', uid),
        ('SupportsAmount', 'False'),
        ('SupportsColor', 'True'),
        ('SupportsMonochrome', 'True'),
        ('SupportsHighDynamicRange', 'True'),
        ('SupportsNormalDynamicRange', 'True'),
        ('SupportsSceneReferred', 'True'),
        ('SupportsOutputReferred', 'True'),
        ('CameraModelRestriction', ''),
        ('Copyright', ''),
        ('ContactInfo', ''),
        ('Version', CRS_VERSION),
        ('ProcessVersion', CRS_VERSION),
    ]
    for name, value in fields.items():
        attrs.append((name, fmt_value(value)))

    attr_lines = "\n".join(f'   crs:{k}="{escape(str(v), {chr(34): "&quot;"})}"' for k, v in attrs)

    curves = preset.curves or {}
    curve_xml = []
    for channel, tag in (("rgb", "ToneCurvePV2012"),
                         ("red", "ToneCurvePV2012Red"),
                         ("green", "ToneCurvePV2012Green"),
                         ("blue", "ToneCurvePV2012Blue")):
        pts = curves.get(channel, [])
        curve_xml.append(
            f"   <crs:{tag}>\n    <rdf:Seq>\n{curve_seq(channel, pts)}\n    </rdf:Seq>\n   </crs:{tag}>"
        )

    alt = lambda tag, text: (
        f"   <crs:{tag}>\n    <rdf:Alt>\n"
        f'     <rdf:li xml:lang="x-default">{text}</rdf:li>\n'
        f"    </rdf:Alt>\n   </crs:{tag}>"
    )

    xmp = f"""<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="bridgette">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
{attr_lines}>
{alt("Name", safe_name)}
{alt("ShortName", "")}
{alt("SortName", "")}
{alt("Group", escape(group))}
{alt("Description", "")}
{chr(10).join(curve_xml)}
   <crs:Look
    crs:Name=""/>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
"""
    return xmp, warnings
