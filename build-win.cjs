const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

const stagingDir = path.join(__dirname, 'desktop-staging');
const distDesktop = path.join(__dirname, 'dist-desktop');
const zipPath = path.join(__dirname, 'electron-win32-x64.zip');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const electronVersion = '28.2.0';
  const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-win32-x64.zip`;

  console.log('[+] Initializing Electron staging workspace...');
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  // Copy files
  fs.cpSync(path.join(__dirname, 'electron-main.cjs'), path.join(stagingDir, 'electron-main.cjs'));
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.cpSync(path.join(__dirname, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });
  } else {
    throw new Error('Frontend dist/ folder is missing! Run npm run build or compile first.');
  }

  const packageConfig = {
    name: 'mtrini',
    version: '1.2.0',
    main: 'electron-main.cjs'
  };
  fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageConfig, null, 2));

  // Download ZIP
  if (!fs.existsSync(zipPath)) {
    console.log(`[+] Downloading precompiled Windows Electron runtime v${electronVersion}...`);
    const startDL = Date.now();
    await downloadFile(url, zipPath);
    console.log(`[✔] Download complete in ${((Date.now() - startDL)/1000).toFixed(2)} seconds.`);
  } else {
    console.log('[+] Using cached Windows Electron ZIP.');
  }

  const targetWinParent = path.join(distDesktop, 'win');
  const targetWinDir = path.join(targetWinParent, 'Mtrini-win32-x64');

  if (!fs.existsSync(targetWinParent)) {
    fs.mkdirSync(targetWinParent, { recursive: true });
  }
  if (fs.existsSync(targetWinDir)) {
    fs.rmSync(targetWinDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetWinDir, { recursive: true });

  console.log('[+] Unpacking Windows Electron runtime...');
  const startZip = Date.now();
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetWinDir, true);
  console.log(`[✔] Unpacked in ${((Date.now() - startZip)/1000).toFixed(2)} seconds.`);

  // Rename electron.exe to Mtrini.exe
  const originalExe = path.join(targetWinDir, 'electron.exe');
  const targetExe = path.join(targetWinDir, 'Mtrini.exe');
  if (fs.existsSync(originalExe)) {
    fs.renameSync(originalExe, targetExe);
    console.log('[✔] Renamed execution entry point to Mtrini.exe');
  }

  // Copy/integrate staging resources to resources/app/
  const appResourcesDir = path.join(targetWinDir, 'resources', 'app');
  fs.mkdirSync(appResourcesDir, { recursive: true });

  console.log('[+] Integrating custom Mtrini resources into Electron workspace...');
  fs.cpSync(stagingDir, appResourcesDir, { recursive: true });
  console.log('[✔] Integration successful.');

  // Clean staging
  fs.rmSync(stagingDir, { recursive: true, force: true });
  console.log('[✔] Cleaned temporary staging folder.');

  // Zipping Windows app
  console.log('[+] Packing Windows App into Mtrini_Desktop_1.1.zip...');
  if (fs.existsSync('Mtrini_Desktop_1.1.zip')) {
    fs.unlinkSync('Mtrini_Desktop_1.1.zip');
  }

  const outZip = new AdmZip();
  outZip.addLocalFolder(targetWinDir);
  outZip.writeZip('Mtrini_Desktop_1.1.zip');

  const stats = fs.statSync('Mtrini_Desktop_1.1.zip');
  console.log(`[★] Output Windows ZIP size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log('[✔] BUILD AND PACKAGING OF WINDOWS DESKTOP APP COMPLETE!');
}

main().catch(err => {
  console.error('[!] Compilation failed:', err);
  process.exit(1);
});
