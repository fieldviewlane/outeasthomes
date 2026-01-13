import fs from 'fs';
import shell from 'shelljs';
import path from 'path';

const rawConfig = JSON.parse(fs.readFileSync('./scripts/image-config.json', 'utf8'));
const { defaults, images } = rawConfig;

const inputDir = '../src/assets/originals';
const outputDir = '../magick_optimization';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.readdirSync(inputDir).forEach(file => {
  if (!file.match(/\.(jpg|jpeg|png)$/i)) return;

  const name = path.parse(file).name;
  const settings = images[name] || images.default_image;
  const inputPath = path.join(inputDir, file);

  console.log(`🚀 Optimizing ${name}...`);

  const runMagick = (suffix, ratio, width, quality, applyBlur) => {
    const outputPath = path.join(outputDir, `${name}-${suffix}.avif`);

    // Build the command parts
    const blurCmd = applyBlur ? `-gaussian-blur ${defaults.blur}` : '';
    const speedCmd = `-define avif:speed=${defaults.speed}`;

    const cmd = `magick "${inputPath}" -gravity center -crop ${ratio}${settings.offset} -resize ${width}x -strip ${blurCmd} ${speedCmd} -quality ${quality} "${outputPath}"`;

    shell.exec(cmd, { silent: true });
  };

  // Small gets the blur to save bytes for PageSpeed
  runMagick('small', '9:16', '520', settings.small_q, true);

  // Medium and Large skip the blur to ensure sharpness
  runMagick('medium', '4:3', '1200', settings.medium_q, false);
  runMagick('large', '16:9', '1920', settings.large_q, false);
});

console.log('✅ Optimization complete.');