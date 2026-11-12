import JSZip from "jszip";

type RasterLayer = { name: string; x: number; y: number; width: number; height: number; png: Blob };

// Sketch document version 121: https://developer.sketch.com/file-format/
export async function writeSketch(name: string, width: number, height: number, layers: RasterLayer[]): Promise<Blob> {
  const zip = new JSZip();
  const id = () => crypto.randomUUID().toUpperCase();
  const pageId = id();
  const frame = (x: number, y: number, w: number, h: number) => ({ _class: "rect", constrainProportions: false, x, y, width: w, height: h });
  const base = (layerName: string, x: number, y: number, w: number, h: number) => ({
    do_objectID: id(), name: layerName, booleanOperation: -1,
    exportOptions: { _class: "exportOptions", exportFormats: [], includedLayerIds: [], layerOptions: 0, shouldTrim: false },
    frame: frame(x, y, w, h), isFixedToViewport: false, isFlippedHorizontal: false, isFlippedVertical: false,
    isLocked: false, isTemplate: false, isVisible: true, layerListExpandedType: 0, nameIsFixed: false,
    resizingConstraint: 63, resizingType: 0, rotation: 0, shouldBreakMaskChain: false,
  });
  const bitmaps = await Promise.all(layers.map(async (layer) => {
    const image = `images/${id()}.png`;
    zip.file(image, await layer.png.arrayBuffer());
    return { ...base(layer.name, layer.x, layer.y, layer.width, layer.height), _class: "bitmap",
      clippingMask: "{{0, 0}, {1, 1}}", fillReplacesImage: false, intendedDPI: 72,
      image: { _class: "MSJSONFileReference", _ref_class: "MSImageData", _ref: image } };
  }));
  const page = { ...base(name, 0, 0, width, height), do_objectID: pageId, _class: "page", layers: bitmaps,
    hasClickThrough: true, horizontalRulerData: { _class: "rulerData", base: 0, guides: [] },
    verticalRulerData: { _class: "rulerData", base: 0, guides: [] } };
  const document = { _class: "document", do_objectID: id(), colorSpace: 0, currentPageIndex: 0,
    assets: { _class: "assetCollection", do_objectID: id(), colorAssets: [], gradientAssets: [], images: [], colors: [], gradients: [], exportPresets: [] },
    foreignLayerStyles: [], foreignSymbols: [], foreignTextStyles: [], perDocumentLibraries: [],
    layerStyles: { _class: "sharedStyleContainer", objects: [] }, layerTextStyles: { _class: "sharedStyleContainer", objects: [] },
    pages: [{ _class: "MSJSONFileReference", _ref_class: "MSImmutablePage", _ref: `pages/${pageId}` }] };
  const created = { commit: "", appVersion: "59", build: 86127, app: "com.bohemiancoding.sketch3", compatibilityVersion: 99, version: 121, variant: "NONAPPSTORE" };
  const meta = { ...created, created, autosaved: 0, saveHistory: [], pagesAndArtboards: { [pageId]: { name, artboards: {} } } };
  zip.file("document.json", JSON.stringify(document));
  zip.file("meta.json", JSON.stringify(meta));
  zip.file("user.json", JSON.stringify({ document: { pageListHeight: 0, pageListCollapsed: 0 } }));
  zip.file(`pages/${pageId}.json`, JSON.stringify(page));
  return zip.generateAsync({ type: "blob", mimeType: "application/zip", compression: "DEFLATE" });
}