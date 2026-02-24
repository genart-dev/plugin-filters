import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const DUOTONE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "darkColor",
    label: "Dark Color",
    type: "color",
    default: "#000033",
    group: "duotone",
  },
  {
    key: "lightColor",
    label: "Light Color",
    type: "color",
    default: "#ffcc00",
    group: "duotone",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "duotone",
  },
];

/** Parse a hex color to [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Linearly interpolate between two values. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const duotoneLayerType: LayerTypeDefinition = {
  typeId: "filter:duotone",
  displayName: "Duotone",
  icon: "palette",
  category: "filter",
  properties: DUOTONE_PROPERTIES,
  propertyEditorId: "filter:duotone-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of DUOTONE_PROPERTIES) {
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
    const darkColor = (properties.darkColor as string) ?? "#000033";
    const lightColor = (properties.lightColor as string) ?? "#ffcc00";
    const intensity = (properties.intensity as number) ?? 1.0;

    if (intensity <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const dark = hexToRgb(darkColor);
    const light = hexToRgb(lightColor);

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Convert to luminance
      const lum = (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) / 255;

      // Map luminance to duotone colors
      const dr = lerp(dark[0], light[0], lum);
      const dg = lerp(dark[1], light[1], lum);
      const db = lerp(dark[2], light[2], lum);

      // Blend with original based on intensity
      data[i] = Math.round(lerp(data[i]!, dr, intensity));
      data[i + 1] = Math.round(lerp(data[i + 1]!, dg, intensity));
      data[i + 2] = Math.round(lerp(data[i + 2]!, db, intensity));
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
