# working in bridgette

- one domain per top level folder, one language per domain. do not force a single
  toolchain across `designs/` (ts) and `presets/` (python).
- every domain follows the reader -> model -> writer shape in `docs/bridge-contract.md`.
  if a domain cannot, say why in its readme instead of bending the shape.
- fidelity is part of the feature. a converter that silently drops data is a bug. list
  what does not cross in the domain readme and in the warning output.
- keep `designs/` close to upstream while it is being de-lovelabified in small commits.
  it stays runnable with `npm run dev` from inside `designs/`.
- tests run per domain: `python3 -m unittest discover -s presets/tests` and `npm run
  build` inside `designs/`. add a test with every new reader or writer.
- placeholder domains stay honest: a readme describing the planned bridge, no stub code.
