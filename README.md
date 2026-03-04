# @genart-dev/plugin-filters

Image filter design layer plugin for [genart.dev](https://genart.dev) — apply film grain, vignette, duotone, blur, and chromatic aberration on top of any sketch. Filters are composited as full-canvas design layers. Includes MCP tools for AI-agent control.

Part of [genart.dev](https://genart.dev) — a generative art platform with an MCP server, desktop app, and IDE extensions.

## Install

```bash
npm install @genart-dev/plugin-filters
```

## Usage

```typescript
import filtersPlugin from "@genart-dev/plugin-filters";
import { createDefaultRegistry } from "@genart-dev/core";

const registry = createDefaultRegistry();
registry.registerPlugin(filtersPlugin);

// Or access individual layer types
import {
  grainLayerType,
  vignetteLayerType,
  duotoneLayerType,
  blurLayerType,
  chromaticAberrationLayerType,
  filterMcpTools,
} from "@genart-dev/plugin-filters";
```

## Filter Layers (5)

All filter layers span the full canvas bounds by default and are composited over the rendered sketch.

### Film Grain (`filter:grain`)

Adds monochromatic or colored photographic grain.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `intensity` | number | `0.15` | Grain strength (0–1) |
| `size` | number | `1.5` | Grain particle size in pixels |
| `colored` | boolean | `false` | Add chromatic color variation to grain |
| `seed` | number | `0` | Noise seed for reproducible grain |
| `blendMode` | select | `"overlay"` | Canvas blend mode |
| `opacity` | number | `1` | Layer opacity (0–1) |

### Vignette (`filter:vignette`)

Darkens or lightens canvas edges to draw focus toward the center.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | color | `"#000000"` | Vignette color |
| `strength` | number | `0.5` | Effect strength (0–1) |
| `softness` | number | `0.5` | Edge falloff softness (0–1) |
| `roundness` | number | `1` | Shape — 0 = rectangular, 1 = elliptical |
| `opacity` | number | `1` | Layer opacity (0–1) |

### Duotone (`filter:duotone`)

Maps luminance to a two-color gradient — shadows to one hue, highlights to another.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `shadowColor` | color | `"#1a1a2e"` | Color mapped to dark values |
| `highlightColor` | color | `"#f5e6d3"` | Color mapped to light values |
| `contrast` | number | `1` | Luminance contrast multiplier (0.5–2) |
| `opacity` | number | `0.85` | Layer opacity (0–1) |
| `blendMode` | select | `"normal"` | Canvas blend mode |

### Blur (`filter:blur`)

Gaussian blur over the full canvas.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `radius` | number | `4` | Blur radius in pixels (0–100) |
| `opacity` | number | `1` | Layer opacity (0–1) |

### Chromatic Aberration (`filter:chromatic-aberration`)

Splits RGB channels with a radial offset, simulating lens distortion.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `strength` | number | `0.005` | Offset strength relative to canvas width (0–0.05) |
| `angle` | number | `0` | Shift angle in degrees |
| `centerX` | number | `0.5` | X center of aberration (0–1) |
| `centerY` | number | `0.5` | Y center of aberration (0–1) |
| `opacity` | number | `1` | Layer opacity (0–1) |

## MCP Tools (6)

Exposed to AI agents through the MCP server when this plugin is registered:

| Tool | Description |
|------|-------------|
| `apply_grain` | Add or update a film grain layer |
| `apply_vignette` | Add or update a vignette layer |
| `apply_duotone` | Add or update a duotone color-map layer |
| `apply_blur` | Add or update a Gaussian blur layer |
| `apply_chromatic_aberration` | Add or update a chromatic aberration layer |
| `list_filters` | List all available filter layer types |

## Related Packages

| Package | Purpose |
|---------|---------|
| [`@genart-dev/core`](https://github.com/genart-dev/core) | Plugin host, layer system (dependency) |
| [`@genart-dev/mcp-server`](https://github.com/genart-dev/mcp-server) | MCP server that surfaces plugin tools to AI agents |

## Support

Questions, bugs, or feedback — [support@genart.dev](mailto:support@genart.dev) or [open an issue](https://github.com/genart-dev/plugin-filters/issues).

## License

MIT
