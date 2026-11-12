import { describe, expect, test } from "bun:test";
import { convert, FORMATS, type Doc } from "./convert";
import { writeSketch } from "./sketch";
import JSZip from "jszip";

const namesOnly: Doc = { name: "sample.ai", width: 1, height: 1, originX: 0, originY: 0, rootIds: ["one"], layers: [
  { id: "one", name: "Artwork", path: "Artwork", depth: 0, kind: "other", visible: true, policy: "locked", editable: {}, childrenIds: [], meta: {} },
] };

describe("honest design-file exports", () => {
  test("names-only AI/EPS documents cannot produce blank image exports", async () => {
    await expect(convert(namesOnly, "tiff")).rejects.toThrow("layer names only");
    await expect(convert(namesOnly, "sketch")).rejects.toThrow("layer names only");
    expect((await convert(namesOnly, "json")).filename).toBe("sample.json");
  });
  test("Sketch and TIFF are export targets, not unsupported native FIG or XD", () => {
    expect(FORMATS.find((format) => format.id === "sketch")?.ext).toBe("sketch");
    expect(FORMATS.find((format) => format.id === "tiff")?.ext).toBe("tiff");
    expect(FORMATS.some((format) => ["fig", "xd"].includes(format.ext))).toBe(false);
  });
  test("Sketch archive preserves separate named raster layers and page references", async () => {
    const blob = await writeSketch("Design", 64, 48, [{ name: "Photo", x: 10, y: 12, width: 20, height: 22, png: new Blob([new Uint8Array([137, 80, 78, 71])]) }]);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const docFile = zip.file("document.json");
    if (!docFile) throw new Error("missing document");
    const doc = JSON.parse(await docFile.async("text"));
    const pageFile = zip.file(`${doc.pages[0]._ref}.json`);
    if (!pageFile) throw new Error("missing page");
    const page = JSON.parse(await pageFile.async("text"));
    expect(page.layers[0].name).toBe("Photo");
    expect(page.layers[0].frame).toMatchObject({ x: 10, y: 12, width: 20, height: 22 });
    expect(zip.file(page.layers[0].image._ref)).not.toBeNull();
  });
});