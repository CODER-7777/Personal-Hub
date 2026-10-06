import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets', 'Personal_Hub_Logo.png');
// Extract the supplied mark; the complete logo remains available for larger layouts.
const mark = await sharp(source).extract({ left: 434, top: 40, width: 540, height: 500 }).png().toBuffer();
const icon = size => sharp(mark).resize(size, size, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
const save = async (name, bytes) => {
  const target = path.join(root, name);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
};

await save('public/Personal_Hub_Logo.png', await fs.readFile(source));
await save('public/app-logo.png', await icon(512));
await save('public/icon.png', await icon(256));
for (const size of [192, 512]) await save(`public/pwa-${size}x${size}.png`, await icon(size));
await save('electron/assets/appIcon.png', await icon(512));
await save('assets/icon-only.png', await icon(1024));

// ICO supports embedded PNGs. Include small sizes for Explorer, shortcuts and taskbars.
const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(icon));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + i * 16;
  header[entry] = size === 256 ? 0 : size;
  header[entry + 1] = size === 256 ? 0 : size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await save('electron/assets/appIcon.ico', Buffer.concat([header, ...images]));

for (const [density, size, adaptiveSize] of [
  ['ldpi', 36, 81], ['mdpi', 48, 108], ['hdpi', 72, 162],
  ['xhdpi', 96, 216], ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
]) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  const foreground = await sharp({ create: { width: adaptiveSize, height: adaptiveSize, channels: 4, background: '#ffffff' } })
    .composite([{ input: await icon(Math.round(adaptiveSize * 0.6)), gravity: 'centre' }]).png().toBuffer();
  const background = await sharp({ create: { width: adaptiveSize, height: adaptiveSize, channels: 4, background: '#ffffff' } }).png().toBuffer();
  await save(`${dir}/ic_launcher.png`, await icon(size));
  await save(`${dir}/ic_launcher_round.png`, await icon(size));
  await save(`${dir}/ic_launcher_foreground.png`, foreground);
  await save(`${dir}/ic_launcher_background.png`, background);
}
console.log('Generated web, Windows, Linux and Android icons from the supplied logo.');
