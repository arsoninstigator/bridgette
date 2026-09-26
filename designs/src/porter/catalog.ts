export type CatalogPreset = {
  slug: "imessage-chat" | "spotify-album-cover";
  name: string;
  category: string;
  description: string;
  figmaUrl?: string;
  accent: "blue" | "green";
  editable: string[];
  locked: string[];
};

export const CATALOG_PRESETS: CatalogPreset[] = [
  {
    slug: "imessage-chat",
    name: "iMessage chat",
    category: "social mockup",
    description: "Turn a familiar Messages conversation into a controlled chat configurator.",
    figmaUrl: "https://www.figma.com/design/51YUiLmy5fO2M63fKD6FvO/Apple-chat-messages-~-iMessage--Community-?node-id=2002-456&t=VGIeyBY14HIehz6f-4",
    accent: "blue",
    editable: ["contact name", "message text", "timestamps", "avatar"],
    locked: ["phone chrome", "bubble geometry", "spacing"],
  },
  {
    slug: "spotify-album-cover",
    name: "Spotify album cover",
    category: "music mockup",
    description: "Build a share-ready album screen while keeping the Spotify-style structure intact.",
    accent: "green",
    editable: ["cover artwork", "track title", "artist", "progress"],
    locked: ["player controls", "screen layout", "type hierarchy"],
  },
];

export function getCatalogPreset(slug: string) {
  return CATALOG_PRESETS.find((preset) => preset.slug === slug);
}
