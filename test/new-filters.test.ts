import { describe, it, expect, vi } from "vitest";
import { halftoneLayerType } from "../src/halftone.js";
import { posterizeLayerType } from "../src/posterize.js";
import { ditherLayerType } from "../src/dither.js";
import { sharpenLayerType } from "../src/sharpen.js";
import { thresholdLayerType } from "../src/threshold.js";
import type { LayerBounds, RenderResources } from "@genart-dev/core";

const BOUNDS: LayerBounds = {
  x: 0, y: 0, width: 100, height: 100,
  rotation: 0, scaleX: 1, scaleY: 1,
};

const RESOURCES: RenderResources = {
  getFont: () => null,
  getImage: () => null,
  theme: "dark",
  pixelRatio: 1,
};

function createMockImageData(w: number, h: number, fill?: [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  const [r, g, b] = fill ?? [128, 128, 128];
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
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
    fillStyle: "",
    filter: "",
  } as unknown as CanvasRenderingContext2D;
}

// ---------------------------------------------------------------------------
// Halftone
// ---------------------------------------------------------------------------
describe("filter:halftone", () => {
  it("has correct metadata", () => {
    expect(halftoneLayerType.typeId).toBe("filter:halftone");
    expect(halftoneLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = halftoneLayerType.createDefault();
    expect(d.dotSize).toBe(6);
    expect(d.pattern).toBe("dot");
    expect(d.angle).toBe(45);
  });

  it("renders via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    halftoneLayerType.render(halftoneLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("skips at zero intensity", () => {
    const ctx = createMockCtx();
    halftoneLayerType.render({ ...halftoneLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("works for each pattern type", () => {
    for (const pattern of ["dot", "line", "diamond"]) {
      const ctx = createMockCtx();
      expect(() => halftoneLayerType.render(
        { ...halftoneLayerType.createDefault(), pattern },
        ctx, BOUNDS, RESOURCES,
      )).not.toThrow();
    }
  });

  it("produces black and white pixels from mid-gray", () => {
    const id = createMockImageData(20, 20);
    const ctx = createMockCtx(id);
    halftoneLayerType.render(
      { ...halftoneLayerType.createDefault(), dotSize: 4, intensity: 1.0 },
      ctx, { ...BOUNDS, width: 20, height: 20 }, RESOURCES,
    );
    // Should have both black (0) and white (255) pixels
    let hasBlack = false, hasWhite = false;
    for (let i = 0; i < id.data.length; i += 4) {
      if (id.data[i]! === 0) hasBlack = true;
      if (id.data[i]! === 255) hasWhite = true;
    }
    expect(hasBlack).toBe(true);
    expect(hasWhite).toBe(true);
  });

  it("validates dotSize range", () => {
    expect(halftoneLayerType.validate({ dotSize: 1 })).not.toBeNull();
    expect(halftoneLayerType.validate({ dotSize: 6 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Posterize
// ---------------------------------------------------------------------------
describe("filter:posterize", () => {
  it("has correct metadata", () => {
    expect(posterizeLayerType.typeId).toBe("filter:posterize");
    expect(posterizeLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = posterizeLayerType.createDefault();
    expect(d.levels).toBe(4);
    expect(d.intensity).toBe(1.0);
  });

  it("renders via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    posterizeLayerType.render(posterizeLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("reduces color levels", () => {
    // Create gradient image
    const id = createMockImageData(256, 1);
    for (let i = 0; i < 256; i++) {
      id.data[i * 4] = i;
      id.data[i * 4 + 1] = i;
      id.data[i * 4 + 2] = i;
    }
    const ctx = createMockCtx(id);
    posterizeLayerType.render(
      { levels: 2, intensity: 1.0 },
      ctx, { ...BOUNDS, width: 256, height: 1 }, RESOURCES,
    );

    // With 2 levels, every pixel should be 0 or 255
    const uniqueValues = new Set<number>();
    for (let i = 0; i < id.data.length; i += 4) {
      uniqueValues.add(id.data[i]!);
    }
    expect(uniqueValues.size).toBe(2);
    expect(uniqueValues.has(0)).toBe(true);
    expect(uniqueValues.has(255)).toBe(true);
  });

  it("skips at zero intensity", () => {
    const ctx = createMockCtx();
    posterizeLayerType.render({ ...posterizeLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("validates levels range", () => {
    expect(posterizeLayerType.validate({ levels: 1 })).not.toBeNull();
    expect(posterizeLayerType.validate({ levels: 4 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Dither
// ---------------------------------------------------------------------------
describe("filter:dither", () => {
  it("has correct metadata", () => {
    expect(ditherLayerType.typeId).toBe("filter:dither");
    expect(ditherLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = ditherLayerType.createDefault();
    expect(d.method).toBe("floyd-steinberg");
    expect(d.levels).toBe(2);
  });

  it("works for each dither method", () => {
    for (const method of ["floyd-steinberg", "ordered", "random"]) {
      const ctx = createMockCtx();
      expect(() => ditherLayerType.render(
        { ...ditherLayerType.createDefault(), method },
        ctx, BOUNDS, RESOURCES,
      )).not.toThrow();
      expect(ctx.putImageData).toHaveBeenCalled();
    }
  });

  it("floyd-steinberg reduces to target levels", () => {
    const id = createMockImageData(20, 20);
    // Fill with gradient
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const v = Math.round((x / 19) * 255);
        const i = (y * 20 + x) * 4;
        id.data[i] = v;
        id.data[i + 1] = v;
        id.data[i + 2] = v;
      }
    }
    const ctx = createMockCtx(id);
    ditherLayerType.render(
      { method: "floyd-steinberg", levels: 2, intensity: 1.0, seed: 0 },
      ctx, { ...BOUNDS, width: 20, height: 20 }, RESOURCES,
    );

    // All pixel R values should be either 0 or 255
    for (let i = 0; i < id.data.length; i += 4) {
      expect(id.data[i] === 0 || id.data[i] === 255).toBe(true);
    }
  });

  it("skips at zero intensity", () => {
    const ctx = createMockCtx();
    ditherLayerType.render({ ...ditherLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("validates levels range", () => {
    expect(ditherLayerType.validate({ levels: 1 })).not.toBeNull();
    expect(ditherLayerType.validate({ levels: 4 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Sharpen
// ---------------------------------------------------------------------------
describe("filter:sharpen", () => {
  it("has correct metadata", () => {
    expect(sharpenLayerType.typeId).toBe("filter:sharpen");
    expect(sharpenLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = sharpenLayerType.createDefault();
    expect(d.amount).toBe(0.5);
    expect(d.radius).toBe(1);
  });

  it("renders via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    sharpenLayerType.render(sharpenLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("skips at zero amount", () => {
    const ctx = createMockCtx();
    sharpenLayerType.render({ ...sharpenLayerType.createDefault(), amount: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("does not change uniform images", () => {
    const id = createMockImageData(10, 10); // uniform mid-gray
    const before = new Uint8ClampedArray(id.data);
    const ctx = createMockCtx(id);
    sharpenLayerType.render(
      { amount: 1.0, radius: 1 },
      ctx, { ...BOUNDS, width: 10, height: 10 }, RESOURCES,
    );
    // Uniform image has no edges — sharpen should produce no change
    expect(Array.from(id.data)).toEqual(Array.from(before));
  });

  it("validates amount range", () => {
    expect(sharpenLayerType.validate({ amount: 3 })).not.toBeNull();
    expect(sharpenLayerType.validate({ amount: 0.5 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Threshold
// ---------------------------------------------------------------------------
describe("filter:threshold", () => {
  it("has correct metadata", () => {
    expect(thresholdLayerType.typeId).toBe("filter:threshold");
    expect(thresholdLayerType.category).toBe("filter");
  });

  it("creates defaults", () => {
    const d = thresholdLayerType.createDefault();
    expect(d.threshold).toBe(128);
    expect(d.lowColor).toBe("#000000");
    expect(d.highColor).toBe("#ffffff");
  });

  it("renders via getImageData/putImageData", () => {
    const ctx = createMockCtx();
    thresholdLayerType.render(thresholdLayerType.createDefault(), ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
  });

  it("converts bright pixels to highColor", () => {
    const id = createMockImageData(1, 1, [200, 200, 200]);
    const ctx = createMockCtx(id);
    thresholdLayerType.render(
      { threshold: 128, intensity: 1.0, lowColor: "#000000", highColor: "#ffffff" },
      ctx, { ...BOUNDS, width: 1, height: 1 }, RESOURCES,
    );
    expect(id.data[0]).toBe(255);
    expect(id.data[1]).toBe(255);
    expect(id.data[2]).toBe(255);
  });

  it("dark pixels go to lowColor", () => {
    const id = createMockImageData(1, 1, [10, 10, 10]);
    const ctx = createMockCtx(id);
    thresholdLayerType.render(
      { threshold: 128, intensity: 1.0, lowColor: "#ff0000", highColor: "#0000ff" },
      ctx, { ...BOUNDS, width: 1, height: 1 }, RESOURCES,
    );
    expect(id.data[0]).toBe(255); // red
    expect(id.data[1]).toBe(0);
    expect(id.data[2]).toBe(0);
  });

  it("skips at zero intensity", () => {
    const ctx = createMockCtx();
    thresholdLayerType.render({ ...thresholdLayerType.createDefault(), intensity: 0 }, ctx, BOUNDS, RESOURCES);
    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("validates threshold range", () => {
    expect(thresholdLayerType.validate({ threshold: -1 })).not.toBeNull();
    expect(thresholdLayerType.validate({ threshold: 128 })).toBeNull();
  });
});
