import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const GRAIN_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 0.3,
    min: 0,
    max: 1,
    step: 0.01,
    group: "grain",
  },
  {
    key: "size",
    label: "Grain Size",
    type: "number",
    default: 1,
    min: 1,
    max: 5,
    step: 0.5,
    group: "grain",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "grain",
  },
  {
    key: "monochrome",
    label: "Monochrome",
    type: "boolean",
    default: true,
    group: "grain",
  },
];

/** Simple seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const grainLayerType: LayerTypeDefinition = {
  typeId: "filter:grain",
  displayName: "Film Grain",
  icon: "grain",
  category: "filter",
  properties: GRAIN_PROPERTIES,
  propertyEditorId: "filter:grain-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of GRAIN_PROPERTIES) {
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
    const intensity = (properties.intensity as number) ?? 0.3;
    const grainSize = (properties.size as number) ?? 1;
    const seed = (properties.seed as number) ?? 0;
    const monochrome = (properties.monochrome as boolean) ?? true;

    if (intensity <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;
    const rand = mulberry32(seed);
    const amount = intensity * 255;
    const step = Math.max(1, Math.round(grainSize));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const noise = (rand() - 0.5) * amount;
        // Apply to the block
        for (let dy = 0; dy < step && y + dy < h; dy++) {
          for (let dx = 0; dx < step && x + dx < w; dx++) {
            const i = ((y + dy) * w + (x + dx)) * 4;
            if (monochrome) {
              data[i] = Math.max(0, Math.min(255, data[i]! + noise));
              data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! + noise));
              data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! + noise));
            } else {
              data[i] = Math.max(0, Math.min(255, data[i]! + (rand() - 0.5) * amount));
              data[i + 1] = Math.max(0, Math.min(255, data[i + 1]! + (rand() - 0.5) * amount));
              data[i + 2] = Math.max(0, Math.min(255, data[i + 2]! + (rand() - 0.5) * amount));
            }
          }
        }
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
