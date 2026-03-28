import type {
  McpToolDefinition,
  McpToolContext,
  McpToolResult,
  JsonSchema,
  DesignLayer,
  LayerTransform,
} from "@genart-dev/core";
import { grainLayerType } from "./grain.js";
import { vignetteLayerType } from "./vignette.js";
import { duotoneLayerType } from "./duotone.js";
import { blurLayerType } from "./blur.js";
import { chromaticAberrationLayerType } from "./chromatic-aberration.js";
import { halftoneLayerType } from "./halftone.js";
import { posterizeLayerType } from "./posterize.js";
import { ditherLayerType } from "./dither.js";
import { sharpenLayerType } from "./sharpen.js";
import { thresholdLayerType } from "./threshold.js";

function textResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }] };
}

function errorResult(text: string): McpToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function generateLayerId(): string {
  return `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fullCanvasTransform(ctx: McpToolContext): LayerTransform {
  return {
    x: 0,
    y: 0,
    width: ctx.canvasWidth,
    height: ctx.canvasHeight,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0,
    anchorY: 0,
  };
}

function createFilterLayer(
  typeId: string,
  name: string,
  properties: Record<string, unknown>,
  ctx: McpToolContext,
): DesignLayer {
  return {
    id: generateLayerId(),
    type: typeId,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal",
    transform: fullCanvasTransform(ctx),
    properties,
  };
}

export const applyGrainTool: McpToolDefinition = {
  name: "apply_grain",
  description: "Add a film grain filter layer over the canvas.",
  inputSchema: {
    type: "object",
    properties: {
      intensity: {
        type: "number",
        description: "Grain intensity 0–1 (default: 0.3).",
      },
      size: {
        type: "number",
        description: "Grain size 1–5 (default: 1).",
      },
      seed: {
        type: "number",
        description: "Random seed for deterministic grain (default: 0).",
      },
      monochrome: {
        type: "boolean",
        description: "Monochrome grain (default: true).",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const defaults = grainLayerType.createDefault();
    const properties = { ...defaults, ...input };
    const layer = createFilterLayer("filter:grain", "Film Grain", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added film grain layer '${layer.id}'.`);
  },
};

