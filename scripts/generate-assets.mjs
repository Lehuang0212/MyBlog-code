import fs from 'node:fs/promises';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const ICON_SOURCE = 'src/assets/icon-source.png';
const CREAM = '#FAF7F2';
const ACCENT = '#F09A32';

async function ensureDir(path) {
  await fs.mkdir(path, { recursive: true });
}

async function main() {
  await ensureDir('public');

  // Keep the whole character: trim the transparent canvas, then scale it
  // proportionally into the badge instead of cropping to the head.
  const artwork = await sharp(ICON_SOURCE)
    .trim()
    .resize(440, 440, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const ring = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="248" fill="${CREAM}" stroke="${ACCENT}" stroke-width="8"/>
    </svg>
  `);

  const badge = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: ring, top: 0, left: 0 },
      { input: artwork, top: 36, left: 36 },
    ])
    .png()
    .toBuffer();

  await fs.writeFile('public/icon-512.png', badge);
  await fs.writeFile('public/icon-avatar.png', await sharp(badge).resize(160, 160).png().toBuffer());

  for (const [size, file] of [
    [192, 'public/icon-192.png'],
    [48, 'public/favicon-48.png'],
    [32, 'public/favicon-32.png'],
    [16, 'public/favicon-16.png'],
  ]) {
    await sharp(badge).resize(size, size).png().toFile(file);
  }

  const square = async (size) => {
    const resized = await sharp(badge).resize(size, size).png().toBuffer();
    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: CREAM,
      },
    })
      .composite([{ input: resized, top: 0, left: 0 }])
      .png()
      .toBuffer();
  };

  await fs.writeFile('public/apple-touch-icon.png', await square(180));

  const icoBuffers = await Promise.all(
    [16, 32, 48].map((size) => sharp(badge).resize(size, size).png().toBuffer()),
  );
  await fs.writeFile('public/favicon.ico', await pngToIco(icoBuffers));

  const ogSvg = await fs.readFile('public/og-default.svg');
  await sharp(ogSvg).png().toFile('public/og-default.png');

  console.log('[assets] Generated favicon, app icons and OG image');
}

main().catch((error) => {
  console.error(`[assets] ${error.message}`);
  process.exit(1);
});
