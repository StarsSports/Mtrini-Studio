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
