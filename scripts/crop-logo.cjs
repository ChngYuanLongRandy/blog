const sharp = require("sharp");
const path = require("path");

// Crops each already-transparent logo PNG tightly to its signature content
// (plus a comfortable margin), since the source canvases are 1024x1024 with
// the actual wordmark occupying only a small fraction of that space.

async function cropLogo(file, marginPct) {
  const filePath = path.join(__dirname, "..", "public", "images", file);
  const { data, info } = await sharp(filePath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const padX = Math.round(contentW * marginPct);
  const padY = Math.round(contentH * marginPct);

  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(width, maxX + padX);
  const bottom = Math.min(height, maxY + padY);

  await sharp(filePath)
    .extract({ left, top, width: right - left, height: bottom - top })
    .png()
    .toFile(filePath + ".tmp.png");

  const fs = require("fs");
  fs.renameSync(filePath + ".tmp.png", filePath);

  console.log(
    `${file}: cropped to ${right - left}x${bottom - top} (ratio ${((right - left) / (bottom - top)).toFixed(3)})`
  );
}

async function main() {
  await cropLogo("logo-dark-mode.png", 0.1);
  await cropLogo("logo-light-mode.png", 0.1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
