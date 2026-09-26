# Figma URL import and preset catalog

## What will change
- Make the Figma source accept a pasted or dropped frame URL directly.
- Attempt a no-login public preview first; clearly request Figma authorization only when full layer access is required.
- Preserve personal-token and account authorization paths for editable layer imports.
- Add `/catalog` with distinct preset cards, beginning with an iMessage chat and Spotify album cover.
- Add shareable detail pages at `/catalog/imessage-chat` and `/catalog/spotify-album-cover`, with preset information and a direct path into the lab.
- Add Catalog to Porter navigation and include the new pages in the sitemap.

## Important limitation
Figma’s public embed metadata can be read without an account, but its layer-tree API still requires authorization. Public links can therefore preview without signup; converting their individual layers into a Porter configurator will prompt for authorization.

## Technical details
- Use a small public server endpoint to request Figma’s public oEmbed metadata without exposing credentials.
- Keep preset definitions in one shared catalog module so listing and detail pages cannot drift.
- Pass the selected preset’s Figma URL into `/lab`; the lab will open the importer prefilled and try the public-link path first.
- Give every new page unique title, description, Open Graph, and Twitter metadata.
