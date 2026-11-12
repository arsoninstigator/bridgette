# presets

convert photo-app presets into lightroom-importable `.xmp` develop presets.

today: polarr in, lightroom out. snapseed and vsco are the planned next sources, each
landing in the same lightroom output, which is why the code is split into a reader, a
shared model and a writer instead of one file.

```
python3 -m presets samples/copper-dusk.json -o lightroom-presets
python3 -m presets samples/cf6-qr.png -o lightroom-presets
python3 -m presets https://www.polarr.co/users/custom_filter/1400644 -o lightroom-presets
```

## layout

```
presets/
  common.py            the model (Preset), value scales, polarr key tables
  sources/polarr.py    json, packs, zip members, qr images, share links, filter ids, codes
  targets/lightroom.py crs fields and the xmp writer
  cli.py               input expansion, conversion, reporting
  samples/  tests/     73 tests, offline
```

a second source returns `Preset` objects from `common.py` and nothing else changes. a
second target consumes them and nothing else changes.

## inputs

| what you give it | how it is read |
| --- | --- |
| a `.json` preset (mobile or desktop export, flat or nested) | parsed directly |
| a folder | walked, every `.json` / `.polarr` used |
| a `.zip` of presets, including zips inside folders | unpacked in memory |
| a pack file with many presets (`[...]`, `{"presets":[...]}`, `{"filters":[...]}`) | one xmp each |
| a qr code image (`.png`, `.jpg`) | qr payload decoded, then resolved |
| a polarr share link or filter id | resolved through polarr's scan endpoint |
| a base64 filter code | decoded, then parsed |

qr and link resolution: a polarr qr code is a url whose last path segment is a filter id.
the reader asks polarr's own public endpoint, `https://api.polarr.co/v1/ppe/filters/<id>/scan`,
which answers with a `contentUrl` pointing at the filter json. that json is what gets
converted. if a qr holds raw filter json, that is used directly. as a last resort the
reader scans fetched html or js for an embedded filter object.

qr image decoding needs opencv, the only optional dependency:

```
pip install opencv-python-headless
```

links, ids and filter codes need only the network, no extra packages.

## options

```
-o, --out     output folder (default: lightroom-presets)
-g, --group   lightroom preset group name, shows as the folder in the preset panel
-z, --zip     also write a zip of the generated xmp files
-r, --report  print the per-key mapping and any skipped keys while converting
```

## what maps

exposure, contrast, highlights, shadows, whites, blacks, texture, clarity, dehaze,
vibrance, saturation, temperature, tint, the eight HSL bands (hue, saturation, luminance),
tone curves (master plus per channel), colour grading (highlights, midtones, shadows plus
balance and blending), sharpening, luminance and colour noise reduction, grain (amount,
size, roughness), vignette (amount, midpoint, feather, roundness), monochrome conversion.

polarr sends normalised values (-1..1); percent-scale (-100..100) exports are detected per
key and accepted too.

## what cannot map

these have no lightroom equivalent and are reported as skipped:

- lut based filters (polarr applies a cube, lightroom presets cannot carry one)
- gamma, blur, diffuse, mosaic, distortion, fringing, rotate and flip
- local adjustments, masks, brushes, radial and gradient filters
- spots, text and face features
- vignette size and vignette highlights (amount, midpoint, feather and roundness do map)

a preset whose whole character comes from a lut converts to a preset that is close but not
the same. that is a real limitation, not a rounding error.

## calibration

two assumptions are adjustable at the top of `common.py`:

- `EXPOSURE_EV_AT_FULL_SCALE = 2.0` - polarr's +/-1.0 exposure is treated as +/-2 stops
- `TEMP_NEUTRAL_K = 5500` and `TEMP_SPAN_K = 3500` - polarr's +/-1.0 temperature spans that
  window around the neutral point

polarr temperature 0 and tint 0 mean "leave the capture alone", so those presets keep
lightroom's `WhiteBalance="As Shot"` instead of forcing a fixed kelvin.

## tests

```
python3 -m unittest discover -s presets/tests
```

73 tests: key normalisation, both value scales, every mapping family, curves in all the
shapes polarr uses, xml well formedness and escaping, filename collisions, base64 codes,
folders and nested zips, qr decoding, share link and scan endpoint resolution against a
local http server (so the suite runs offline), and the cli end to end.
