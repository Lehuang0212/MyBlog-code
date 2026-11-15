import sharp from 'sharp';

await sharp('public/og-default.svg').png().toFile('public/og-default.png');
await sharp('public/favicon.svg').resize(180, 180).png().toFile('public/apple-touch-icon.png');

console.log('[assets] Generated og-default.png and apple-touch-icon.png');
