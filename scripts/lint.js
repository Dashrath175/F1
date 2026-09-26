/**
 * Strict Linter and Forensic Codebase Validator for Ferrari F1 Showcase
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('=== RUNNING CODEBASE LINT & FORENSIC AUDIT ===');

let errorCount = 0;

// 1. JavaScript Syntax Check using Node's native module syntax checker
const jsFiles = ['src/main.js'];
for (const relPath of jsFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`[ERROR] File missing: ${relPath}`);
        errorCount++;
        continue;
    }
    try {
        execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
        console.log(`[PASS] Syntax check passed: ${relPath}`);
    } catch (e) {
        console.error(`[FAIL] Syntax error in ${relPath}:`, e.stderr.toString());
        errorCount++;
    }
}

// 2. Forensic Check: strictly forbid old vehicle assets, legacy generators, and game mechanics
const strictlyForbiddenPatterns = [
    /f1_car\.glb/i,
    /test\.glb/i,
    /generate_f1_car/i,
    /textures\.js/i,
    /standalone\.html/i,
    /transformers/i,
    /DRACOLoader/i,
    /KTX2Loader/i,
    /\bwasd\b/i,
    /\bspeedometer\b/i,
    /\blap counter\b/i,
    /\bgear shifting\b/i,
    /\bphysics engine\b/i
];

const checkFiles = ['index.html', 'style.css', 'src/main.js'];
for (const relPath of checkFiles) {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pat of strictlyForbiddenPatterns) {
            if (pat.test(line)) {
                console.error(`[FAIL] Forbidden reference matching ${pat} in ${relPath}:${i + 1}`);
                console.error(`       > ${line.trim()}`);
                errorCount++;
            }
        }
    }
}

// 3. Verify that the ONLY 3D model asset in the project is Ferrari_F1_Clean.glb
const allowedModel = path.normalize('public/models/Ferrari_F1_Clean.glb').toLowerCase();
const allFiles = fs.readdirSync(rootDir, { recursive: true });
let modelCount = 0;

for (const item of allFiles) {
    const normalizedItem = path.normalize(item).toLowerCase();
    const ext = path.extname(normalizedItem);
    if (['.glb', '.gltf', '.bin', '.blend', '.blend1', '.obj', '.fbx'].includes(ext)) {
        if (normalizedItem === allowedModel || normalizedItem === path.normalize('dist/public/models/Ferrari_F1_Clean.glb').toLowerCase()) {
            modelCount++;
            console.log(`[PASS] Verified authorized model asset: ${item}`);
        } else {
            console.error(`[FAIL] Unauthorized 3D model file found: ${item}`);
            errorCount++;
        }
    }
}

if (modelCount === 0) {
    console.error('[FAIL] Authorized model Ferrari_F1_Clean.glb is missing from public/models!');
    errorCount++;
}

// 4. Verify model path existence and size
const modelPath = path.join(rootDir, 'public', 'models', 'Ferrari_F1_Clean.glb');
if (!fs.existsSync(modelPath)) {
    console.error('[FAIL] Model file does not exist at public/models/Ferrari_F1_Clean.glb');
    errorCount++;
} else {
    const stats = fs.statSync(modelPath);
    if (stats.size < 1000000) {
        console.error(`[FAIL] Model file size suspicious (${stats.size} bytes)`);
        errorCount++;
    } else {
        console.log(`[PASS] Model asset verified (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
}

if (errorCount === 0) {
    console.log('=== LINT & FORENSIC AUDIT: 100% CLEAN (0 ERRORS) ===');
    process.exit(0);
} else {
    console.error(`=== LINT & FORENSIC AUDIT FAILED (${errorCount} ERRORS) ===`);
    process.exit(1);
}
