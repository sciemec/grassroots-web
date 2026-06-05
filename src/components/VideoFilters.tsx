
export const VIDEO_FILTERS = {
  // Pro Sports Look - Increased contrast, warmer
  sports: {
    brightness: 0.05,
    contrast: 1.2,
    saturation: 1.1,
    temperature: 5500,
  },
  // Action Mode - High contrast, cooler
  action: {
    brightness: 0,
    contrast: 1.3,
    saturation: 1.2,
    temperature: 6500,
  },
  // Natural - Minimal enhancement
  natural: {
    brightness: 0.02,
    contrast: 1.05,
    saturation: 1.0,
    temperature: 5000,
  },
  // Stadium - Warm, punchy
  stadium: {
    brightness: 0.08,
    contrast: 1.25,
    saturation: 1.15,
    temperature: 6000,
  },
};

// Apply using CSS filters (instant, no processing)
// In your video player component:
// <div style={{
//   filter: `
//     brightness(${filter.brightness})
//     contrast(${filter.contrast})
//     saturate(${filter.saturation})
//   `
// }}>
//   <video src={videoUrl} />
// </div>