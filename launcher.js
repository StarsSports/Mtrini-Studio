const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

console.clear();
console.log("==============================================================");
console.log("                        MTRINI DESKTOP                        ");
console.log("                  Made By Ayham Projects Group                ");
console.log("==============================================================");
console.log("");
console.log("[⚡] Booting secure companion launcher...");
console.log("[★] Client Version: 1.2.0");
console.log("[★] System Compatibility: Windows 10/11 & macOS");
console.log("");

const targetUrl = "https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app";

console.log("[+] Initializing standalone web container mode...");
console.log("[⚙] URL: " + targetUrl);
console.log("");

let cmd = '';
const platform = os.platform();

if (platform === 'win32') {
  // On Windows, try to launch Chrome or Edge in --app (Application Mode)
  const chromePaths = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['LocalAppData'] || '', 'Google\\Chrome\\Application\\chrome.exe')
  ];
  
  const edgePaths = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe')
  ];

  let appPath = '';
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      appPath = p;
      break;
    }
  }
  if (!appPath) {
    for (const p of edgePaths) {
      if (fs.existsSync(p)) {
        appPath = p;
        break;
      }
    }
  }

  if (appPath) {
    cmd = `"${appPath}" --app="${targetUrl}"`;
    console.log("[✔] Found browser client runtime. Launching in Native window...");
  } else {
    // Fallback: Open in default browser via start
    cmd = `start "" "${targetUrl}"`;
    console.log("[!] Native wrapper client not found. Falling back to default browser...");
  }
} else if (platform === 'darwin') {
  const chromeMacPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(chromeMacPath)) {
    cmd = `"${chromeMacPath}" --app="${targetUrl}"`;
    console.log("[✔] Found Google Chrome on macOS. Launching in Mac Sandbox...");
  } else {
    cmd = `open "${targetUrl}"`;
    console.log("[!] Chrome not found. Launching Safari default web container...");
  }
} else {
  cmd = `xdg-open "${targetUrl}"`;
}

exec(cmd, (err) => {
  if (err) {
    console.log("[!] Encountered warning: " + err.message);
    if (platform === 'win32') {
      exec(`start "" "${targetUrl}"`);
    } else if (platform === 'darwin') {
      exec(`open "${targetUrl}"`);
    }
  } else {
    console.log("[★] Launch successful! Standalone web app is running.");
  }
  
  console.log("");
  console.log("Leaving agent background runner active. Minimizing in 4 seconds...");
  
  setTimeout(() => {
    process.exit(0);
  }, 4000);
});
