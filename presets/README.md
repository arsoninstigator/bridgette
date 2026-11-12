# presets

convert photo-app presets into lightroom-importable `.xmp` develop presets.

three sources, one model, one target: polarr, snapseed and vsco in, lightroom out.

```
python3 -m presets samples/copper-dusk.json -o lightroom-presets      # polarr
python3 -m presets samples/cf6-qr.png -o lightroom-presets            # polarr qr code
python3 -m presets https://www.polarr.co/users/custom_filter/1400644  # polarr link
python3 -m presets samples/vsco-a6.txt -o lightroom-presets           # vsco recipe
python3 -m presets samples/snapseed-faded-city.txt -o lightroom-presets
python3 -m presets ~/Downloads/looks -o lightroom-presets             # a mixed folder
```

## layout

```
presets/
  common.py              the model (Preset), the canonical value space, key tables
  router.py              which reader owns this input, by content not extension
  sources/polarr.py      json, packs, zip members, qr images, links, ids, codes
  sources/snapseed.py    tune image / details / grain / vignette / curves / b&w
  sources/vsco.py        recipe cards, pasted settings, json recipes
  targets/lightroom.py   crs fields and the xmp writer
  cli.py                 input expansion, conversion, reporting
  samples/  tests/        111 tests, offline
```

## how the model works

every reader converts its app's own units into one canonical space:

| canonical | means | lightroom |
| --- | --- | --- |
| bipolar `-1..1` | a slider's full negative to full positive | `-100..100` |
| unipolar `0..1` | a slider from nothing to full | `0..max` |
| hue `0..1` | a full turn | `0..360` degrees |

so a source is a table of slider ranges, not a pipeline. the writer multiplies back out
and is the only place that knows what a `crs:` attribute is.

## inputs

| what you give it | how it is read |
| --- | --- |
| a polarr `.json` (mobile or desktop, flat or nested) | parsed directly |
| a folder | walked, every file sniffed by content |
| a `.zip` of presets, including zips inside folders | unpacked in memory |
| a polarr pack file (`[...]`, `{"presets":[...]}`) | one xmp each |
| a qr code image (`.png`, `.jpg`) | payload decoded, then resolved |
| a polarr share link or bare filter id | polarr's scan endpoint |
| a base64 polarr filter code | decoded, then parsed |
| a vsco or snapseed recipe as text (`A6` + slider lines, "Tune Image: ...") | parsed as written |
| a `.json` recipe in either app's own vocabulary | parsed as written |

`--from polarr|vsco|snapseed` skips detection when you already know.

qr images need opencv, the only optional dependency. everything else is standard library,
and links and ids need only the network.

```
pip install opencv-python-headless
```

## options

```
-o, --out     output folder (default: lightroom-presets)
-g, --group   lightroom preset group name, shows as the folder in the preset panel
-z, --zip     also write a zip of the generated xmp files
-r, --report  print the per-key mapping and any skipped keys while converting
-f, --from    force a reader instead of detecting it
```

## what maps

light: exposure, contrast, highlights, shadows, whites, blacks.
presence: texture, clarity, dehaze, vibrance, saturation.
white balance: temperature, tint.
colour: the eight HSL bands (hue, saturation, luminance), colour grading (highlights,
midtones, shadows, balance, blending), lightroom's black and white mixer.
tone: master and per channel curves.
detail and effects: sharpening, luminance and colour noise reduction, grain (amount, size,
roughness), vignette (amount, midpoint, feather, roundness).

## what each source costs you

### polarr

values are normalised (`-1..1`); percent-scale exports are detected per key and accepted.
what cannot cross: lut based filters, gamma, blur, diffuse, mosaic, distortion, fringing,
rotate and flip, local adjustments and masks, spots, text, face features, vignette size and
vignette highlights. a preset whose character comes from a lut converts to something close
but not the same. that is a limit, not a rounding error.

### snapseed

snapseed has no preset export at all, so this reader reads the app's own vocabulary written
down: a screenshot transcribed, a note in a chat, or a json file in the same shape. sliders
are read on their `-100..100` scale.

three tools are engines rather than sliders, so they are spread over the closest lightroom
controls and the result approximates the look instead of porting the engine:

- `ambience` -> shadows 55%, clarity 20%
- `structure` -> texture 60%, clarity 35%
- `tonal contrast` -> highlights / clarity / shadows at 40%

`warmth` maps onto the same 3500 K window as polarr, `vignette` flips sign (snapseed
darkens as it rises, lightroom darkens on negatives), and black and white colour filters
become lightroom's grayscale mixer.

no equivalent, reported as skipped: hdr scape, drama, glamour glow, vintage, retrolux,
grunge, noir, lens blur, selective masks, healing, double exposure, frames, text, expand,
perspective.

### vsco

vsco has no export format and no public recipe api (vsco.co answers 403 to logged-out
requests), so a vsco look arrives the way people share them: the recipe card text, a pasted
settings list, or json in the same shape. values are read as the app shows them, divided by
the slider range in `RANGES` at the top of `sources/vsco.py` (exposure in EV, most sliders
`+/-6`, fade, grain, vignette and sharpen `+/-12`). edit that table and every conversion
follows.

`fade` lifts lightroom blacks, `vignette` flips sign, and `shadow hue` / `highlight hue`
with their saturations become lightroom colour grading. skin tone, borders and grain
roughness have no equivalent and are reported.

## calibration

assumptions live as constants, not as prose:

- `common.EXPOSURE_EV_AT_FULL_SCALE = 2.0` - a full exposure push is treated as 2 stops
- `common.TEMP_NEUTRAL_K = 5500`, `common.TEMP_SPAN_K = 3500` - a full temperature push
  spans that window around neutral
- `sources.vsco.RANGES` - what counts as a full push per vsco slider
- `sources.snapseed.MAPPING` - how much of each lightroom control a snapseed slider feeds

temperature 0 and tint 0 mean "leave the capture alone", so those presets keep lightroom's
`WhiteBalance="As Shot"` instead of forcing a fixed kelvin.

## tests

```
python3 -m unittest discover -s presets/tests
```

111 tests: key normalisation, both value scales, every mapping family, curves in all the
shapes the apps use, xml well formedness and escaping, filename collisions, base64 codes,
folders and nested zips, qr decoding, share link and scan endpoint resolution against a
local http server, vsco and snapseed recipes in text and json, source detection and the
forced reader, mixed folders where one bad file does not stop the run, and the cli end to
end. the suite runs offline.
