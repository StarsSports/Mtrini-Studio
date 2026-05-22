const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const launcherCode = `
const { exec } = require('child_process');
const os = require('os');

console.clear();
console.log("==============================================================");
console.log("                        MTRINI DESKTOP                        ");
console.log("                  Made By Ayham Projects Group                ");
console.log("==============================================================");
console.log("");
console.log("[⚡] Booting secure companion launcher...");
console.log("[★] Client Version: 1.1.0");
console.log("[★] System Compatibility: Windows 10/11 & macOS");
console.log("");

const targetUrl = "https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app";

console.log("[+] Opening default system web browser...");
console.log("[⚙] Link: " + targetUrl);
console.log("");

let cmd = '';
if (os.platform() === 'win32') {
  cmd = 'start "" "' + targetUrl + '"';
} else if (os.platform() === 'darwin') {
  cmd = 'open "' + targetUrl + '"';
} else {
  cmd = 'xdg-open "' + targetUrl + '"';
}

exec(cmd, (err) => {
  if (err) {
    console.log("[!] Encountered warning: " + err.message);
  } else {
    console.log("[★] Launch successful! Connection routed to web workspace.");
  }
  
  console.log("");
  console.log("Closing session window in 4 seconds...");
  
  setTimeout(() => {
    process.exit(0);
  }, 4000);
});
`;

const launcherPath = path.join(__dirname, 'launcher.js');
fs.writeFileSync(launcherPath, launcherCode);

console.log('[+] Created cross-platform launcher.js source code.');

// 1. Build Windows x64 Binary
console.log('[+] Compiling Windows Native Executable (Win 10/11 x64)...');
try {
  execSync('npx pkg -t node18-win-x64 launcher.js -o Mtrini_Desktop_1.1.exe', { stdio: 'inherit' });
  console.log('[✔] Compiled successfully: Mtrini_Desktop_1.1.exe');
} catch (e) {
  console.error('[!] Primary Windows compilation failed, trying fallback...', e.message);
  try {
    execSync('npx pkg -t node16-win-x64 launcher.js -o Mtrini_Desktop_1.1.exe', { stdio: 'inherit' });
  } catch (e2) {
    console.error('[!] Critical Windows compilation failure.', e2.message);
  }
}

// 2. Build Mac Silicon Binary
console.log('[+] Compiling macOS Apple Silicon Executable (M1/M2/M3)...');
try {
  execSync('npx pkg -t node16-macos-arm64 launcher.js -o Mtrini_Mac_Silicon --no-bytecode', { stdio: 'inherit' });
  console.log('[✔] Compiled successfully: Mtrini_Mac_Silicon');
} catch (e) {
  console.error('[!] macOS Silicon compilation failed, trying fallback...', e.message);
  try {
    execSync('npx pkg -t node16-macos-arm64 launcher.js -o Mtrini_Mac_Silicon --no-bytecode', { stdio: 'inherit' });
  } catch (e2) {
    console.error('[!] Failed to compile Mac Silicon binary.', e2.message);
  }
}

// 3. Build Mac Intel Binary
console.log('[+] Compiling macOS Intel Executable (x64)...');
try {
  execSync('npx pkg -t node18-macos-x64 launcher.js -o Mtrini_Mac_Intel', { stdio: 'inherit' });
  console.log('[✔] Compiled successfully: Mtrini_Mac_Intel');
} catch (e) {
  console.error('[!] macOS Intel compilation failed, trying fallback node16...', e.message);
  try {
    execSync('npx pkg -t node16-macos-x64 launcher.js -o Mtrini_Mac_Intel', { stdio: 'inherit' });
  } catch (e2) {
    console.error('[!] Failed to compile Mac Intel binary.', e2.message);
  }
}

process.exit(0);
