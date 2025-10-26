// Script to generate PWA icons from SVG base
// This script requires sharp package: npm install sharp

const fs = require('fs');
const path = require('path');

const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '../public/icons/icon-base.svg');
const iconsDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate PNG icons for each size
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
        
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    
    // Generate favicon.ico (32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
      
    console.log('Generated: favicon.png (rename to favicon.ico if needed)');
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the script
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };