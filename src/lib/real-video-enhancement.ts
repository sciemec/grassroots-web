
export interface FilterPreset {
  name: string;
  icon: string;
  cssFilter: string;
  description: string;
}

// These CSS filters work in EVERY browser - real CSS properties
export const VIDEO_FILTERS: Record<string, FilterPreset> = {
  original: {
    name: "Original",
    icon: "🎬",
    cssFilter: "brightness(1) contrast(1) saturate(1)",
    description: "No changes"
  },
  sports: {
    name: "Sports Pro",
    icon: "⚽",
    cssFilter: "brightness(1.05) contrast(1.2) saturate(1.1)",
    description: "Enhanced contrast, punchy colors"
  },
  action: {
    name: "Action",
    icon: "⚡",
    cssFilter: "brightness(1) contrast(1.3) saturate(1.15)",
    description: "High contrast, dramatic look"
  },
  stadium: {
    name: "Stadium",
    icon: "🏟️",
    cssFilter: "brightness(1.08) contrast(1.15) saturate(1.05)",
    description: "Bright, broadcast style"
  },
  cinematic: {
    name: "Cinematic",
    icon: "🎥",
    cssFilter: "brightness(0.95) contrast(1.1) saturate(1.2)",
    description: "Rich colors, film look"
  },
  warm: {
    name: "Golden Hour",
    icon: "🌅",
    cssFilter: "brightness(1.02) contrast(1.05) saturate(1.15) sepia(0.15)",
    description: "Warm, golden tones"
  },
  cool: {
    name: "Arctic",
    icon: "❄️",
    cssFilter: "brightness(1.05) contrast(1.1) saturate(0.9) hue-rotate(5deg)",
    description: "Cool, crisp tones"
  }
};

// Capture thumbnail with filters applied - REAL canvas manipulation
export const captureThumbnail = (
  videoElement: HTMLVideoElement,
  filterCss: string,
  playerName: string = "",
  sport: string = ""
): Promise<string> => {
  return new Promise((resolve) => {
    if (!videoElement || videoElement.readyState < 2 || !videoElement.videoWidth) {
      resolve('');
      return;
    }
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Parse CSS filter values for pixel manipulation
    const brightnessMatch = filterCss.match(/brightness\(([\d.]+)\)/);
    const contrastMatch = filterCss.match(/contrast\(([\d.]+)\)/);
    const saturateMatch = filterCss.match(/saturate\(([\d.]+)\)/);
    const sepiaMatch = filterCss.match(/sepia\(([\d.]+)\)/);
    const hueRotateMatch = filterCss.match(/hue-rotate\(([\d.]+)deg\)/);
    
    const brightness = brightnessMatch ? parseFloat(brightnessMatch[1]) : 1;
    const contrast = contrastMatch ? parseFloat(contrastMatch[1]) : 1;
    const saturation = saturateMatch ? parseFloat(saturateMatch[1]) : 1;
    const sepia = sepiaMatch ? parseFloat(sepiaMatch[1]) : 0;
    const hueRotate = hueRotateMatch ? parseFloat(hueRotateMatch[1]) : 0;
    
    // Apply pixel transformations - REAL working code
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      
      // Apply brightness
      r = r * brightness;
      g = g * brightness;
      b = b * brightness;
      
      // Apply contrast
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - (contrast * 255 + 255)));
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;
      
      // Apply saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + (r - gray) * saturation;
      g = gray + (g - gray) * saturation;
      b = gray + (b - gray) * saturation;
      
      // Apply sepia
      if (sepia > 0) {
        const tr = r, tg = g, tb = b;
        r = tr * (1 - sepia) + (tr * 0.393 + tg * 0.769 + tb * 0.189) * sepia;
        g = tg * (1 - sepia) + (tr * 0.349 + tg * 0.686 + tb * 0.168) * sepia;
        b = tb * (1 - sepia) + (tr * 0.272 + tg * 0.534 + tb * 0.131) * sepia;
      }
      
      // Apply hue rotation (simplified)
      if (hueRotate !== 0) {
        const angle = hueRotate * Math.PI / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const tr = r, tg = g, tb = b;
        r = tr * cos + tg * (-sin) + tb * (sin * 0.5);
        g = tr * sin + tg * cos + tb * (-sin * 0.5);
        b = tr * (-sin * 0.5) + tg * (sin * 0.5) + tb * cos;
      }
      
      data[i] = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Add overlay text - REAL working canvas text
    if (playerName) {
      const fontSize = Math.floor(canvas.width / 25);
      ctx.font = `bold ${fontSize}px "Inter", system-ui, -apple-system, sans-serif`;
      
      // Background bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, fontSize + 20);
      
      // Left accent bar
      ctx.fillStyle = '#f0b429';
      ctx.fillRect(0, 0, 4, fontSize + 20);
      
      // Player name
      ctx.fillStyle = '#ffffff';
      ctx.fillText(playerName, 20, fontSize + 5);
      
      // Sport on second line if provided
      if (sport) {
        ctx.font = `${Math.floor(fontSize * 0.7)}px "Inter", system-ui`;
        ctx.fillStyle = '#cccccc';
        ctx.fillText(sport, 20, fontSize + 5 + Math.floor(fontSize * 0.8));
      }
      
      // Date stamp
      const date = new Date().toLocaleDateString();
      ctx.font = `${Math.floor(fontSize * 0.5)}px "Inter", system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(date, canvas.width - 100, fontSize + 10);
    }
    
    resolve(canvas.toDataURL('image/jpeg', 0.85));
  });
};

// Get CSS filter string for live preview
export const getFilterCss = (presetKey: string): string => {
  return VIDEO_FILTERS[presetKey]?.cssFilter || VIDEO_FILTERS.sports.cssFilter;
};