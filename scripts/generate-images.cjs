const fs = require('fs');
const path = require('path');

// ── Brand color palette ────────────────────────────────────────────
const brandColors = {
    'Tata': { g1: '#1e3a5f', g2: '#0a1628', accent: '#3b82f6' },
    'Maruti Suzuki': { g1: '#1a2f4a', g2: '#0c1320', accent: '#e63946' },
    'Maruti Suzuki R': { g1: '#1a2f4a', g2: '#0c1320', accent: '#e63946' },
    'Hyundai': { g1: '#002c5f', g2: '#001529', accent: '#00aad2' },
    'Honda': { g1: '#cc0000', g2: '#330000', accent: '#ff6b6b' },
    'Toyota': { g1: '#1a1a2e', g2: '#0f0f1a', accent: '#eb0a1e' },
    'Mahindra': { g1: '#8b0000', g2: '#2d0000', accent: '#e74c3c' },
    'Kia': { g1: '#05141f', g2: '#0a0a0a', accent: '#bb162b' },
    'MG Motor': { g1: '#1b1b3a', g2: '#0d0d1a', accent: '#c41230' },
    'Mg': { g1: '#1b1b3a', g2: '#0d0d1a', accent: '#c41230' },
    'Volkswagen': { g1: '#001e3c', g2: '#000d1a', accent: '#0066b1' },
    'Skoda': { g1: '#1b4332', g2: '#0a1f18', accent: '#4ea24e' },
    'Ford': { g1: '#003478', g2: '#001a3d', accent: '#1e90ff' },
    'Renault': { g1: '#2c2c2c', g2: '#111111', accent: '#ffcc00' },
    'Nissan': { g1: '#1a1a2e', g2: '#0d0d17', accent: '#c3002f' },
    'Datsun': { g1: '#1d2d44', g2: '#0e1621', accent: '#c0392b' },
    'Fiat': { g1: '#8b0000', g2: '#2d0000', accent: '#e63946' },
    'Jeep': { g1: '#2f3e28', g2: '#171f14', accent: '#6b8e23' },
    'Bmw': { g1: '#1c2331', g2: '#0d1117', accent: '#0066b1' },
    'Audi': { g1: '#1a1a1a', g2: '#0a0a0a', accent: '#bb0a30' },
    'Mercedes-Benz': { g1: '#1a1a1a', g2: '#0a0a0a', accent: '#a0a0a0' },
    'Volvo': { g1: '#003057', g2: '#001a2e', accent: '#003f72' },
    'Jaguar': { g1: '#1a1a1a', g2: '#0a0a0a', accent: '#9b7b4a' },
    'Land Rover': { g1: '#1b3a2d', g2: '#0d1e17', accent: '#005a2b' },
    'Land Rover Rover': { g1: '#1b3a2d', g2: '#0d1e17', accent: '#005a2b' },
    'Porsche': { g1: '#1a1a1a', g2: '#0a0a0a', accent: '#d5a500' },
    'Ferrari': { g1: '#3d0000', g2: '#1a0000', accent: '#ff2800' },
    'Lamborghini': { g1: '#2d2d00', g2: '#141400', accent: '#daa520' },
    'Bentley': { g1: '#1a2332', g2: '#0b1018', accent: '#a4633c' },
    'Bugatti': { g1: '#0a0a2e', g2: '#050517', accent: '#eb2d31' },
    'Maserati': { g1: '#0f1c3f', g2: '#070e20', accent: '#003478' },
    'Aston Martin': { g1: '#1a2e1a', g2: '#0d170d', accent: '#006633' },
    'Lexus': { g1: '#1a1a1a', g2: '#0a0a0a', accent: '#1a1aff' },
    'Mini': { g1: '#1a1a1a', g2: '#050505', accent: '#b6252a' },
    'Mitsubishi': { g1: '#2d1416', g2: '#160a0b', accent: '#e60012' },
    'Isuzu': { g1: '#1c2331', g2: '#0d1117', accent: '#cc0000' },
    'Force': { g1: '#1a2f4a', g2: '#0c1320', accent: '#ff6600' },
    'Dc': { g1: '#2d2d2d', g2: '#111111', accent: '#ff4500' },
    'Icml': { g1: '#2d2d2d', g2: '#111111', accent: '#336699' },
    'Premier': { g1: '#2d2d2d', g2: '#111111', accent: '#cc9900' },
    'Bajaj': { g1: '#003366', g2: '#001a33', accent: '#0077b6' },
};

