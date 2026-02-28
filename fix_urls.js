const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('./src', function (filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('http://localhost:3002/api')) {
            let updated = content.replace(/http:\/\/localhost:3002\/api/g, '/api');
            fs.writeFileSync(filePath, updated);
            console.log('Fixed:', filePath);
        }
    }
});
