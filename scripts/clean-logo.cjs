const sharp = require("sharp");
const path = require("path");

// Converts a logo JPG that has a baked-in checkerboard "transparency preview"
// background into a real PNG with an alpha channel. Works because each logo
// is a single solid ink color (white or black) against a two-tone gray
// checkerboard: alpha is derived from luminance distance from the
// checkerboard tones toward the ink color, and the checkerboard color itself
// is discarded (replaced by the solid ink color at full/partial alpha).

async function cleanLogo(inputFile, outputFile, inkIsWhite) {
  const inputPath = path.join(__dirname, "..", "public", "images", inputFile);
  const outputPath = path.join(__dirname, "..", "public", "images", outputFile);

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4); // RGBA

  // Sample the checkerboard's two tones from a background-only corner region.
  let bgMin = 255;
  let bgMax = 0;
  const sampleSize = 40;
  for (let y = 0; y < sampleSize; y++) {
    for (let x = 0; x < sampleSize; x++) {
      const idx = (y * width + x) * channels;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      bgMin = Math.min(bgMin, lum);
      bgMax = Math.max(bgMax, lum);
    }
  }

  // Threshold just past the brighter (white-ink case) / darker (black-ink
  // case) checkerboard tone, ramping to full opacity at the ink's own
  // luminance, so anti-aliased stroke edges still get partial alpha.
  const bgEdge = inkIsWhite ? bgMax : bgMin;
  const inkLum = inkIsWhite ? 255 : 0;
  const range = inkLum - bgEdge;

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    let alpha = (lum - bgEdge) / range; // 0 at background edge, 1 at ink
    alpha = Math.max(0, Math.min(1, alpha));

    const o = i * 4;
    out[o] = inkIsWhite ? 255 : 0;
    out[o + 1] = inkIsWhite ? 255 : 0;
    out[o + 2] = inkIsWhite ? 255 : 0;
    out[o + 3] = Math.round(alpha * 255);
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);

  console.log(`Wrote ${outputPath}`);
}

async function main() {
  await cleanLogo("Logo_black.jpg", "logo-dark-mode.png", true);
  await cleanLogo("Logo_transparent.jpg", "logo-light-mode.png", false);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
