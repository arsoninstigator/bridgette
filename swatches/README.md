# swatches

not built yet. palettes are the smallest bridge in the repo and probably the first one that
is fully round trip, which makes it a good test of the model rules.

formats in scope:

- procreate `.swatches`
- adobe swatch exchange `.ase`, and the older `.aco`
- gimp palette `.gpl`
- mac colour list `.clr`, plain text hex lists, css variables

the model is a named group of named colours with optional rgb, lab and cmyk values. the
honest part is that `.aco` and lab values round trip badly, so a conversion that starts
from lab should say which values survived.
