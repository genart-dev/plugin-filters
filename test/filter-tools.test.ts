import { describe, it, expect, vi } from "vitest";
import {
  applyGrainTool,
  applyVignetteTool,
  applyDuotoneTool,
  applyBlurTool,
  applyChromaticAberrationTool,
  listFiltersTool,
} from "../src/filter-tools.js";
import type {
  McpToolContext,
  DesignLayer,
  LayerStackAccessor,
} from "@genart-dev/core";

function createMockContext(): McpToolContext {
  const layers: DesignLayer[] = [];

  const accessor: LayerStackAccessor = {
    getAll: () => layers,
    get: (id: string) => layers.find((l) => l.id === id) ?? null,
    add: vi.fn((layer: DesignLayer) => layers.push(layer)),
    remove: vi.fn(),
    updateProperties: vi.fn(),
    updateTransform: vi.fn(),
    updateBlend: vi.fn(),
    reorder: vi.fn(),
    duplicate: vi.fn(() => "dup-id"),
    count: layers.length,
  };

  return {
    layers: accessor,
    sketchState: {
      seed: 42,
      params: {},
      colorPalette: [],
      canvasWidth: 800,
      canvasHeight: 600,
      rendererId: "canvas2d",
    },
    canvasWidth: 800,
    canvasHeight: 600,
    resolveAsset: vi.fn(async () => null),
    captureComposite: vi.fn(async () => Buffer.from("")),
    emitChange: vi.fn(),
  };
}

describe("filter MCP tools", () => {
  it("apply_grain creates a grain layer", async () => {
    const ctx = createMockContext();
    const result = await applyGrainTool.handler({ intensity: 0.5 }, ctx);

    expect(result.isError).toBeUndefined();
    expect(ctx.layers.add).toHaveBeenCalled();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("filter:grain");
    expect(layer.properties.intensity).toBe(0.5);
    expect(ctx.emitChange).toHaveBeenCalledWith("layer-added");
  });

  it("apply_vignette creates a vignette layer", async () => {
    const ctx = createMockContext();
    const result = await applyVignetteTool.handler(
      { intensity: 0.8, color: "#110022" },
      ctx,
    );

    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("filter:vignette");
    expect(layer.properties.color).toBe("#110022");
  });

  it("apply_duotone creates a duotone layer", async () => {
    const ctx = createMockContext();
    const result = await applyDuotoneTool.handler(
      { darkColor: "#001122", lightColor: "#ffee00" },
      ctx,
    );

    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("filter:duotone");
    expect(layer.properties.darkColor).toBe("#001122");
  });

  it("apply_blur creates a blur layer", async () => {
    const ctx = createMockContext();
    const result = await applyBlurTool.handler({ radius: 8 }, ctx);

    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("filter:blur");
    expect(layer.properties.radius).toBe(8);
  });

  it("apply_chromatic_aberration creates layer", async () => {
    const ctx = createMockContext();
    const result = await applyChromaticAberrationTool.handler(
      { offsetX: 5, intensity: 0.7 },
      ctx,
    );

    expect(result.isError).toBeUndefined();
    const layer = (ctx.layers.add as ReturnType<typeof vi.fn>).mock.calls[0]![0] as DesignLayer;
    expect(layer.type).toBe("filter:chromatic-aberration");
    expect(layer.properties.offsetX).toBe(5);
  });

  it("list_filters returns all filter types", async () => {
    const ctx = createMockContext();
    const result = await listFiltersTool.handler({}, ctx);

    expect(result.isError).toBeUndefined();
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain("Film Grain");
    expect(text).toContain("Vignette");
    expect(text).toContain("Duotone");
    expect(text).toContain("Blur");
    expect(text).toContain("Chromatic Aberration");
  });
});
