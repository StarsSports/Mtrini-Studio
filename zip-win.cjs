const AdmZip = require('adm-zip');
const fs = require('fs');

console.log('[+] Zipping dist-desktop/win/Mtrini-win32-x64 into Mtrini_Desktop_1.1.zip...');

if (fs.existsSync('Mtrini_Desktop_1.1.zip')) {
  fs.unlinkSync('Mtrini_Desktop_1.1.zip');
}

const zip = new AdmZip();
zip.addLocalFolder('dist-desktop/win/Mtrini-win32-x64');
zip.writeZip('Mtrini_Desktop_1.1.zip');

const stats = fs.statSync('Mtrini_Desktop_1.1.zip');
console.log(`[✔] Windows ZIP created successfully. Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
