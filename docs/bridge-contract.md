# the bridge contract

bridgette is a set of bridges. this file is what a domain has to look like to belong here,
so adding `/brushes` later costs a folder and not an argument.

## 1. three pieces

```
sources/<app>.py      reads an app-specific file into the shared model
model                 the vocabulary both sides agree on
targets/<dest>.py     writes the shared model into a destination format
```

a source that cannot reach the model is not finished. a target that cannot consume the
model is not finished either.

## 2. the model has to be lossless enough to explain itself

the model keeps what the source actually said, in the source's own units, plus notes for
anything recognised but not carried (a lut id, a mask, a layer flag). the writer decides
how to spend that.

consequence: `presets/common.py` holds raw slider values and the mapping tables, not
lightroom field names. `presets/targets/lightroom.py` is the only place that knows what a
`crs:` attribute is.

## 3. fidelity is output, not documentation

every crossing prints or records what it dropped:

- skipped keys are reported per preset, with a reason
- a value that is approximated says so (polarr exposure is treated as +/-2 stops at full
  scale; that is a decision, not a measurement)
- a whole class of feature that cannot cross (lut filters, masks) is stated as a limit in
  the readme, not a footnote

## 4. one word, one meaning

repo-wide vocabulary is fixed: `preset` means a photo look. design layout templates are
`templates`. `design` means a layered design file. `swatch` means a colour, `palette` means
a set of them. when a domain wants a new noun, it goes in this file first.

## 5. layout per domain

```
<domain>/
  README.md        what it bridges, what it drops, how to run it
  sources/         readers, one file per app
  targets/         writers, one file per destination
  common.<ext>     the model and the shared helpers
  cli.<ext>        the command line, if the domain has one
  samples/         small real fixtures, safe to publish
  tests/           the suite, offline by default
```

a domain that is only an app (like `designs/`) keeps its own toolchain and does not
pretend to have a python-shaped model. it still has to state its fidelity limits in its
readme, which `designs/roadmap.md` and the export notes in `src/porter/convert.ts` do.

## 6. adding a domain

1. write the readme first: inputs, outputs, what cannot cross, how to run.
2. add samples that are small and real. no fixtures you cannot explain.
3. write the reader, then the writer, then the tests that pin both.
4. add the row to the root README table with an honest state.

## 7. adding a source to an existing domain

the reader returns model objects and nothing else. it does not write files, it does not
know the target. a new source costs one file, one sample and one test table row.

## 8. tests

offline by default: any network or file-system behaviour is mocked against a local server
or a temp dir. a suite that needs the internet is a suite that cannot run in ci or on a
plane, so the qr and share-link paths in `presets/` run against a local http server.
