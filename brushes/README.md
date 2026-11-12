# brushes

not built yet.

the plan: take a brush from one art app and hand back a brush the next app can import.
first pair is ibis paint into photoshop, since ibis paint brush exports are self contained
and photoshop's `.abr` is the format the rest of the world reads.

open questions to settle before code:

- which ibis paint export carries the tip shape, and does it ship the grain texture too
- `.abr` has two generations in the wild (v6 and v10). pick one and say so
- a brush is a tip plus dynamics (size, opacity, scatter, angle jitter). every app spells
  these differently, so the model needs a dynamics table with honest "not carried" notes,
  the same way `presets/` carries a mapping table
- procreate `.brush` files are zip archives with json inside, so `stamps/` and `brushes/`
  will share a reader

samples and tests land with the first reader.
