
export const splitSentences = (text: string): string[] => {
  if (!text) return [];
  // This regex is a good starting point, but can misinterpret abbreviations (e.g., "Mr. Smith").
  // True sentence tokenization is a complex NLP problem. This is a practical compromise.
  return text.match(/([^\.!\?]+[\.!\?]*)/g) || [text];
};

export const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
};

export const optimizeCoverImage = (base64Str: string, maxWidth: number = 400, maxHeight: number = 600, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // If context fails, return original image to not break the process
        return resolve(base64Str);
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      // If image fails to load, resolve with the original string.
      resolve(base64Str);
    };
  });
};

export const generateAvatarSvg = (seed: string): string => {
  const colors = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#10b981', '#f59e0b',
    '#3b82f6', '#ef4444', '#22c55e', '#06b6d4', '#f97316', '#eab308',
  ];
  
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const bgColor = colors[hash % colors.length];
  const patternColor = 'rgba(255, 255, 255, 0.7)';

  const patternType = hash % 4;
  let pattern = '';

  // Generate a seed-based random number function to make patterns more varied
  let pseudoRandom = (hash % 99) + 1;
  const nextRand = () => {
    pseudoRandom = (pseudoRandom * 16807) % 2147483647;
    return (pseudoRandom - 1) / 2147483646;
  };

  switch (patternType) {
    case 0: // Concentric Circles
      pattern = `
        <circle cx="50" cy="50" r="${15 + nextRand() * 20}" fill="none" stroke="${patternColor}" stroke-width="6" />
        <circle cx="50" cy="50" r="${5 + nextRand() * 5}" fill="${patternColor}" />
      `;
      break;
    case 1: // Tilted Squares
      pattern = `
        <rect x="25" y="25" width="50" height="50" fill="${patternColor}" transform="rotate(${nextRand() * 90 - 45} 50 50)" />
        <rect x="35" y="35" width="30" height="30" fill="${bgColor}" transform="rotate(${nextRand() * 90 - 45} 50 50)" />
      `;
      break;
    case 2: // Cross Hatch
      pattern = `
        <path d="M 10 10 L 90 90 M 90 10 L 10 90" stroke="${patternColor}" stroke-width="${6 + nextRand() * 4}" stroke-linecap="round"/>
      `;
      break;
    case 3: // Polka Dots
    default:
      pattern = `
        <circle cx="25" cy="25" r="${5 + nextRand() * 5}" fill="${patternColor}" />
        <circle cx="75" cy="25" r="${5 + nextRand() * 5}" fill="${patternColor}" />
        <circle cx="25" cy="75" r="${5 + nextRand() * 5}" fill="${patternColor}" />
        <circle cx="75" cy="75" r="${5 + nextRand() * 5}" fill="${patternColor}" />
        <circle cx="50" cy="50" r="${5 + nextRand() * 5}" fill="${patternColor}" />
      `;
      break;
  }
  
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${bgColor}" />${pattern}</svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg.replace(/\n\s*/g, ''))}`;
};
