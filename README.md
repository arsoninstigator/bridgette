# bridgette

bridge it. one repo for the bridges between creative apps and the files everything else can
open. every domain folder takes a proprietary or app-specific format and writes an open,
importable equivalent, and says honestly what got lost on the way.

| folder | bridges | state |
| --- | --- | --- |
| [`designs/`](designs) | figma frame, psd, ai, eps -> psd, svg, eps, sketch, tiff, png, json | working app (imported from [kqrla/porter](https://github.com/kqrla/porter)) |
| [`presets/`](presets) | polarr presets (json, qr, share link, filter id), vsco recipes and snapseed looks -> lightroom `.xmp` | working cli, 111 tests |
| [`brushes/`](brushes) | ibis paint and friends -> psd / `.abr` | not built |
| [`stamps/`](stamps) | procreate stamps -> other apps | not built |
| [`swatches/`](swatches) | procreate palettes, `.ase`, `.aco`, `.gpl` | not built |
| [`files/`](files) | generic file bridging | not built |
| [`collection/`](collection) | a library over everything bridged so far | not built |

## how a bridge is shaped

each domain is the same three pieces:

```
source reader  ->  shared model  ->  target writer
```

the model is the thing that makes the repo grow cheaply: a new app costs one reader, a new
destination costs one writer, and the fidelity notes in the domain readme say what the
crossing drops. [`docs/bridge-contract.md`](docs/bridge-contract.md) has the rules.

## quickstart

designs is a vite + tanstack start app:

```
cd designs
npm i
npm run dev
```

presets is python, standard library only:

```
python3 -m presets presets/samples/copper-dusk.json -o out
python3 -m unittest discover -s presets/tests
```

qr images need `pip install opencv-python-headless`; everything else needs nothing.

## provenance

`designs/` is [kqrla/porter](https://github.com/kqrla/porter) at `10ea860`, imported
whole with its 581 commits rewritten under the `designs/` prefix. nothing was recoded on
the way in except one naming change: the catalog's design templates used to be called
presets, and they are called templates now, so the word means one thing across the repo.
upstream `.env` was stripped from history during the import.

## licence

mit, see [LICENSE](LICENSE). the imported designs app carries no separate licence; it
comes from the same account.
