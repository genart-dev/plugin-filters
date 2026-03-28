import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const THRESHOLD_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "threshold",
    label: "Threshold",
    type: "number",
    default: 128,
    min: 0,
    max: 255,
    step: 1,
    group: "threshold",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "threshold",
  },
  {
    key: "lowColor",
    label: "Low Color",
    type: "color",
    default: "#000000",
    group: "threshold",
  },
  {
    key: "highColor",
    label: "High Color",
    type: "color",
    default: "#ffffff",
    group: "threshold",
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const thresholdLayerType: LayerTypeDefinition = {
  typeId: "filter:threshold",
  displayName: "Threshold",
  icon: "threshold",
  category: "filter",
  properties: THRESHOLD_PROPERTIES,
  propertyEditorId: "filter:threshold-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of THRESHOLD_PROPERTIES) {
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
    const threshold = (properties.threshold as number) ?? 128;
    const intensity = (properties.intensity as number) ?? 1.0;
    const lowHex = (properties.lowColor as string) ?? "#000000";
    const highHex = (properties.highColor as string) ?? "#ffffff";

    if (intensity <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const low = hexToRgb(lowHex);
    const high = hexToRgb(highHex);

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      const target = lum >= threshold ? high : low;

      data[i]     = Math.round(lerp(data[i]!, target[0], intensity));
      data[i + 1] = Math.round(lerp(data[i + 1]!, target[1], intensity));
      data[i + 2] = Math.round(lerp(data[i + 2]!, target[2], intensity));
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const threshold = properties.threshold;
    if (typeof threshold === "number" && (threshold < 0 || threshold > 255)) {
      errors.push({ property: "threshold", message: "Threshold must be 0–255" });
    }
    return errors.length > 0 ? errors : null;
  },
};
