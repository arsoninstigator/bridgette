export type CatalogPreset = {
  slug: string;
  name: string;
  description: string;
  figmaUrl?: string;
  preview: "direct-message" | "group-chat" | "album" | "playlist" | "artist" | "article" | "search";
  editable: string[];
  locked: string[];
};

export type CatalogCollection = {
  slug: "imessage" | "spotify" | "wikipedia";
  name: string;
  eyebrow: string;
  description: string;
  href: "/catalog/imessage" | "/catalog/music/spotify" | "/catalog/wikipedia";
  accent: "blue" | "green" | "gray";
  presets: CatalogPreset[];
};

const IMESSAGE_URL = "https://www.figma.com/design/51YUiLmy5fO2M63fKD6FvO/Apple-chat-messages-~-iMessage--Community-?node-id=2002-456&t=VGIeyBY14HIehz6f-4";
const SPOTIFY_URL = "https://www.figma.com/design/O1F6TXqvfnwsbzpEIoMQ9b/Spotify-UI---Free-UI-Kit--Recreated---Community-?node-id=0-1685&t=bLhqFLm4Z4tpkczO-4";

export const CATALOG_COLLECTIONS: CatalogCollection[] = [
  {
    slug: "imessage",
    name: "iMessage",
    eyebrow: "messages",
    description: "Direct messages and group chats built from the iMessage frame you supplied.",
    href: "/catalog/imessage",
    accent: "blue",
    presets: [
      {
        slug: "direct-message",
        name: "Direct message",
        description: "A one-to-one conversation with editable names, bubbles, reactions, and timestamps.",
        figmaUrl: IMESSAGE_URL,
        preview: "direct-message",
        editable: ["contact name", "message text", "timestamps", "avatar", "reactions"],
        locked: ["phone chrome", "bubble geometry", "system controls"],
      },
      {
        slug: "group-chat",
        name: "Group chat",
        description: "A multi-person thread with participant avatars, sender labels, and group details.",
        figmaUrl: IMESSAGE_URL,
        preview: "group-chat",
        editable: ["group name", "participants", "message text", "avatars", "timestamps"],
        locked: ["phone chrome", "message spacing", "system controls"],
      },
    ],
  },
  {
    slug: "spotify",
    name: "Spotify",
    eyebrow: "music / spotify",
    description: "Album, playlist, and artist views from the Spotify UI frame you supplied.",
    href: "/catalog/music/spotify",
    accent: "green",
    presets: [
      {
        slug: "album-details",
        name: "Album details",
        description: "Album artwork, release details, track list, and playback information.",
        figmaUrl: SPOTIFY_URL,
        preview: "album",
        editable: ["cover artwork", "album title", "artist", "year", "tracks"],
        locked: ["player controls", "screen layout", "type hierarchy"],
      },
      {
        slug: "playlist-details",
        name: "Playlist details",
        description: "A playlist page with custom cover, curator, description, and track listing.",
        figmaUrl: SPOTIFY_URL,
        preview: "playlist",
        editable: ["playlist cover", "title", "curator", "description", "tracks"],
        locked: ["navigation", "play controls", "list structure"],
      },
      {
        slug: "artist-profile",
        name: "Artist profile",
        description: "An artist header with monthly listeners, popular tracks, and releases.",
        figmaUrl: SPOTIFY_URL,
        preview: "artist",
        editable: ["artist image", "artist name", "listeners", "popular tracks"],
        locked: ["profile layout", "navigation", "play controls"],
      },
    ],
  },
  {
    slug: "wikipedia",
    name: "Wikipedia",
    eyebrow: "reference",
    description: "Encyclopedia articles and search results, ready when you supply the source frame.",
    href: "/catalog/wikipedia",
    accent: "gray",
    presets: [
      {
        slug: "article",
        name: "Article page",
        description: "A structured article with title, lead, infobox, sections, references, and imagery.",
        preview: "article",
        editable: ["article title", "lead", "sections", "infobox", "images"],
        locked: ["site chrome", "article grid", "type hierarchy"],
      },
      {
        slug: "search-results",
        name: "Search results",
        description: "A Wikipedia search view with editable query, result titles, and excerpts.",
        preview: "search",
        editable: ["query", "result titles", "excerpts", "result count"],
        locked: ["site chrome", "result rhythm", "search layout"],
      },
    ],
  },
];

export function getCatalogCollection(slug: string) {
  return CATALOG_COLLECTIONS.find((collection) => collection.slug === slug);
}
