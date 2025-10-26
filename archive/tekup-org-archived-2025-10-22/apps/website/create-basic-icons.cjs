// Simple icon generator for PWA
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon that we can convert
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.1)}" fill="#0d141f"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.2}" fill="#00d4ff" opacity="0.9"/>
  <text x="${size/2}" y="${size/2 + size * 0.05}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold">T</text>
</svg>`;

// Required icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size (browsers can render these)
sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Created: ${filename}`);
});

// Create a favicon
const favicon = createSVGIcon(32);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), favicon);
console.log('Created: favicon.svg');

console.log('All icons generated successfully!');
console.log('Note: These are SVG icons. For PNG icons, use the HTML generator at http://localhost:8082/generate-icons.html');