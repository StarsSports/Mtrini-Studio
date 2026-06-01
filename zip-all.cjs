const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

console.log('==============================================================');
console.log('            COMPRESSING NATIVE DESKTOP APPLICATIONS           ');
console.log('==============================================================\n');

const targets = [
  {
    name: 'WINDOWS x64',
    folder: 'dist-desktop/win/Mtrini-win32-x64',
    zipFile: 'Mtrini_Desktop_1.1.zip'
  },
  {
    name: 'macOS SILICON (Arm64)',
    folder: 'dist-desktop/mac-silicon/Mtrini-darwin-arm64',
    zipFile: 'Mtrini_Mac_Silicon.zip'
  },
  {
    name: 'macOS INTEL (x64)',
    folder: 'dist-desktop/mac-intel/Mtrini-darwin-x64',
    zipFile: 'Mtrini_Mac_Intel.zip'
  }
];

targets.forEach((target) => {
  console.log(`[+] Starting compression for ${target.name}...`);
  if (!fs.existsSync(target.folder)) {
    console.error(`[!] Error: Target directory does not exist: ${target.folder}`);
    return;
  }

  if (fs.existsSync(target.zipFile)) {
    console.log(`[-] Removing existing ${target.zipFile}...`);
    fs.unlinkSync(target.zipFile);
  }

  try {
    const zip = new AdmZip();
    zip.addLocalFolder(target.folder);
    console.log(`[~] Packaging files from ${target.folder} (this may take a few seconds)...`);
    zip.writeZip(target.zipFile);
    const stats = fs.statSync(target.zipFile);
    console.log(`[✔] Composed ${target.zipFile} successfully. Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB\n`);
  } catch (e) {
    console.error(`[!] Failed to package ${target.name}:`, e.message);
  }
});

console.log('==============================================================');
console.log('                 ZIPPING COMPLETED SUCCESSFULLY               ');
console.log('==============================================================');
