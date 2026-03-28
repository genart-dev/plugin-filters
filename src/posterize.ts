import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const POSTERIZE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "levels",
    label: "Color Levels",
    type: "number",
    default: 4,
    min: 2,
    max: 32,
    step: 1,
    group: "posterize",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "posterize",
  },
];

export const posterizeLayerType: LayerTypeDefinition = {
  typeId: "filter:posterize",
  displayName: "Posterize",
  icon: "posterize",
  category: "filter",
  properties: POSTERIZE_PROPERTIES,
  propertyEditorId: "filter:posterize-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of POSTERIZE_PROPERTIES) {
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
    const levels = Math.round((properties.levels as number) ?? 4);
    const intensity = (properties.intensity as number) ?? 1.0;

    if (intensity <= 0 || levels >= 256) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;
    const step = 255 / (levels - 1);

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const original = data[i + c]!;
        const posterized = Math.round(Math.round(original / step) * step);
        data[i + c] = Math.round(original + (posterized - original) * intensity);
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const levels = properties.levels;
    if (typeof levels === "number" && (levels < 2 || levels > 32)) {
      errors.push({ property: "levels", message: "Levels must be 2–32" });
    }
    return errors.length > 0 ? errors : null;
  },
};
