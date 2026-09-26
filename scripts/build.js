/**
 * Production Build Script for Ferrari F1 Showcase
 * Builds distribution package into dist/ and verifies integrity.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('=== STARTING PRODUCTION BUILD ===');

// 1. Clean dist directory
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(path.join(distDir, 'src'), { recursive: true });

// 2. Files to copy
const filesToCopy = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'style.css', dest: 'style.css' },
    { src: 'src/main.js', dest: 'src/main.js' }
];

for (const f of filesToCopy) {
    const srcPath = path.join(rootDir, f.src);
    const destPath = path.join(distDir, f.dest);
    if (!fs.existsSync(srcPath)) {
        console.error(`[BUILD ERROR] Source file not found: ${f.src}`);
        process.exit(1);
    }
    fs.copyFileSync(srcPath, destPath);
    const stats = fs.statSync(destPath);
    console.log(`[BUILD] Copied: ${f.dest} (${(stats.size / 1024).toFixed(2)} KB)`);
}

// 3. Copy public directory (including public/models/Ferrari_F1_Clean.glb)
const publicDir = path.join(rootDir, 'public');
if (fs.existsSync(publicDir)) {
    const publicDist = path.join(distDir, 'public');
    fs.cpSync(publicDir, publicDist, { recursive: true });
    console.log('[BUILD] Copied static public assets');
}

// 4. Post-build forensic verification in dist/
const strictlyForbiddenPatterns = [
    /f1_car\.glb/i,
    /test\.glb/i,
    /generate_f1_car/i,
    /textures\.js/i,
    /standalone\.html/i,
    /transformers/i,
    /DRACOLoader/i,
    /KTX2Loader/i
];

let buildErrors = 0;
const allowedModelInDist = path.normalize('public/models/Ferrari_F1_Clean.glb').toLowerCase();
const distFiles = fs.readdirSync(distDir, { recursive: true });

for (const file of distFiles) {
    const fullPath = path.join(distDir, file);
    if (fs.statSync(fullPath).isDirectory()) continue;

    const ext = path.extname(file).toLowerCase();
    const relToDist = path.normalize(file).toLowerCase();

    if (['.glb', '.gltf', '.bin', '.blend', '.obj', '.fbx'].includes(ext)) {
        if (relToDist !== allowedModelInDist) {
            console.error(`[BUILD ERROR] Unauthorized 3D model in dist: ${file}`);
            buildErrors++;
        }
    }

    if (['.html', '.css', '.js'].includes(ext)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        for (const pat of strictlyForbiddenPatterns) {
            if (pat.test(text)) {
                console.error(`[BUILD ERROR] Forbidden pattern ${pat} in dist file: ${file}`);
                buildErrors++;
            }
        }
    }
}

// Verify model exists in dist
const targetModel = path.join(distDir, 'public', 'models', 'Ferrari_F1_Clean.glb');
if (!fs.existsSync(targetModel)) {
    console.error('[BUILD ERROR] Ferrari_F1_Clean.glb missing from dist/public/models');
    buildErrors++;
} else {
    const stats = fs.statSync(targetModel);
    console.log(`[BUILD] Verified target model in dist (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

if (buildErrors > 0) {
    console.error(`=== BUILD FAILED WITH ${buildErrors} ERRORS ===`);
    process.exit(1);
}

console.log('=== BUILD COMPLETED SUCCESSFULLY (0 ERRORS) ===');
