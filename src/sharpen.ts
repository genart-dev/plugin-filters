import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const SHARPEN_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "amount",
    label: "Amount",
    type: "number",
    default: 0.5,
    min: 0,
    max: 2,
    step: 0.01,
    group: "sharpen",
  },
  {
    key: "radius",
    label: "Radius",
    type: "number",
    default: 1,
    min: 1,
    max: 5,
    step: 1,
    group: "sharpen",
  },
];

export const sharpenLayerType: LayerTypeDefinition = {
  typeId: "filter:sharpen",
  displayName: "Sharpen",
  icon: "sharpen",
  category: "filter",
  properties: SHARPEN_PROPERTIES,
  propertyEditorId: "filter:sharpen-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of SHARPEN_PROPERTIES) {
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
    const amount = (properties.amount as number) ?? 0.5;
    const radius = Math.round((properties.radius as number) ?? 1);

    if (amount <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;

    // Copy original for reading (unsharp mask reads the original while writing to the same buffer)
    const original = new Uint8ClampedArray(data);

    // Unsharp mask: sharpen = original + amount * (original - blur)
    // Use a simple box blur as the reference
    const kernelSize = radius * 2 + 1;
    const kernelArea = kernelSize * kernelSize;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let sumR = 0, sumG = 0, sumB = 0;

        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const sx = Math.max(0, Math.min(w - 1, px + kx));
            const sy = Math.max(0, Math.min(h - 1, py + ky));
            const si = (sy * w + sx) * 4;
            sumR += original[si]!;
            sumG += original[si + 1]!;
            sumB += original[si + 2]!;
          }
        }

        const blurR = sumR / kernelArea;
        const blurG = sumG / kernelArea;
        const blurB = sumB / kernelArea;

        const i = (py * w + px) * 4;
        const origR = original[i]!;
        const origG = original[i + 1]!;
        const origB = original[i + 2]!;

        data[i]     = Math.max(0, Math.min(255, Math.round(origR + amount * (origR - blurR))));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(origG + amount * (origG - blurG))));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(origB + amount * (origB - blurB))));
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const amount = properties.amount;
    if (typeof amount === "number" && (amount < 0 || amount > 2)) {
      errors.push({ property: "amount", message: "Amount must be 0–2" });
    }
    return errors.length > 0 ? errors : null;
  },
};
