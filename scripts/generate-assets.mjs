import fs from 'node:fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const ICON_SOURCE = 'src/assets/icon-source.png';

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function main() {
  await ensureDir('public');

  // Keep the whole character and its transparent background. No badge,
  // ring, or separate backing colour: the icon sits directly on the page.
  const artwork = await sharp(ICON_SOURCE)
    .trim()
    .resize(480, 480, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const icon = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artwork, top: 16, left: 16 }])
    .png()
    .toBuffer();

  await fs.writeFile('public/icon-512.png', icon);
  await fs.writeFile('public/icon-avatar.png', await sharp(icon).resize(160, 160).png().toBuffer());

  for (const [size, file] of [
    [192, 'public/icon-192.png'],
    [180, 'public/apple-touch-icon.png'],
    [48, 'public/favicon-48.png'],
    [32, 'public/favicon-32.png'],
    [16, 'public/favicon-16.png'],
  ]) {
    await sharp(icon).resize(size, size).png().toFile(file);
  }

  const icoBuffers = await Promise.all(
    [16, 32, 48].map((size) => sharp(icon).resize(size, size).png().toBuffer()),
  );
  await fs.writeFile('public/favicon.ico', await pngToIco(icoBuffers));

  const ogSvg = await fs.readFile('public/og-default.svg');
  await sharp(ogSvg).png().toFile('public/og-default.png');

  console.log('[assets] Generated transparent favicon, app icons and OG image');
}

main().catch((error) => {
  console.error(`[assets] ${error.message}`);
  process.exit(1);
});
