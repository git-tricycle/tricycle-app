const fs = require("fs");
const path = require("path");

// Simple script to copy tric.jpg to proper PWA icon locations
const sourceIcon = path.join(__dirname, "assets", "images", "tric.jpg");
const publicDir = path.join(__dirname, "public");

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy icon to different sizes (we'll use the same file for now)
const iconSizes = ["96", "192", "512"];

iconSizes.forEach((size) => {
  const targetPath = path.join(publicDir, `icon-${size}.png`);
  try {
    fs.copyFileSync(sourceIcon, targetPath);
    console.log(`✅ Created ${targetPath}`);
  } catch (error) {
    console.error(`❌ Failed to create ${targetPath}:`, error.message);
  }
});

// Create favicon
const faviconPath = path.join(publicDir, "favicon.ico");
try {
  fs.copyFileSync(sourceIcon, faviconPath);
  console.log(`✅ Created ${faviconPath}`);
} catch (error) {
  console.error(`❌ Failed to create ${faviconPath}:`, error.message);
}

console.log("🎉 PWA icons generation complete!");
