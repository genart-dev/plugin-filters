import type {
  LayerTypeDefinition,
  LayerPropertySchema,
  LayerProperties,
  LayerBounds,
  RenderResources,
  ValidationError,
} from "@genart-dev/core";

const HALFTONE_PROPERTIES: LayerPropertySchema[] = [
  {
    key: "dotSize",
    label: "Dot Size",
    type: "number",
    default: 6,
    min: 2,
    max: 30,
    step: 1,
    group: "halftone",
  },
  {
    key: "pattern",
    label: "Pattern",
    type: "select",
    default: "dot",
    options: [
      { value: "dot", label: "Dot" },
      { value: "line", label: "Line" },
      { value: "diamond", label: "Diamond" },
    ],
    group: "halftone",
  },
  {
    key: "angle",
    label: "Angle (degrees)",
    type: "number",
    default: 45,
    min: 0,
    max: 180,
    step: 1,
    group: "halftone",
  },
  {
    key: "intensity",
    label: "Intensity",
    type: "number",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
    group: "halftone",
  },
  {
    key: "dotColor",
    label: "Dot Color",
    type: "color",
    default: "#000000",
    group: "halftone",
  },
  {
    key: "bgColor",
    label: "Background Color",
    type: "color",
    default: "#ffffff",
    group: "halftone",
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

export const halftoneLayerType: LayerTypeDefinition = {
  typeId: "filter:halftone",
  displayName: "Halftone",
  icon: "halftone",
  category: "filter",
  properties: HALFTONE_PROPERTIES,
  propertyEditorId: "filter:halftone-editor",

  createDefault(): LayerProperties {
    const props: LayerProperties = {};
    for (const schema of HALFTONE_PROPERTIES) {
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
    const dotSize = Math.round((properties.dotSize as number) ?? 6);
    const pattern = (properties.pattern as string) ?? "dot";
    const angleDeg = (properties.angle as number) ?? 45;
    const intensity = (properties.intensity as number) ?? 1.0;
    const dotColorHex = (properties.dotColor as string) ?? "#000000";
    const bgColorHex = (properties.bgColor as string) ?? "#ffffff";

    if (intensity <= 0) return;

    const w = Math.ceil(bounds.width);
    const h = Math.ceil(bounds.height);
    if (w <= 0 || h <= 0) return;

    const dotColor = hexToRgb(dotColorHex);
    const bgColor = hexToRgb(bgColorHex);
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const imageData = ctx.getImageData(bounds.x, bounds.y, w, h);
    const data = imageData.data;

    // Read original luminance per cell
    const original = new Uint8ClampedArray(data);

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        // Rotate coordinates into halftone grid space
        const rx = px * cosA + py * sinA;
        const ry = -px * sinA + py * cosA;

        // Cell position within the grid
        const cellX = ((rx % dotSize) + dotSize) % dotSize;
        const cellY = ((ry % dotSize) + dotSize) % dotSize;

        // Sample luminance from cell center in original image
        const centerRx = rx - cellX + dotSize * 0.5;
        const centerRy = ry - cellY + dotSize * 0.5;
        const centerPx = Math.round(centerRx * cosA - centerRy * sinA);
        const centerPy = Math.round(centerRx * sinA + centerRy * cosA);
        const sx = Math.max(0, Math.min(w - 1, centerPx));
        const sy = Math.max(0, Math.min(h - 1, centerPy));
        const si = (sy * w + sx) * 4;
        const lum = (0.299 * original[si]! + 0.587 * original[si + 1]! + 0.114 * original[si + 2]!) / 255;

        // Normalized position in cell (0–1)
        const nx = cellX / dotSize;
        const ny = cellY / dotSize;

        // Distance metric depends on pattern
        let d: number;
        if (pattern === "dot") {
          const dx = nx - 0.5;
          const dy = ny - 0.5;
          d = Math.sqrt(dx * dx + dy * dy) * 2; // 0 at center, ~1 at edge
        } else if (pattern === "diamond") {
          d = (Math.abs(nx - 0.5) + Math.abs(ny - 0.5)) * 2;
        } else {
          // Line pattern — distance from horizontal center line
          d = Math.abs(ny - 0.5) * 2;
        }

        // Threshold: dark areas get larger dots (lower d threshold)
        const darkness = 1 - lum;
        const inDot = d < darkness;

        const i = (py * w + px) * 4;
        const targetR = inDot ? dotColor[0] : bgColor[0];
        const targetG = inDot ? dotColor[1] : bgColor[1];
        const targetB = inDot ? dotColor[2] : bgColor[2];

        data[i]     = Math.round(lerp(original[i]!, targetR, intensity));
        data[i + 1] = Math.round(lerp(original[i + 1]!, targetG, intensity));
        data[i + 2] = Math.round(lerp(original[i + 2]!, targetB, intensity));
      }
    }

    ctx.putImageData(imageData, bounds.x, bounds.y);
  },

  validate(properties: LayerProperties): ValidationError[] | null {
    const errors: ValidationError[] = [];
    const dotSize = properties.dotSize;
    if (typeof dotSize === "number" && (dotSize < 2 || dotSize > 30)) {
      errors.push({ property: "dotSize", message: "Dot size must be 2–30" });
    }
    return errors.length > 0 ? errors : null;
  },
};
