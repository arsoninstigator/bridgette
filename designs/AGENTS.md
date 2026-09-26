# Project architecture

- Keep all reusable Porter product data and UI logic under `src/porter/` so routes remain thin and the standalone product stays cohesive.
- Route public third-party metadata reads through validated `/api/public/*` handlers to avoid browser CORS failures and prevent unsafe proxying.
