// Generates Android launcher icons (legacy, round, adaptive + themed
// monochrome), splash screens, the notification icon and Play Store listing
// art from the Celestial Atlas compass mark. Offline; uses `sharp`.
//
//   node android-app/scripts/generate-assets.mjs
//
// Source: public/celestial-compass.png (720 px, the same mark as
// public/celestialatlas-logo.png, which is only 96 px and too small for the
// 432 px adaptive foreground or the 512 px Play icon). Falls back to the logo.
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const res = path.join(root, "android/app/src/main/res");
const listing = path.join(root, "android-app/store-listing");
const source = [
  "public/celestial-compass.png",
  "public/celestialatlas-logo.png",
]
  .map((file) => path.join(root, file))
  .find((file) => existsSync(file));
if (!source) throw new Error("No source logo found.");

const NAVY = { r: 7, g: 17, b: 31, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

async function mark(size) {
  return sharp(source)
    .resize(Math.round(size), Math.round(size), {
      fit: "contain",
      background: CLEAR,
    })
    .png()
    .toBuffer();
}

/** White silhouette of the mark (notification + themed monochrome icons). */
async function silhouette(size) {
  const alpha = await sharp(await mark(size))
    .ensureAlpha()
    .extractChannel("alpha")
    .threshold(96)
    .toBuffer();
  return sharp({
    create: {
      width: Math.round(size),
      height: Math.round(size),
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function canvas(width, height, background, layers, file) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 4, background } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(file);
}

async function centred(width, height, background, markSize, file, input) {
  const buffer = input ?? (await mark(markSize));
  const meta = await sharp(buffer).metadata();
  await canvas(
    width,
    height,
    background,
    [
      {
        input: buffer,
        left: Math.round((width - meta.width) / 2),
        top: Math.round((height - meta.height) / 2),
      },
    ],
    file,
  );
}

function shapeMask(size, shape) {
  const radius =
    shape === "circle" ? size / 2 : shape === "square-full" ? 0 : size * 0.2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
}

async function legacyIcon(size, shape, file) {
  const glyph = await mark(size * 0.68);
  const meta = await sharp(glyph).metadata();
  const base = await sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([
      {
        input: glyph,
        left: Math.round((size - meta.width) / 2),
        top: Math.round((size - meta.height) / 2),
      },
      { input: shapeMask(size, shape), blend: "dest-in" },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(base).toFile(file);
}

for (const [density, scale] of Object.entries(densities)) {
  const mipmap = path.join(res, `mipmap-${density}`);
  const drawable = path.join(res, `drawable-${density}`);
  // Legacy launcher icons (48 dp).
  await legacyIcon(48 * scale, "square", path.join(mipmap, "ic_launcher.png"));
  await legacyIcon(
    48 * scale,
    "circle",
    path.join(mipmap, "ic_launcher_round.png"),
  );
  // Adaptive foreground: 108 dp canvas, mark inside the 66 dp safe zone.
  await centred(
    108 * scale,
    108 * scale,
    CLEAR,
    62 * scale,
    path.join(mipmap, "ic_launcher_foreground.png"),
  );
  // Android 13+ themed icon layer.
  await centred(
    108 * scale,
    108 * scale,
    CLEAR,
    62 * scale,
    path.join(mipmap, "ic_launcher_monochrome.png"),
    await silhouette(62 * scale),
  );
  // Android 12+ splash icon: 288 dp canvas, content within the 192 dp circle.
  await centred(
    288 * scale,
    288 * scale,
    CLEAR,
    150 * scale,
    path.join(drawable, "splash_icon.png"),
  );
  // Notification small icon (24 dp, white on transparent).
  await centred(
    24 * scale,
    24 * scale,
    CLEAR,
    22 * scale,
    path.join(drawable, "ic_stat_notification.png"),
    await silhouette(22 * scale),
  );
  // Pre-Android-12 launch background.
  const portrait = { width: 320 * scale, height: 480 * scale };
  await centred(
    portrait.width,
    portrait.height,
    NAVY,
    120 * scale,
    path.join(res, `drawable-port-${density}`, "splash.png"),
  );
  await centred(
    portrait.height,
    portrait.width,
    NAVY,
    120 * scale,
    path.join(res, `drawable-land-${density}`, "splash.png"),
  );
}
await centred(480, 320, NAVY, 120, path.join(res, "drawable", "splash.png"));

// Play Store listing art.
await legacyIcon(512, "square-full", path.join(listing, "icon-512.png"));
const title = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
     <defs><radialGradient id="g" cx="30%" cy="50%" r="60%">
       <stop offset="0" stop-color="#c9a75d" stop-opacity="0.18"/>
       <stop offset="1" stop-color="#07111f" stop-opacity="0"/></radialGradient></defs>
     <rect width="1024" height="500" fill="url(#g)"/>
     <text x="440" y="235" font-family="Cormorant Garamond, Georgia, serif" font-size="64" fill="#f2ead8">Celestial Atlas</text>
     <text x="442" y="290" font-family="Hanken Grotesk, Helvetica, Arial, sans-serif" font-size="21" letter-spacing="1.5" fill="#c9a75d">YOUR CHART · YOUR MORNING READING</text>
   </svg>`,
);
const featureMark = await mark(300);
await canvas(
  1024,
  500,
  NAVY,
  [
    { input: title, left: 0, top: 0 },
    { input: featureMark, left: 100, top: 100 },
  ],
  path.join(listing, "feature-graphic-1024x500.png"),
);
console.log("Android assets generated from", path.relative(root, source));
