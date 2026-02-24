import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const svgPath = join(projectRoot, 'resources/icon.svg');
const outputDir = join(projectRoot, 'resources');

const svgContent = readFileSync(svgPath, 'utf-8');

async function generateIcons() {
  const sizes = [16, 32, 64, 128, 256, 512, 1024];

  for (const size of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(join(outputDir, 'icon.png'));
  console.log('Generated icon.png');

  const ico16 = await sharp(Buffer.from(svgContent)).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(Buffer.from(svgContent)).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(Buffer.from(svgContent)).resize(48, 48).png().toBuffer();
  const ico64 = await sharp(Buffer.from(svgContent)).resize(64, 64).png().toBuffer();
  const ico128 = await sharp(Buffer.from(svgContent)).resize(128, 128).png().toBuffer();
  const ico256 = await sharp(Buffer.from(svgContent)).resize(256, 256).png().toBuffer();
  const ico512 = await sharp(Buffer.from(svgContent)).resize(512, 512).png().toBuffer();

  const pngBuffer = await sharp(Buffer.from(svgContent)).resize(512, 512).png().toBuffer();
  await sharp(pngBuffer).toFile(join(outputDir, 'icon.png'));
  console.log('All icons generated!');
}

generateIcons().catch(console.error);
