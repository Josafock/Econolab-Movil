/* Exporta el símbolo SVG original de Econolab a los formatos de cada plataforma. */
/* global __dirname */
const { Buffer } = require('node:buffer');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

(async () => {
  const directory = path.resolve(__dirname, '../assets/branding');
  const source = await fs.readFile(path.resolve(__dirname, '../assets/econolab-symbol.svg'), 'utf8');
  await fs.mkdir(directory, { recursive: true });
  const raster = await sharp(Buffer.from(source)).resize(1024, 1024).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#ffffff' } }).composite([{ input: raster }]).removeAlpha().png().toFile(path.join(directory, 'icon.png'));
  await sharp(Buffer.from(source)).resize(960, 960).extend({ top: 32, bottom: 32, left: 32, right: 32, background: '#ffffff00' }).png().toFile(path.join(directory, 'adaptive-foreground.png'));
  // Máscara vectorial para iconos temáticos: el blanco del matraz se convierte en recorte.
  const mask = source.replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/<g filter="url\(#econolab-glow\)">[\s\S]*?<\/g>/, '')
    .replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
    .replace(/fill="white"/g, 'fill="black"').replace(/stroke="white"/g, 'stroke="black"')
    .replace(/fill="url\(#[^)]+\)"/g, 'fill="white"').replace(/stroke="#FF7C8A"/g, 'stroke="black"');
  const monochrome = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><mask id="symbol">${mask}</mask></defs><rect width="1024" height="1024" fill="black" mask="url(#symbol)"/></svg>`;
  await sharp(Buffer.from(monochrome)).resize(960, 960).extend({ top: 32, bottom: 32, left: 32, right: 32, background: '#ffffff00' }).png().toFile(path.join(directory, 'adaptive-monochrome.png'));
  await sharp(Buffer.from(source)).resize(512, 512).png().toFile(path.join(directory, 'splash.png'));
  await sharp(path.join(directory, 'icon.png')).resize(48, 48).png().toFile(path.join(directory, 'favicon.png'));
  process.stdout.write('Iconos de Android, iOS, splash y favicon exportados desde el SVG original.\n');
})().catch(() => { process.stderr.write('No se pudieron exportar los iconos.\n'); process.exitCode = 1; });
