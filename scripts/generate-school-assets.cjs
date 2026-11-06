/* global __dirname */
const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const process = require('node:process');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const root = path.resolve(__dirname, '..');
  const dir = path.join(root, 'assets/branding');
  fs.mkdirSync(dir, { recursive: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect x="12" y="12" width="232" height="232" rx="56" fill="#dc2626"/><path d="M78 66h106v26H108v23h64v26h-64v23h76v26H78z" fill="white"/><circle cx="194" cy="66" r="13" fill="#fecaca"/></svg>';
  fs.writeFileSync(path.join(dir, 'aula-mark.svg'), svg);
  await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(path.join(dir, 'aula-icon.png'));
  const foreground = await sharp(Buffer.from(svg)).resize(660, 660).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff00' } }).composite([{ input: foreground, gravity: 'center' }]).png().toFile(path.join(dir, 'aula-adaptive.png'));
  const mono = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M78 66h106v26H108v23h64v26h-64v23h76v26H78z" fill="black"/></svg>';
  const smallMono = await sharp(Buffer.from(mono)).resize(660, 660).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#ffffff00' } }).composite([{ input: smallMono, gravity: 'center' }]).png().toFile(path.join(dir, 'aula-monochrome.png'));
  const store = path.join(root, 'assets/store/aula');
  fs.mkdirSync(store, { recursive: true });
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(store, 'icon-512.png'));
  const banner = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500"><rect width="1024" height="500" fill="#fff7f7"/><rect x="64" y="90" width="6" height="320" rx="3" fill="#dc2626"/><text x="108" y="202" font-family="Arial,sans-serif" font-weight="bold" font-size="65" fill="#172033">Econolab Aula</text><text x="110" y="266" font-family="Arial,sans-serif" font-size="30" fill="#64748b">Organiza, registra y aprende.</text><text x="110" y="331" font-family="Arial,sans-serif" font-size="24" fill="#b91c1c">Práctica administrativa escolar</text></svg>';
  await sharp(Buffer.from(banner)).png().toFile(path.join(store, 'feature-1024x500.png'));
  process.stdout.write('Recursos de Econolab Aula generados.\n');
}
main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
