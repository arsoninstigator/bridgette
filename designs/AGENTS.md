# Project architecture

- Keep all reusable Porter product data and UI logic under `src/porter/` so routes remain thin and the standalone product stays cohesive.
- Route public third-party metadata reads through validated `/api/public/*` handlers to avoid browser CORS failures and prevent unsafe proxying.
- Model catalog entries as platform collections with multiple template variants so shared source frames and future variants stay centralized.
- Keep format writers under src/porter and expose only genuine supported file extensions; Sketch uses the documented ZIP schema with raster layers, and TIFF uses UTIF, to avoid proprietary-format impersonation.
