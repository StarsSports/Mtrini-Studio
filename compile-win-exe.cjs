const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { ZipArchive } = require('archiver');

console.log('==============================================================');
console.log('            BUILDING STANDALONE ELECTRON DESKTOP APPS         ');
console.log('==============================================================\n');

// 1. Build the production React client and packaged production server.cjs
console.log('[+] Packing application production bundles...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('[✔] Finished compiling React and bundled Server Express binary.\n');
} catch (e) {
  console.error('[!] Dependency compilation failed:', e.message);
  process.exit(1);
}

// 2. Prepare the clean Electron staging workspace
console.log('[+] Initializing clean Electron staging workspace...');
const stagingDir = path.join(__dirname, 'desktop-staging');
const distDesktop = path.join(__dirname, 'dist-desktop');

try {
  // Clean up previous runs
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  if (fs.existsSync(distDesktop)) {
    fs.rmSync(distDesktop, { recursive: true, force: true });
  }

  // Create workspace directories
  fs.mkdirSync(stagingDir, { recursive: true });
  fs.mkdirSync(distDesktop, { recursive: true });

  // Copy entry points and output folders
  fs.cpSync(path.join(__dirname, 'electron-main.cjs'), path.join(stagingDir, 'electron-main.cjs'));
  fs.cpSync(path.join(__dirname, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });

  // Write a clean package JS configuration for Electron launcher runtimes
  const packageConfig = {
    name: 'mtrini-desktop',
    version: '1.2.0',
    description: 'Mtrini Desktop Studio',
    main: 'electron-main.cjs',
    private: true
  };
  fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(packageConfig, null, 2));

  console.log('[✔] Staging workspace created successfully at ./desktop-staging\n');
} catch (e) {
  console.error('[!] Failed to construct Electron staging workspace:', e.message);
  process.exit(1);
}

// Helper to download files over HTTPS
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

// Custom packaging flow for Windows to avoid Wine installation requirement on Linux
async function packageWindowsCustom(staging, outDir) {
  const electronVersion = '28.2.0';
  const url = `https://github.com/electron/electron/releases/download/v${electronVersion}/electron-v${electronVersion}-win32-x64.zip`;
  const zipPath = path.join(__dirname, 'electron-win32-x64.zip');
  
  const targetWinParent = path.join(outDir, 'win');
  const targetWinDir = path.join(targetWinParent, 'Mtrini-win32-x64');

  if (!fs.existsSync(targetWinParent)) {
    fs.mkdirSync(targetWinParent, { recursive: true });
  }
  if (fs.existsSync(targetWinDir)) {
    fs.rmSync(targetWinDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetWinDir, { recursive: true });

  // Download Windows Electron binary zip if not cached
  if (!fs.existsSync(zipPath)) {
    console.log(`[+] Downloading precompiled Windows Electron runtime v${electronVersion}...`);
    await downloadFile(url, zipPath);
    console.log('[✔] Windows Electron binary downloaded successfully.');
  } else {
    console.log('[+] Using cached Windows Electron binary zip.');
  }

  // Extract Electron binary
  console.log('[+] Extracting Windows Electron executable to target destination...');
  // We can use extract-zip package which is installed as electron-packager dependency
  const extract = require('extract-zip');
  await extract(zipPath, { dir: targetWinDir });
  console.log('[✔] Extraction complete.');

  // Rename electron.exe to Mtrini.exe
  const originalExe = path.join(targetWinDir, 'electron.exe');
  const targetExe = path.join(targetWinDir, 'Mtrini.exe');
  if (fs.existsSync(originalExe)) {
    fs.renameSync(originalExe, targetExe);
    console.log('[✔] Renamed execution entry point to Mtrini.exe');
  }

  // Copy staging resources to resources/app/
  const appResourcesDir = path.join(targetWinDir, 'resources', 'app');
  fs.mkdirSync(appResourcesDir, { recursive: true });

  console.log('[+] Integrating custom Mtrini resources into Electron workspace...');
  fs.cpSync(staging, appResourcesDir, { recursive: true });
  console.log('[✔] Integration successful.');
}

async function main() {
  // 3. Compile Windows Standalone Binary
  console.log('[+] Compiling Windows x64 Native Desktop App (Custom, Wine-Independent)...');
  try {
    await packageWindowsCustom(stagingDir, distDesktop);
    console.log('[✔] Native Windows App packaged successfully.\n');
  } catch (e) {
    console.error('[!] Windows compilation failed:', e.message);
  }

  // 4. Compile macOS Apple Silicon Standalone Binary
  console.log('[+] Compiling macOS Apple Silicon (Arm64) Native Desktop App...');
  try {
    execSync(
      'npx electron-packager desktop-staging Mtrini --platform=darwin --arch=arm64 --out=dist-desktop/mac-silicon --overwrite --executable-name=Mtrini',
      { stdio: 'inherit' }
    );
    console.log('[✔] Standalone Apple Silicon app packaged successfully.\n');
  } catch (e) {
    console.error('[!] macOS Silicon compilation failed:', e.message);
  }

  // 5. Compile macOS Intel Standalone Binary
  console.log('[+] Compiling macOS Intel (x64) Native Desktop App...');
  try {
    execSync(
      'npx electron-packager desktop-staging Mtrini --platform=darwin --arch=x64 --out=dist-desktop/mac-intel --overwrite --executable-name=Mtrini',
      { stdio: 'inherit' }
    );
    console.log('[✔] Standalone macOS Intel app packaged successfully.\n');
  } catch (e) {
    console.error('[!] macOS Intel compilation failed:', e.message);
  }

  // 6. Confirm standalone folders have been created cleanly
  console.log('[✔] Compiled desktop folders are ready in dist-desktop/. Zip extraction will be computed on demand on the download API.');
  try {
    const zips = ['Mtrini_Desktop_1.1.zip', 'Mtrini_Mac_Silicon.zip', 'Mtrini_Mac_Intel.zip'];
    zips.forEach((zip) => {
      if (fs.existsSync(zip)) {
        fs.unlinkSync(zip);
        console.log(`[✔] Removed stale static zip file: ${zip}`);
      }
    });
  } catch (err) {
    console.error('[-] Error cleaning up stale zips in build process:', err.message);
  }

  // Clean up temporary workspace
  try {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
    console.log('[✔] Temporary desktop-staging folder cleaned up.');
  } catch (e) {}

  process.exit(0);
}

main().catch(err => {
  console.error('[!] Critical Error during compilation:', err);
  process.exit(1);
});
