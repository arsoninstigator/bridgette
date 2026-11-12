# stamps

not built yet. "super later" in the original plan, because stamps look surprisingly small:
a stamp is a brush whose tip is an image and whose dynamics barely matter.

the plan: procreate stamp out to photoshop brush, plus a flattened png sheet for apps that
only import images.

work it needs:

- read procreate's `.brush` / `.brushset` archive (zip plus json, shared with `brushes/`)
- pull the greyscale or rgba tip out and rebuild it as an `.abr` tip
- a png sheet target so anything can import at least the shape

fidelity note to carry from day one: a stamp's rotation and scatter dynamics have no image
equivalent, so the png target is shape only.
