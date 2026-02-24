import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const CHROMATIC_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "offsetX",
    label: "Horizontal Offset",
    type: "number",
    default: 3,
    min: -20,
    max: 20,
    step: 0.5,
    group: "chromatic",
  },
  {
    key: "offsetY",
    label: "Vertical Offset",
    type: "number",
    default: 0,
    min: -20,
    max: 20,
    step: 0.5,
    group: "chromatic",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "chromatic",
  },
];

export const chromaticAberrationLayerType: LayerTypeDefinition = {
  typeId: "filter:chromatic-aberration",
  displayName: "Chromatic Aberration",
  icon: "rainbow",
  category: "filter",
  properties: CHROMATIC_PROPERTIES,
  propertyEditorId: "filter:chromatic-aberration-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of CHROMATIC_PROPERTIES) {
      props[schema.key] = schema.default;
    }
    return props;
  },

  render(
    properties: LayerProperties,
    ctx: CanvasRenderingContext2D,
    bounds: LayerBounds,
    _resources: RenderResources,
  ): void {
    const offsetX = (properties.offsetX as number) ?? 3;
    const offsetY = (properties.offsetY as number) ?? 0;
    const intensity = (properties.intensity as number) ?? 1.0;

    if (intensity <= 0 || (offsetX === 0 && offsetY === 0)) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const ox = Math.round(offsetX * intensity);
    const oy = Math.round(offsetY * intensity);

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dstIdx = (y * w + x) * 4;

        // Red channel: shift in positive direction
        const rx = Math.max(0, Math.min(w - 1, x + ox));
        const ry = Math.max(0, Math.min(h - 1, y + oy));
        const rIdx = (ry * w + rx) * 4;
        dst[dstIdx] = src[rIdx]!;

        // Green channel: no shift (stays in place)
        dst[dstIdx + 1] = src[dstIdx + 1]!;

        // Blue channel: shift in negative direction
        const bx = Math.max(0, Math.min(w - 1, x - ox));
        const by = Math.max(0, Math.min(h - 1, y - oy));
        const bIdx = (by * w + bx) * 4;
        dst[dstIdx + 2] = src[bIdx + 2]!;

        // Alpha: keep original
        dst[dstIdx + 3] = src[dstIdx + 3]!;
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const intensity = properties.intensity;
    if (typeof intensity !== "number" || intensity < 0 || intensity > 1) {
      errors.push({ property: "intensity", message: "Intensity must be 0–1" });
    }
    return errors.length > 0 ? errors : null;
  },
};
