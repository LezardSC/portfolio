/**
 * Exports a source photo as 4:5 AVIF, WebP and JPEG at 240, 480 and 720px wide (<out>/photo-<w>.<ext>).
 * Usage: npm run photo -- <source image> [--out <dir>]   (default out: static/)
 * It never upscales: sizes wider than the source crop are skipped, with a warning.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { planPhoto } from './photo-plan.ts';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : 'static';
const source = args.find((a, i) => !a.startsWith('--') && i !== outIdx + 1);
if (!source || !out) {
	console.error('Usage: npm run photo -- <source image> [--out <dir>]');
	process.exit(1);
}

const { width = 0, height = 0 } = await sharp(source).rotate().metadata();
const plan = planPhoto(width, height);
mkdirSync(out, { recursive: true });
for (const o of plan.outputs) {
	// Rotate first (EXIF), then crop in the rotated frame, then resize.
	const upright = await sharp(source).rotate().toBuffer();
	const img = sharp(upright).extract(plan.crop).resize(o.width, o.height);
	const file = join(out, o.file);
	if (o.format === 'avif') await img.avif({ quality: 60, effort: 6 }).toFile(file);
	else if (o.format === 'webp') await img.webp({ quality: 80 }).toFile(file);
	else await img.jpeg({ quality: 82, mozjpeg: true }).toFile(file);
	console.log(`${file} ${o.width}×${o.height}`);
}
if (!plan.reachesRetina) {
	console.warn(
		`Source is ${width}×${height}: skipped ${plan.skipped.join(', ')}px. Use a source whose 4:5 crop is at least 720px wide.`
	);
}