export const applyVignetteTool: McpToolDefinition = {
  name: "apply_vignette",
  description: "Add a vignette filter layer that darkens the edges of the canvas.",
  inputSchema: {
    type: "object",
    properties: {
      intensity: {
        type: "number",
        description: "Vignette intensity 0–1 (default: 0.5).",
      },
      radius: {
        type: "number",
        description: "Vignette radius 0.1–1.5 (default: 0.7).",
      },
      softness: {
        type: "number",
        description: "Edge softness 0–1 (default: 0.5).",
      },
      color: {
        type: "string",
        description: "Vignette color as hex (default: '#000000').",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const defaults = vignetteLayerType.createDefault();
    const properties = { ...defaults, ...input };
    const layer = createFilterLayer("filter:vignette", "Vignette", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added vignette layer '${layer.id}'.`);
  },
};

export const applyDuotoneTool: McpToolDefinition = {
  name: "apply_duotone",
  description: "Add a duotone color mapping filter layer.",
  inputSchema: {
    type: "object",
    properties: {
      darkColor: {
        type: "string",
        description: "Dark tone color as hex (default: '#000033').",
      },
      lightColor: {
        type: "string",
        description: "Light tone color as hex (default: '#ffcc00').",
      },
      intensity: {
        type: "number",
        description: "Effect intensity 0–1 (default: 1.0).",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const defaults = duotoneLayerType.createDefault();
    const properties = { ...defaults, ...input };
    const layer = createFilterLayer("filter:duotone", "Duotone", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added duotone layer '${layer.id}'.`);
  },
};

export const applyBlurTool: McpToolDefinition = {
  name: "apply_blur",
  description: "Add a Gaussian blur filter layer.",
  inputSchema: {
    type: "object",
    properties: {
      radius: {
        type: "number",
        description: "Blur radius in pixels 0–50 (default: 4).",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const defaults = blurLayerType.createDefault();
    const properties = { ...defaults, ...input };
    const layer = createFilterLayer("filter:blur", "Blur", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added blur layer '${layer.id}'.`);
  },
};

export const applyChromaticAberrationTool: McpToolDefinition = {
  name: "apply_chromatic_aberration",
  description: "Add a chromatic aberration (RGB split) filter layer.",
  inputSchema: {
    type: "object",
    properties: {
      offsetX: {
        type: "number",
        description: "Horizontal pixel offset (default: 3).",
      },
      offsetY: {
        type: "number",
        description: "Vertical pixel offset (default: 0).",
      },
      intensity: {
        type: "number",
        description: "Effect intensity 0–1 (default: 1.0).",
      },
    },
  } satisfies JsonSchema,

  async handler(
    input: Record<string, unknown>,
    context: McpToolContext,
  ): Promise<McpToolResult> {
    const defaults = chromaticAberrationLayerType.createDefault();
    const properties = { ...defaults, ...input };
    const layer = createFilterLayer(
      "filter:chromatic-aberration",
      "Chromatic Aberration",
      properties,
      context,
    );
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added chromatic aberration layer '${layer.id}'.`);
  },
};

export const applyHalftoneTool: McpToolDefinition = {
  name: "apply_halftone",
  description: "Add a halftone filter layer (dot, line, or diamond pattern).",
  inputSchema: {
    type: "object",
    properties: {
      dotSize:  { type: "number", description: "Dot/cell size 2–30 px (default: 6)." },
      pattern:  { type: "string", enum: ["dot", "line", "diamond"], description: 'Pattern type (default: "dot").' },
      angle:    { type: "number", description: "Rotation angle 0–180 degrees (default: 45)." },
      intensity: { type: "number", description: "Effect intensity 0–1 (default: 1.0)." },
      dotColor: { type: "string", description: 'Dot color hex (default: "#000000").' },
      bgColor:  { type: "string", description: 'Background color hex (default: "#ffffff").' },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const defaults = halftoneLayerType.createDefault();
    const properties = { ...defaults, ...filterKnown(input, ["dotSize", "pattern", "angle", "intensity", "dotColor", "bgColor"]) };
    const layer = createFilterLayer("filter:halftone", "Halftone", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added halftone layer '${layer.id}' (pattern: ${properties.pattern}).`);
  },
};

export const applyPosterizeTool: McpToolDefinition = {
  name: "apply_posterize",
  description: "Add a posterize filter layer that reduces the number of color levels.",
  inputSchema: {
    type: "object",
    properties: {
      levels:    { type: "number", description: "Color levels 2–32 (default: 4)." },
      intensity: { type: "number", description: "Effect intensity 0–1 (default: 1.0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const defaults = posterizeLayerType.createDefault();
    const properties = { ...defaults, ...filterKnown(input, ["levels", "intensity"]) };
    const layer = createFilterLayer("filter:posterize", "Posterize", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added posterize layer '${layer.id}' (levels: ${properties.levels}).`);
  },
};

export const applyDitherTool: McpToolDefinition = {
  name: "apply_dither",
  description: "Add a dither filter layer (Floyd-Steinberg, ordered/Bayer, or random).",
  inputSchema: {
    type: "object",
    properties: {
      method:    { type: "string", enum: ["floyd-steinberg", "ordered", "random"], description: 'Dither method (default: "floyd-steinberg").' },
      levels:    { type: "number", description: "Color levels 2–16 (default: 2)." },
      intensity: { type: "number", description: "Effect intensity 0–1 (default: 1.0)." },
      seed:      { type: "number", description: "Random seed for random dither (default: 0)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const defaults = ditherLayerType.createDefault();
    const properties = { ...defaults, ...filterKnown(input, ["method", "levels", "intensity", "seed"]) };
    const layer = createFilterLayer("filter:dither", "Dither", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added dither layer '${layer.id}' (method: ${properties.method}).`);
  },
};

export const applySharpenTool: McpToolDefinition = {
  name: "apply_sharpen",
  description: "Add an unsharp mask sharpening filter layer.",
  inputSchema: {
    type: "object",
    properties: {
      amount: { type: "number", description: "Sharpening amount 0–2 (default: 0.5)." },
      radius: { type: "number", description: "Blur radius 1–5 px (default: 1)." },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const defaults = sharpenLayerType.createDefault();
    const properties = { ...defaults, ...filterKnown(input, ["amount", "radius"]) };
    const layer = createFilterLayer("filter:sharpen", "Sharpen", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added sharpen layer '${layer.id}'.`);
  },
};

export const applyThresholdTool: McpToolDefinition = {
  name: "apply_threshold",
  description: "Add a threshold filter layer that converts to binary black/white (or custom colors).",
  inputSchema: {
    type: "object",
    properties: {
      threshold: { type: "number", description: "Luminance threshold 0–255 (default: 128)." },
      intensity: { type: "number", description: "Effect intensity 0–1 (default: 1.0)." },
      lowColor:  { type: "string", description: 'Color for dark values hex (default: "#000000").' },
      highColor: { type: "string", description: 'Color for light values hex (default: "#ffffff").' },
    },
  } satisfies JsonSchema,

  async handler(input: Record<string, unknown>, context: McpToolContext): Promise<McpToolResult> {
    const defaults = thresholdLayerType.createDefault();
    const properties = { ...defaults, ...filterKnown(input, ["threshold", "intensity", "lowColor", "highColor"]) };
    const layer = createFilterLayer("filter:threshold", "Threshold", properties, context);
    context.layers.add(layer);
    context.emitChange("layer-added");
    return textResult(`Added threshold layer '${layer.id}'.`);
  },
};

function filterKnown(input: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (input[k] !== undefined) out[k] = input[k];
  }
  return out;
}

export const listFiltersTool: McpToolDefinition = {
  name: "list_filters",
  description: "List all available filter types and their configurable properties.",
  inputSchema: {
    type: "object",
    properties: {},
  } satisfies JsonSchema,

  async handler(
    _input: Record<string, unknown>,
    _context: McpToolContext,
  ): Promise<McpToolResult> {
    const filters = [
      grainLayerType,
      vignetteLayerType,
      duotoneLayerType,
      blurLayerType,
      chromaticAberrationLayerType,
      halftoneLayerType,
      posterizeLayerType,
      ditherLayerType,
      sharpenLayerType,
      thresholdLayerType,
    ];
    const lines = filters.map((f) => {
      const props = f.properties.map((p) => p.key).join(", ");
      return `• ${f.displayName} (${f.typeId}) — properties: ${props}`;
    });
    return textResult(`Available filters:\n${lines.join("\n")}`);
  },
};

export const filterMcpTools: McpToolDefinition[] = [
  applyGrainTool,
  applyVignetteTool,
  applyDuotoneTool,
  applyBlurTool,
  applyChromaticAberrationTool,
  applyHalftoneTool,
  applyPosterizeTool,
  applyDitherTool,
  applySharpenTool,
  applyThresholdTool,
  listFiltersTool,
];
