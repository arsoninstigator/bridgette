export type CatalogTemplate = {
  slug: string;
  name: string;
  description: string;
  figmaUrl?: string;
  preview: "direct-message" | "group-chat" | "album" | "playlist" | "artist" | "article" | "search" | "instagram-profile" | "instagram-post" | "instagram-caption" | "instagram-carousel" | "instagram-story" | "twitter-profile" | "twitter-post" | "twitter-thread" | "twitter-quote";
  editable: string[];
  locked: string[];
};

export type CatalogCollection = {
  slug: "imessage" | "spotify" | "wikipedia" | "instagram" | "twitter";
  name: string;
  eyebrow: string;
  description: string;
  href: "/catalog/imessage" | "/catalog/music/spotify" | "/catalog/wikipedia" | "/catalog/instagram" | "/catalog/twitter";
  accent: "blue" | "green" | "gray" | "pink";
  templates: CatalogTemplate[];
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
    templates: [
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
    templates: [
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
    slug: "instagram",
    name: "Instagram",
    eyebrow: "social / instagram",
    description: "Profiles, posts, captions, carousels, and stories ready to connect to the right source frames.",
    href: "/catalog/instagram",
    accent: "pink",
    templates: [
      {
        slug: "profile",
        name: "Profile",
        description: "A complete profile header with avatar, bio, counts, highlights, and post grid.",
        preview: "instagram-profile",
        editable: ["avatar", "display name", "bio", "counts", "highlight covers"],
        locked: ["profile layout", "navigation chrome", "grid geometry"],
      },
      {
        slug: "post",
        name: "Image post",
        description: "A feed post with account details, media, engagement, caption, and timestamp.",
        preview: "instagram-post",
        editable: ["account", "profile image", "post image", "likes", "caption"],
        locked: ["post proportions", "action controls", "feed structure"],
      },
      {
        slug: "caption",
        name: "Post caption",
        description: "A text-led caption treatment with account, copy, hashtags, mentions, and engagement.",
        preview: "instagram-caption",
        editable: ["username", "caption", "hashtags", "mentions", "like count"],
        locked: ["caption rhythm", "action controls", "type hierarchy"],
      },
      {
        slug: "carousel",
        name: "Carousel post",
        description: "A multi-slide post with editable imagery, pagination, caption, and engagement details.",
        preview: "instagram-carousel",
        editable: ["slide images", "slide count", "caption", "account", "likes"],
        locked: ["carousel proportions", "pagination position", "action controls"],
      },
      {
        slug: "story",
        name: "Story",
        description: "A vertical story with account details, media, overlay copy, mentions, and stickers.",
        preview: "instagram-story",
        editable: ["story media", "account", "overlay text", "mentions", "stickers"],
        locked: ["story ratio", "progress bar", "reply controls"],
      },
    ],
  },
  {
    slug: "twitter",
    name: "Twitter",
    eyebrow: "social / twitter",
    description: "Profiles, posts, threads, and quote posts ready to connect to the right source frames.",
    href: "/catalog/twitter",
    accent: "blue",
    templates: [
      {
        slug: "profile",
        name: "Profile",
        description: "A profile header with cover image, avatar, bio, metadata, counts, and tabs.",
        preview: "twitter-profile",
        editable: ["cover image", "avatar", "name", "handle", "bio", "counts"],
        locked: ["profile layout", "navigation", "tab structure"],
      },
      {
        slug: "post",
        name: "Single post",
        description: "A standalone post with author details, copy, media, timestamp, and engagement.",
        preview: "twitter-post",
        editable: ["author", "handle", "post copy", "media", "timestamp", "counts"],
        locked: ["post structure", "action row", "type hierarchy"],
      },
      {
        slug: "thread",
        name: "Thread",
        description: "A connected sequence of posts with replies, media, timestamps, and engagement.",
        preview: "twitter-thread",
        editable: ["author", "thread posts", "media", "timestamps", "counts"],
        locked: ["thread connector", "post spacing", "action rows"],
      },
      {
        slug: "quote-post",
        name: "Quote post",
        description: "A post containing another post, with separate author, copy, media, and metrics.",
        preview: "twitter-quote",
        editable: ["commentary", "quoted author", "quoted copy", "media", "counts"],
        locked: ["nested post frame", "action row", "post geometry"],
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
    templates: [
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
