// Simple PNG icon generator using SVG to Canvas conversion
import fs from 'fs';

import { createCanvas, loadImage } from 'canvas';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = './public/icons';

// Create simple colored PNG icons as placeholders
/**
 *
 */
async function generateBasicPNGIcons() {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');
  
  for (const size of sizes) {
    // Resize canvas for each icon size
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Background with rounded corners
    const radius = size * 0.1;
    ctx.fillStyle = '#0d141f';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(0.5, '#0099cc');
    gradient.addColorStop(1, '#0066aa');
    
    const scale = size / 512;
    const center = size / 2;
    
    // Central core
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(center, center, 40 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Connecting lines
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8 * scale;
    
    // Horizontal and vertical lines
    ctx.beginPath();
    ctx.moveTo(center - 120 * scale, center);
    ctx.lineTo(center - 60 * scale, center);
    ctx.moveTo(center + 60 * scale, center);
    ctx.lineTo(center + 120 * scale, center);
    ctx.moveTo(center, center - 120 * scale);
    ctx.lineTo(center, center - 60 * scale);
    ctx.moveTo(center, center + 60 * scale);
    ctx.lineTo(center, center + 120 * scale);
    
    // Diagonal lines
    ctx.moveTo(center - 85 * scale, center - 85 * scale);
    ctx.lineTo(center - 42 * scale, center - 42 * scale);
    ctx.moveTo(center + 42 * scale, center + 42 * scale);
    ctx.lineTo(center + 85 * scale, center + 85 * scale);
    ctx.moveTo(center + 85 * scale, center - 85 * scale);
    ctx.lineTo(center + 42 * scale, center - 42 * scale);
    ctx.moveTo(center - 42 * scale, center + 42 * scale);
    ctx.lineTo(center - 85 * scale, center + 85 * scale);
    ctx.stroke();
    
    // Outer nodes
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = gradient;
    
    const nodePositions = [
      [center - 120 * scale, center, 20 * scale],
      [center + 120 * scale, center, 20 * scale],
      [center, center - 120 * scale, 20 * scale],
      [center, center + 120 * scale, 20 * scale],
      [center - 85 * scale, center - 85 * scale, 15 * scale],
      [center + 85 * scale, center + 85 * scale, 15 * scale],
      [center + 85 * scale, center - 85 * scale, 15 * scale],
      [center - 85 * scale, center + 85 * scale, 15 * scale]
    ];
    
    nodePositions.forEach(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Text overlay - only for larger sizes
    if (size >= 128) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.font = `bold ${24 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', center, center + 2 * scale);
    }
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    const filename = `icon-${size}x${size}.png`;
    const filepath = `${iconsDir}/${filename}`;
    
    fs.writeFileSync(filepath, buffer);
    console.log(`Created: ${filename}`);
  }
  
  // Create favicon
  canvas.width = 32;
  canvas.height = 32;
  ctx.clearRect(0, 0, 32, 32);
  
  // Simple favicon - just the "T" on colored background
  ctx.fillStyle = '#0d141f';
  ctx.fillRect(0, 0, 32, 32);
  
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', 16, 16);
  
  const faviconBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/favicon.png', faviconBuffer);
  console.log('Created: favicon.png');
}

// Run if canvas is available, otherwise create fallback
try {
  await generateBasicPNGIcons();
  console.log('All PNG icons generated successfully!');
} catch (error) {
  console.log('Canvas not available, creating simple colored PNG icons...');
  
  // Fallback: Create simple colored squares as PNG icons
  const createSimplePNG = (size, filename) => {
    // This creates a minimal PNG file with just colored pixels
    // For a real implementation, you'd want to use a proper image library
    const data = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#0d141f"/>
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.2}" fill="#00d4ff"/>
      <text x="${size/2}" y="${size/2 + size * 0.05}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.15}" font-weight="bold">T</text>
    </svg>`;
    
    fs.writeFileSync(`${iconsDir}/${filename}`, data);
  };
  
  sizes.forEach(size => {
    createSimplePNG(size, `icon-${size}x${size}.svg`);
    console.log(`Created fallback: icon-${size}x${size}.svg`);
  });
}

export { generateBasicPNGIcons };