// ── Body-type silhouette paths ─────────────────────────────────────
const bodyPaths = {
    'SUV': 'M80,195 L95,185 L110,170 L120,155 L135,150 L180,148 L210,145 L250,142 L290,142 L350,142 L400,145 L440,148 L480,152 L510,165 L525,175 L540,185 L555,195 L80,195 Z M140,195 A25,25 0 1,1 190,195 A25,25 0 1,1 140,195 Z M430,195 A25,25 0 1,1 480,195 A25,25 0 1,1 430,195 Z',
    'Hatchback': 'M100,195 L120,185 L135,175 L148,160 L165,150 L200,148 L240,148 L280,150 L340,150 L380,155 L430,162 L470,170 L500,180 L520,190 L530,195 L100,195 Z M145,195 A22,22 0 1,1 189,195 A22,22 0 1,1 145,195 Z M430,195 A22,22 0 1,1 474,195 A22,22 0 1,1 430,195 Z',
    'Sedan': 'M85,195 L105,185 L120,175 L135,162 L155,152 L190,148 L230,146 L320,146 L380,146 L420,148 L465,150 L500,158 L525,170 L540,180 L550,190 L555,195 L85,195 Z M140,195 A24,24 0 1,1 188,195 A24,24 0 1,1 140,195 Z M440,195 A24,24 0 1,1 488,195 A24,24 0 1,1 440,195 Z',
    'MPV': 'M80,195 L100,185 L110,170 L118,155 L130,148 L160,145 L200,143 L350,143 L420,143 L480,148 L510,158 L530,170 L545,185 L555,195 L80,195 Z M135,195 A25,25 0 1,1 185,195 A25,25 0 1,1 135,195 Z M435,195 A25,25 0 1,1 485,195 A25,25 0 1,1 435,195 Z',
    'MUV': 'M80,195 L100,185 L110,170 L118,155 L130,148 L160,145 L200,143 L350,143 L420,143 L480,148 L510,158 L530,170 L545,185 L555,195 L80,195 Z M135,195 A25,25 0 1,1 185,195 A25,25 0 1,1 135,195 Z M435,195 A25,25 0 1,1 485,195 A25,25 0 1,1 435,195 Z',
    'Coupe': 'M100,195 L125,182 L145,168 L165,155 L200,148 L250,146 L310,147 L370,150 L420,155 L460,165 L500,178 L525,190 L535,195 L100,195 Z M148,195 A22,22 0 1,1 192,195 A22,22 0 1,1 148,195 Z M435,195 A22,22 0 1,1 479,195 A22,22 0 1,1 435,195 Z',
    'Sports': 'M110,195 L130,182 L150,168 L170,158 L210,150 L260,148 L320,148 L370,150 L420,155 L460,165 L495,178 L520,190 L530,195 L110,195 Z M155,195 A21,21 0 1,1 197,195 A21,21 0 1,1 155,195 Z M430,195 A21,21 0 1,1 472,195 A21,21 0 1,1 430,195 Z',
    'Convertible': 'M110,195 L130,182 L148,170 L168,160 L210,155 L260,153 L320,153 L370,155 L420,160 L460,170 L495,182 L520,192 L530,195 L110,195 Z M155,195 A21,21 0 1,1 197,195 A21,21 0 1,1 155,195 Z M430,195 A21,21 0 1,1 472,195 A21,21 0 1,1 430,195 Z',
    'Crossover': 'M90,195 L108,185 L120,172 L135,158 L155,150 L190,147 L240,145 L310,145 L370,145 L420,148 L460,152 L500,165 L525,178 L545,190 L555,195 L90,195 Z M142,195 A24,24 0 1,1 190,195 A24,24 0 1,1 142,195 Z M435,195 A24,24 0 1,1 483,195 A24,24 0 1,1 435,195 Z',
    'Pick-up': 'M80,195 L100,185 L115,172 L130,158 L145,150 L175,147 L210,145 L260,145 L300,145 L340,150 L500,150 L530,170 L545,185 L555,195 L80,195 Z M135,195 A25,25 0 1,1 185,195 A25,25 0 1,1 135,195 Z M440,195 A25,25 0 1,1 490,195 A25,25 0 1,1 440,195 Z',
};

