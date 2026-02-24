import type { DesignPlugin, PluginContext } from "@genart-dev/core";
import { grainLayerType } from "./grain.js";
import { vignetteLayerType } from "./vignette.js";
import { duotoneLayerType } from "./duotone.js";
import { blurLayerType } from "./blur.js";
import { chromaticAberrationLayerType } from "./chromatic-aberration.js";
import { filterMcpTools } from "./filter-tools.js";

const filtersPlugin: DesignPlugin = {
  id: "filters",
  name: "Filters",
  version: "0.1.0",
  tier: "free",
  description: "Image filters: grain, vignette, duotone, blur, chromatic aberration.",

  layerTypes: [
    grainLayerType,
    vignetteLayerType,
    duotoneLayerType,
    blurLayerType,
    chromaticAberrationLayerType,
  ],
  tools: [],
  exportHandlers: [],
  mcpTools: filterMcpTools,

  async initialize(_context: PluginContext): Promise<void> {
    // No async setup needed for pixel filters
  },

  dispose(): void {
    // No resources to release
  },
};

export default filtersPlugin;
export { grainLayerType } from "./grain.js";
export { vignetteLayerType } from "./vignette.js";
export { duotoneLayerType } from "./duotone.js";
export { blurLayerType } from "./blur.js";
export { chromaticAberrationLayerType } from "./chromatic-aberration.js";
export { filterMcpTools } from "./filter-tools.js";
