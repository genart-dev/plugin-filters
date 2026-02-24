import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const VIGNETTE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "vignette",
  },
  {
    key: "radius",
    label: "Radius",
    type: "number",
    default: 0.7,
    min: 0.1,
    max: 1.5,
    step: 0.01,
    group: "vignette",
  },
  {
    key: "softness",
    label: "Softness",
    type: "number",
    default: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    group: "vignette",
  },
  {
    key: "color",
    label: "Vignette Color",
    type: "color",
    default: "#000000",
    group: "vignette",
  },
];

export const vignetteLayerType: LayerTypeDefinition = {
  typeId: "filter:vignette",
  displayName: "Vignette",
  icon: "circle",
  category: "filter",
  properties: VIGNETTE_PROPERTIES,
  propertyEditorId: "filter:vignette-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of VIGNETTE_PROPERTIES) {
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
    const intensity = (properties.intensity as number) ?? 0.5;
    const radius = (properties.radius as number) ?? 0.7;
    const softness = (properties.softness as number) ?? 0.5;
    const color = (properties.color as string) ?? "#000000";

    if (intensity <= 0) return;

    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    const maxDim = Math.max(bounds.width, bounds.height);
    const innerRadius = maxDim * radius * (1 - softness);
    const outerRadius = maxDim * radius;

    // Parse hex color to extract RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},${intensity})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const intensity = properties.intensity;
    if (typeof intensity !== "number" || intensity < 0 || intensity > 1) {
      errors.push({ property: "intensity", message: "Intensity must be 0–1" });
    }
    const radius = properties.radius;
    if (typeof radius !== "number" || radius < 0.1 || radius > 1.5) {
      errors.push({ property: "radius", message: "Radius must be 0.1–1.5" });
    }
    return errors.length > 0 ? errors : null;
  },
};
