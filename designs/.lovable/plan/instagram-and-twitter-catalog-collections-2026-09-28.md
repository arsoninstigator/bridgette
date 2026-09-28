# Instagram and Twitter catalog collections

## What will change
- Add `/catalog/instagram` with profile, post, caption, carousel, and story preset cards.
- Add `/catalog/twitter` with profile, single post, thread, and quote-post preset cards.
- Show distinct visual previews and editable/locked fields for every preset.
- Add both collections to the main catalog and sitemap with page-specific metadata.
- Keep presets source-pending until matching Figma frame links are supplied, rather than attaching unrelated frames.

## Technical details
- Extend the shared platform collection model and reuse the existing collection page.
- Expand the preview renderer for Instagram and Twitter preset types.
- Update the catalog card artwork and route-safe collection types.
