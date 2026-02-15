const fs = require('fs');
const path = require('path');

const BRAIN = '/Users/montero/.gemini/antigravity/brain/9bc1f5ad-8d67-447d-bd3b-022e2fb4e9de';
const PUBLIC = '/Users/montero/Desktop/AW mark I/public/cars';

const copies = [
    { from: 'swift_main', to: 'maruti-suzuki-swift/main.png' },
    { from: 'swift_interior', to: 'maruti-suzuki-swift/interior.png' },
    { from: 'i10_nios_main', to: 'hyundai-grand-i10-nios/main.png' },
    { from: 'nexon_main', to: 'tata-nexon/main.png' },
    { from: 'nexon_rear', to: 'tata-nexon/rear.png' },
    { from: 'seltos_main', to: 'kia-seltos/main.png' },
    { from: 'city_main', to: 'honda-city/main.png' },
    { from: 'harrier_main', to: 'tata-harrier/main.png' },
    { from: 'baleno_main', to: 'maruti-suzuki-baleno/main.png' },
    { from: 'xuv300_main', to: 'mahindra-xuv300/main.png' },
    { from: 'altroz_main', to: 'tata-altroz/main.png' },
    { from: 'creta_main', to: 'hyundai-aura/main.png' },
];

// Find files by prefix in BRAIN dir
const brainFiles = fs.readdirSync(BRAIN);

for (const { from, to } of copies) {
    const srcFile = brainFiles.find(f => f.startsWith(from) && f.endsWith('.png'));
    if (!srcFile) {
        console.log(`SKIP: No file matching ${from}*.png`);
        continue;
    }
    const destPath = path.join(PUBLIC, to);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(path.join(BRAIN, srcFile), destPath);
    const size = fs.statSync(destPath).size;
    console.log(`OK: ${srcFile} → ${to} (${(size / 1024).toFixed(0)} KB)`);
}

console.log('\nDone. Contents:');
const dirs = fs.readdirSync(PUBLIC);
for (const dir of dirs) {
    const files = fs.readdirSync(path.join(PUBLIC, dir));
    console.log(`  ${dir}/: ${files.join(', ')}`);
}
