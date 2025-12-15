/**
 * Copy public files to dist folder after Expo web export
 * This ensures manifest.json, sw.js, and other PWA files are available
 */

const fs = require("fs");
const path = require("path");

const publicDir = "public";
const distDir = "dist";

// Files to copy from public to dist
const filesToCopy = [
  "manifest.json",
  "sw.js",
  "offline.html",
  "icon-192.png",
  "icon-512.png",
  "icon-96.png",
  "screenshot-wide.png",
  "screenshot-narrow.png",
];

function copyFiles() {
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.log(`❌ Dist directory not found: ${distDir}`);
    return;
  }

  let copied = 0;
  let failed = 0;

  filesToCopy.forEach((file) => {
    const srcPath = path.join(publicDir, file);
    const dstPath = path.join(distDir, file);

    if (fs.existsSync(srcPath)) {
      try {
        fs.copyFileSync(srcPath, dstPath);
        console.log(`✅ Copied ${file}`);
        copied++;
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
        failed++;
      }
    } else {
      console.warn(`⚠️  Source file not found: ${srcPath}`);
    }
  });

  console.log(`\n📊 Summary: ${copied} copied, ${failed} failed`);

  // Verify manifest.json is in dist
  if (fs.existsSync(path.join(distDir, "manifest.json"))) {
    console.log("✅ manifest.json verified in dist/");
  } else {
    console.error("❌ manifest.json NOT found in dist/");
  }
}

copyFiles();
