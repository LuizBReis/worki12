const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

(async () => {
  try {
    const input = path.resolve(__dirname, '../src/assets/worki.icon.png');
    const output = path.resolve(__dirname, '../src/favicon.ico');

    if (!fs.existsSync(input)) {
      console.error('[favicon] PNG não encontrado em:', input);
      process.exit(1);
    }

    const base = await sharp(input)
      .resize({ width: 256, height: 256, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const sizes = [16, 32, 48, 64, 128, 256];
    const buffers = await Promise.all(
      sizes.map(size => sharp(base).resize(size, size).png().toBuffer())
    );

    const icoBuffer = await toIco(buffers);
    fs.writeFileSync(output, icoBuffer);
    console.log('[favicon] ICO gerado em:', output);
  } catch (err) {
    console.error('[favicon] Falha ao gerar ICO:', err);
    process.exit(1);
  }
})();
