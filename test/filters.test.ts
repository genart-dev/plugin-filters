import { describe, it, expect, vi } from "vitest";
import filtersPlugin from "../src/index.js";
import { grainLayerType } from "../src/grain.js";
import { vignetteLayerType } from "../src/vignette.js";
import { duotoneLayerType } from "../src/duotone.js";
import { blurLayerType } from "../src/blur.js";
import { chromaticAberrationLayerType } from "../src/chromatic-aberration.js";
import type { LayerBounds, RenderResources } from "@genart-dev/core";

const BOUNDS: LayerBounds = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

const RESOURCES: RenderResources = {
  getFont: () => null,
  getImage: () => null,
  theme: "dark",
  pixelRatio: 1,
};

function createMockImageData(w: number, h: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  // Fill with a mid-gray
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128;     // R
    data[i + 1] = 128; // G
    data[i + 2] = 128; // B
    data[i + 3] = 255; // A
  }
  return { data, width: w, height: h, colorSpace: "srgb" } as ImageData;
}

function createMockCtx(imageData?: ImageData) {
  const id = imageData ?? createMockImageData(100, 100);
  return {
    save: vi.fn(),
    restore: vi.fn(),
    getImageData: vi.fn(() => id),
    putImageData: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fillStyle: "" as string | CanvasGradient,
    filter: "",
  } as unknown as CanvasRenderingContext2D;
}

describe("filters plugin", () => {
  it("exports a valid DesignPlugin object", () => {
    expect(filtersPlugin.id).toBe("filters");
    expect(filtersPlugin.tier).toBe("free");
    expect(filtersPlugin.layerTypes).toHaveLength(5);
    expect(filtersPlugin.mcpTools).toHaveLength(6);
  });

  it("all layer types have unique typeIds", () => {
    const ids = filtersPlugin.layerTypes.map((t) => t.typeId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("grainLayerType", () => {
  it("has correct metadata", () => {
    expect(grainLayerType.typeId).toBe("filter:grain");
    expect(grainLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = grainLayerType.createDefault();
    expect(d.intensity).toBe(0.3);
    expect(d.monochrome).toBe(true);
  });

  it("renders grain via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    grainLayerType.render(grainLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("is deterministic with same seed", () => {
    const id1 = createMockImageData(10, 10);
    const id2 = createMockImageData(10, 10);
    const ctx1 = createMockCtx(id1);
    const ctx2 = createMockCtx(id2);
    const props = { ...grainLayerType.createDefault(), seed: 42 };
    const smallBounds = { ...BOUNDS, width: 10, height: 10 };

    grainLayerType.render(props, ctx1, smallBounds, RESOURCES);
    grainLayerType.render(props, ctx2, smallBounds, RESOURCES);

    expect(Array.from(id1.data)).toEqual(Array.from(id2.data));
  });

  it("skips rendering at zero intensity", () => {
    const ctx = createMockCtx();
    grainLayerType.render({ ...grainLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("validates intensity range", () => {
    expect(grainLayerType.validate({ ...grainLayerType.createDefault(), intensity: 1.5 })).not.toBeNull();
    expect(grainLayerType.validate(grainLayerType.createDefault())).toBeNull();
  });
});

describe("vignetteLayerType", () => {
  it("has correct metadata", () => {
    expect(vignetteLayerType.typeId).toBe("filter:vignette");
  });

  it("renders via radial gradient", () => {
    const ctx = createMockCtx();
    vignetteLayerType.render(vignetteLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("skips at zero intensity", () => {
    const ctx = createMockCtx();
    vignetteLayerType.render({ ...vignetteLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.createRadialGradient).not.toHaveBeenCalled();
  });
});

describe("duotoneLayerType", () => {
  it("has correct metadata", () => {
    expect(duotoneLayerType.typeId).toBe("filter:duotone");
  });

  it("processes pixels via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    duotoneLayerType.render(duotoneLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("maps mid-gray to midpoint between dark and light colors", () => {
    const imageData = createMockImageData(1, 1);
    const ctx = createMockCtx(imageData);
    const props = {
      ...duotoneLayerType.createDefault(),
      darkColor: "#000000",
      lightColor: "#ffffff",
      intensity: 1.0,
    };
    duotoneLayerType.render(props, ctx, { ...BOUNDS, width: 1, height: 1 }, RESOURCES);

    // Mid-gray luminance (~128/255 ≈ 0.502) should map to ~128 in R,G,B
    const r = imageData.data[0]!;
    expect(r).toBeGreaterThan(120);
    expect(r).toBeLessThan(136);
  });
});

describe("blurLayerType", () => {
  it("has correct metadata", () => {
    expect(blurLayerType.typeId).toBe("filter:blur");
  });

  it("skips at zero radius", () => {
    const ctx = createMockCtx();
    blurLayerType.render({ ...blurLayerType.createDefault(), radius: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });
});

describe("chromaticAberrationLayerType", () => {
  it("has correct metadata", () => {
    expect(chromaticAberrationLayerType.typeId).toBe("filter:chromatic-aberration");
  });

  it("processes pixels", () => {
    const ctx = createMockCtx();
    chromaticAberrationLayerType.render(
      chromaticAberrationLayerType.createDefault(),
      ctx,
      BOUNDS,
      RESOURCES,
    );
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("skips with zero offset", () => {
    const ctx = createMockCtx();
    chromaticAberrationLayerType.render(
      { ...chromaticAberrationLayerType.createDefault(), offsetX: 0, offsetY: 0 },
      ctx,
      BOUNDS,
      RESOURCES,
    );
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });
});
