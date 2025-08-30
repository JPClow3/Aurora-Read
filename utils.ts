export const splitSentences = (text: string): string[] => {
  if (!text) return [];
  // This regex is a practical compromise for sentence tokenization.
  return text.match(/([^\.!\?]+[\.!\?]*)/g) || [text];
};

// FIX: Added the generateAvatarSvg utility function to create profile avatars.
export const generateAvatarSvg = (seed: string): string => {
  // Simple deterministic avatar generation based on a seed string.
  if (!seed) return '';
  const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  const sat = 60 + Math.abs(hash % 10);
  const lum = 40 + Math.abs(hash % 10);
  
  // A simple background and the first two letters of the seed.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="hsl(${hue}, ${sat}%, ${lum}%)" />
    <text x="50" y="55" font-family="Arial, sans-serif" font-size="40" fill="#fff" text-anchor="middle" dominant-baseline="middle">${seed.substring(0, 2).toUpperCase()}</text>
  </svg>`;
  
  // Base64 encode the SVG to use it as a data URI.
  // Using btoa as this code is intended for browser environments.
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
