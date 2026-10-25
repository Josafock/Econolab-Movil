/* Material de la ficha desde la marca original; no inventa capturas de la app. */
/* global __dirname */
const fs = require('node:fs/promises');
const path = require('node:path');
const { Buffer } = require('node:buffer');
const sharp = require('sharp');

(async () => {
  const root = path.resolve(__dirname, '..');
  const directory = path.join(root, 'assets/store');
  await fs.mkdir(directory, { recursive: true });
  await sharp(path.join(root, 'assets/branding/icon.png')).resize(512, 512).flatten({ background: '#ffffff' }).removeAlpha().png().toFile(path.join(directory, 'icon-512.png'));
  const symbol = await sharp(path.join(root, 'assets/econolab-symbol.svg')).resize(330, 330).png().toBuffer();
  const words = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500"><rect width="1024" height="500" fill="#fff"/><path d="M0 480H1024V500H0Z" fill="#e11d48"/><text x="400" y="220" font-family="Arial, sans-serif" font-size="66" font-weight="700" fill="#172033">ECONOLAB</text><text x="404" y="275" font-family="Arial, sans-serif" font-size="24" fill="#64748b">Estudios, perfil y cortes por fecha</text><text x="404" y="315" font-family="Arial, sans-serif" font-size="20" fill="#64748b">Para el personal del laboratorio</text></svg>');
  await sharp(words).composite([{ input: symbol, left: 38, top: 75 }]).removeAlpha().png().toFile(path.join(directory, 'feature-1024x500.png'));
  process.stdout.write('Recursos de Google Play generados en assets/store. Las capturas deben tomarse desde la app instalada.\n');
})().catch(() => { process.stderr.write('No se pudieron generar los recursos de la ficha.\n'); process.exitCode = 1; });
