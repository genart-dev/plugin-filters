import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const BLUR_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "radius",
    label: "Blur Radius",
    type: "number",
    default: 4,
    min: 0,
    max: 50,
    step: 0.5,
    group: "blur",
  },
];

export const blurLayerType: LayerTypeDefinition = {
  typeId: "filter:blur",
  displayName: "Blur",
  icon: "droplets",
  category: "filter",
  properties: BLUR_PROPERTIES,
  propertyEditorId: "filter:blur-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of BLUR_PROPERTIES) {
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
    const radius = (properties.radius as number) ?? 4;
    if (radius <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    // Use canvas filter API for efficient Gaussian blur
    ctx.save();
    ctx.filter = `blur(${radius}px)`;

    // Draw the current region onto itself with the blur filter
    // We need to capture the region first, then redraw with blur
    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);

    // Create a temporary canvas to apply filter
    const tempCanvas = new OffscreenCanvas(w, h);
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.putImageData(imageData, 0, 0);

    // Clear the region and redraw with blur
    ctx.clearRect(bounds.x, bounds.y, w, h);
    ctx.drawImage(tempCanvas, bounds.x, bounds.y);
    ctx.restore();
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const radius = properties.radius;
    if (typeof radius !== "number" || radius < 0 || radius > 50) {
      errors.push({ property: "radius", message: "Blur radius must be 0–50" });
    }
    return errors.length > 0 ? errors : null;
  },
};
