import type { DesignPlugin, PluginContext } from "@genart-dev/core";
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
import { filterMcpTools } from "./filter-tools.js";

const filtersPlugin: DesignPlugin = {
  id: "filters",
  name: "Filters",
  version: "0.2.0",
  tier: "free",
  description: "Image filters: grain, vignette, duotone, blur, chromatic aberration, halftone, posterize, dither, sharpen, threshold.",

  layerTypes: [
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
  ],
  tools: [],
  exportHandlers: [],
  mcpTools: filterMcpTools,

  async initialize(_context: PluginContext): Promise<void> {},
  dispose(): void {},
};

export default filtersPlugin;
export { grainLayerType } from "./grain.js";
export { vignetteLayerType } from "./vignette.js";
export { duotoneLayerType } from "./duotone.js";
export { blurLayerType } from "./blur.js";
export { chromaticAberrationLayerType } from "./chromatic-aberration.js";
export { halftoneLayerType } from "./halftone.js";
export { posterizeLayerType } from "./posterize.js";
export { ditherLayerType } from "./dither.js";
export { sharpenLayerType } from "./sharpen.js";
export { thresholdLayerType } from "./threshold.js";
export { filterMcpTools } from "./filter-tools.js";
