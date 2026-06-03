import type { AssetBase, AssetKind } from "./types";

let zCounter = 10;
export function nextZ() {
  return ++zCounter;
}

export function makeAsset(kind: AssetKind, x: number, y: number): AssetBase {
  const id = Math.random().toString(36).slice(2, 10);
  const rot = (Math.random() - 0.5) * 8;
  const base: AssetBase = { id, kind, x, y, rotation: rot, z: nextZ() };
  switch (kind) {
    case "sticky":
      return { ...base, front: "Write here…", back: "", color: "#fff59d", width: 180, height: 180 };
    case "polaroid":
      return { ...base, caption: "a moment", back: "", width: 200 };
    case "photostrip":
      return { ...base };
    case "photo":
      return { ...base, width: 220, height: 160, back: "" };
    case "paper":
      return { ...base, front: "A small note on torn paper.", back: "", color: "#fbf7ec", width: 220 };
    case "washi":
      return { ...base, width: 200, tapeColor: "rgba(180,160,210,0.75)", rotation: -8 };
    case "pin":
      return { ...base, pinEnabled: true };
    case "shape":
      return { ...base, shape: "rect", width: 140, height: 140, fill: "#c9b99a", rotation: 0 };
    case "icon":
      return { ...base, width: 64, height: 64, fill: "#1a1a1a", rotation: 0 };
    case "marquee":
      return {
        ...base,
        width: 320,
        height: 40,
        rotation: 0,
        iconText: "breaking news · breaking news · breaking news ·",
        iconSpeed: 18,
        iconBg: "#fef3c7",
        iconFg: "#1a1a1a",
      };
  }
}