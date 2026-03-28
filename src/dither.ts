import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const DITHER_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "method",
    label: "Method",
    type: "select",
    default: "floyd-steinberg",
    options: [
      { value: "floyd-steinberg", label: "Floyd-Steinberg" },
      { value: "ordered", label: "Ordered (Bayer)" },
      { value: "random", label: "Random" },
    ],
    group: "dither",
  },
  {
    key: "levels",
    label: "Color Levels",
    type: "number",
    default: 2,
    min: 2,
    max: 16,
    step: 1,
    group: "dither",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "dither",
  },
  {
    key: "seed",
    label: "Seed",
    type: "number",
    default: 0,
    min: 0,
    max: 99999,
    step: 1,
    group: "dither",
  },
];

// 4x4 Bayer matrix for ordered dithering
const BAYER_4X4 = [
  [ 0, 8, 2, 10],
  [12, 4, 14,  6],
  [ 3, 11, 1,  9],
  [15, 7, 13,  5],
];

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function quantize(value: number, levels: number): number {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

export const ditherLayerType: LayerTypeDefinition = {
  typeId: "filter:dither",
  displayName: "Dither",
  icon: "dither",
  category: "filter",
  properties: DITHER_PROPERTIES,
  propertyEditorId: "filter:dither-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of DITHER_PROPERTIES) {
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
    const method = (properties.method as string) ?? "floyd-steinberg";
    const levels = Math.round((properties.levels as number) ?? 2);
    const intensity = (properties.intensity as number) ?? 1.0;
    const seed = (properties.seed as number) ?? 0;

    if (intensity <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;

    // Keep original for intensity blending
    const original = new Uint8ClampedArray(data);

    if (method === "ordered") {
      // Ordered (Bayer) dithering
      const matrixSize = 4;
      const matrixScale = 16; // 4x4 matrix has 16 values

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const threshold = (BAYER_4X4[py % matrixSize]![px % matrixSize]! / matrixScale - 0.5) * (255 / levels);
          const i = (py * w + px) * 4;
          for (let c = 0; c < 3; c++) {
            data[i + c] = Math.max(0, Math.min(255, quantize(data[i + c]! + threshold, levels)));
          }
        }
      }
    } else if (method === "random") {
      // Random dithering
      const rand = mulberry32(seed);
      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          const noise = (rand() - 0.5) * (255 / levels);
          data[i + c] = Math.max(0, Math.min(255, quantize(data[i + c]! + noise, levels)));
        }
      }
    } else {
      // Floyd-Steinberg error diffusion
      // Work with float buffer to accumulate error
      const floats = new Float32Array(w * h * 3);
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          const fi = (py * w + px) * 3;
          floats[fi]     = data[i]!;
          floats[fi + 1] = data[i + 1]!;
          floats[fi + 2] = data[i + 2]!;
        }
      }

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const fi = (py * w + px) * 3;
          for (let c = 0; c < 3; c++) {
            const oldVal = floats[fi + c]!;
            const newVal = quantize(Math.max(0, Math.min(255, oldVal)), levels);
            floats[fi + c] = newVal;
            const error = oldVal - newVal;

            // Distribute error to neighbors
            if (px + 1 < w)
              floats[fi + 3 + c] = floats[fi + 3 + c]! + error * (7 / 16);
            if (py + 1 < h) {
              if (px > 0)
                floats[((py + 1) * w + px - 1) * 3 + c] = floats[((py + 1) * w + px - 1) * 3 + c]! + error * (3 / 16);
              floats[((py + 1) * w + px) * 3 + c] = floats[((py + 1) * w + px) * 3 + c]! + error * (5 / 16);
              if (px + 1 < w)
                floats[((py + 1) * w + px + 1) * 3 + c] = floats[((py + 1) * w + px + 1) * 3 + c]! + error * (1 / 16);
            }
          }
        }
      }

      // Write back
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          const fi = (py * w + px) * 3;
          data[i]     = Math.max(0, Math.min(255, Math.round(floats[fi]!)));
          data[i + 1] = Math.max(0, Math.min(255, Math.round(floats[fi + 1]!)));
          data[i + 2] = Math.max(0, Math.min(255, Math.round(floats[fi + 2]!)));
        }
      }
    }

    // Blend with original based on intensity
    if (intensity < 1) {
      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          data[i + c] = Math.round(original[i + c]! + (data[i + c]! - original[i + c]!) * intensity);
        }
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const levels = properties.levels;
    if (typeof levels === "number" && (levels < 2 || levels > 16)) {
      errors.push({ property: "levels", message: "Levels must be 2–16" });
    }
    return errors.length > 0 ? errors : null;
  },
};
