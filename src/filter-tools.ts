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
  listFiltersTool,
];
