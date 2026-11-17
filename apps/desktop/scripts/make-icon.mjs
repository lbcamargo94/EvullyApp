// Renders build/icon.svg into build/icon.ico (PNG entries, 16–256 px), the
// installer, window and taskbar icon. Run with Electron: npm run icon.
import { app, BrowserWindow } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const svg = readFileSync(join(dir, 'icon.svg'), 'utf8');

/** One offscreen window; each size is drawn at the top-left corner and captured. */
async function render(win, size) {
  const html = `<body style="margin:0;background:transparent;overflow:hidden">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((r) => setTimeout(r, 200));
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: size, height: size });
  return image.resize({ width: size, height: size }).toPNG();
}

/** ICO container with PNG images (supported since Windows Vista). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.png)]);
}

app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 320,
    height: 320,
    useContentSize: true,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true },
  });
  const pngs = [];
  for (const size of SIZES) pngs.push({ size, png: await render(win, size) });
  win.destroy();
  writeFileSync(join(dir, 'icon.ico'), ico(pngs));
  app.quit();
});
