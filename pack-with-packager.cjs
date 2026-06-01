const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const stagingDir = path.join(__dirname, 'desktop-staging');
const distDesktop = path.join(__dirname, 'dist-desktop');

console.log('[+] Packing application staging bundles...');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Copy essential files
fs.cpSync(path.join(__dirname, 'electron-main.cjs'), path.join(stagingDir, 'electron-main.cjs'));
fs.cpSync(path.join(__dirname, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });

// Minimal package.json to completely avoid Wine dependencies on Linux
const packageConfig = {
  name: 'mtrini',
  main: 'electron-main.cjs'
};
fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageConfig, null, 2));

console.log('[+] Compiling Windows desktop application with electron-packager...');
try {
  // We run electron-packager. We do NOT specify copyright, icon, or versions to skip rcedit Wine lookup
  execSync(
    'npx electron-packager desktop-staging Mtrini --platform=win32 --arch=x64 --out=dist-desktop/win --overwrite',
    { stdio: 'inherit' }
  );
  console.log('[✔] Windows Native App packaged successfully via electron-packager!');
} catch (e) {
  console.error('[!] electron-packager Windows build failed:', e.message);
}
