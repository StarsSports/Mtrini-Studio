const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const stagingDir = path.join(__dirname, 'desktop-staging');
const distDesktop = path.join(__dirname, 'dist-desktop');
const zipPath = path.join(__dirname, 'electron-win32-x64.zip');

async function main() {
  console.log('[+] Initializing clean Electron staging workspace at ./desktop-staging...');
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  // Copy files
  fs.cpSync(path.join(__dirname, 'electron-main.cjs'), path.join(stagingDir, 'electron-main.cjs'));
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.cpSync(path.join(__dirname, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });
  } else {
    throw new Error('Frontend dist/ folder is missing! Run npm run build first.');
  }

  const packageConfig = {
    name: 'mtrini',
    version: '1.2.0',
    main: 'electron-main.cjs'
  };
  fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageConfig, null, 2));

  console.log('[+] Packing Windows app...');
  const targetWinParent = path.join(distDesktop, 'win');
  const targetWinDir = path.join(targetWinParent, 'Mtrini-win32-x64');

  if (!fs.existsSync(targetWinParent)) {
    fs.mkdirSync(targetWinParent, { recursive: true });
  }
  if (fs.existsSync(targetWinDir)) {
    fs.rmSync(targetWinDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetWinDir, { recursive: true });

  console.log('[+] Status: stagingDir exists?', fs.existsSync(stagingDir));
  console.log('[+] Extracting Windows Electron executable to target destination...');
  await extract(zipPath, { dir: targetWinDir });
  console.log('[✔] Extraction complete.');
  console.log('[+] Status after extraction: stagingDir exists?', fs.existsSync(stagingDir));

  // Rename electron.exe to Mtrini.exe
  const originalExe = path.join(targetWinDir, 'electron.exe');
  const targetExe = path.join(targetWinDir, 'Mtrini.exe');
  if (fs.existsSync(originalExe)) {
    fs.renameSync(originalExe, targetExe);
    console.log('[✔] Renamed execution entry point to Mtrini.exe');
  } else {
    console.error('[!] Warning: electron.exe not found inside the zip. Checking directory content...');
    console.log('Files in target directory:', fs.readdirSync(targetWinDir));
  }

  // Copy staging resources to resources/app/
  const appResourcesDir = path.join(targetWinDir, 'resources', 'app');
  fs.mkdirSync(appResourcesDir, { recursive: true });

  console.log('[+] Integrating custom Mtrini resources into Electron workspace...');
  fs.cpSync(stagingDir, appResourcesDir, { recursive: true });
  console.log('[✔] Integration successful.');

  // Zipping Windows app
  console.log('[+] Zipping Windows App into Mtrini_Desktop_1.1.zip...');
  if (fs.existsSync('Mtrini_Desktop_1.1.zip')) {
    fs.unlinkSync('Mtrini_Desktop_1.1.zip');
  }

  execSync(`npx -y bestzip Mtrini_Desktop_1.1.zip -C ${targetWinDir} .`, { stdio: 'inherit' });
  console.log('[✔] ZIP package created.');

  const stats = fs.statSync('Mtrini_Desktop_1.1.zip');
  console.log(`[★] Output Windows ZIP size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // Clean staging
  fs.rmSync(stagingDir, { recursive: true, force: true });
  console.log('[✔] Staging workspace cleaned up.');
}

main().catch(err => {
  console.error('[!] Compilation failed:', err);
  process.exit(1);
});