function getBodyPath(bodyType) {
    const bt = bodyType.split(',')[0].trim();
    return bodyPaths[bt] || bodyPaths['Sedan'];
}

function getColors(brand) {
    return brandColors[brand] || { g1: '#1a2332', g2: '#0b1018', accent: '#3b82f6' };
}

function escXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Generate SVG ───────────────────────────────────────────────────
function generateSVG(car) {
    const c = getColors(car.brand);
    const silhouette = getBodyPath(car.bodyType);
    const brandText = escXml(car.brand.toUpperCase());
    const nameText = escXml(car.name.replace(car.brand + ' ', ''));
    const priceText = escXml(car.priceRange || '');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 664 374" width="664" height="374">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c.g1}"/>
      <stop offset="100%" stop-color="${c.g2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="white" stop-opacity="0"/>
      <stop offset="30%" stop-color="white" stop-opacity="0.08"/>
      <stop offset="70%" stop-color="white" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="664" height="374" fill="url(#bg)" rx="0"/>
  <!-- Subtle grid pattern -->
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-opacity="0.02" stroke-width="1"/>
  </pattern>
  <rect width="664" height="374" fill="url(#grid)"/>
  <!-- Top shine -->
  <rect width="664" height="180" fill="url(#shine)"/>
  <!-- Accent line -->
  <rect x="50" y="80" width="60" height="3" rx="1.5" fill="${c.accent}" opacity="0.8"/>
  <!-- Brand name -->
  <text x="50" y="115" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" opacity="0.4" letter-spacing="3">${brandText}</text>
  <!-- Car model name -->
  <text x="50" y="155" font-family="Inter,system-ui,sans-serif" font-size="32" font-weight="800" fill="white" opacity="0.95">${nameText}</text>
  <!-- Price -->
  <text x="50" y="185" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="500" fill="${c.accent}" opacity="0.9">${priceText}</text>
  <!-- Road line -->
  <rect x="0" y="280" width="664" height="1" fill="url(#road)"/>
  <!-- Car silhouette -->
  <g transform="translate(40,90) scale(1.05)" opacity="0.15">
    <path d="${silhouette}" fill="white"/>
  </g>
  <!-- Body type badge -->
  <rect x="540" y="30" width="${car.bodyType.length * 9 + 24}" height="26" rx="6" fill="${c.accent}" opacity="0.2"/>
  <text x="${540 + 12}" y="48" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" fill="${c.accent}">${escXml(car.bodyType.split(',')[0].trim())}</text>
  <!-- Bottom gradient fade -->
  <rect x="0" y="290" width="664" height="84" fill="url(#bg)" opacity="0.5"/>
</svg>`;
}

// ── Main ───────────────────────────────────────────────────────────
const carsPath = '/Users/montero/Desktop/AW mark I/src/data/cars.json';
const imgDir = '/Users/montero/Desktop/AW mark I/public/images/cars';
const cars = JSON.parse(fs.readFileSync(carsPath, 'utf8'));

// Create output directory
fs.mkdirSync(imgDir, { recursive: true });

let generated = 0;
for (const car of cars) {
    const svgContent = generateSVG(car);
    const filename = car.id + '.svg';
    fs.writeFileSync(path.join(imgDir, filename), svgContent);
    generated++;

    // Update images array: SVG first, then keep existing real images
    const svgPath = `/images/cars/${filename}`;
    const realImages = car.images.filter(img => !img.includes('placeholder'));
    car.images = [svgPath, ...realImages];
}

fs.writeFileSync(carsPath, JSON.stringify(cars, null, 2));
console.log(`Generated ${generated} SVG card images`);
console.log(`Updated cars.json with new image paths`);
