const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');

async function zipFolderAsync(source, outZipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZipPath);
    const archive = new ZipArchive({ zlib: { level: 2 } }); // level 2 for speedy compression of large binaries

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();
  });
}

async function main() {
  console.log('[+] Starting streaming compression of pre-compiled desktop apps...');

  // Windows ZIP
  if (fs.existsSync('dist-desktop/win')) {
    const winFolder = fs.readdirSync('dist-desktop/win').find((dir) => dir.startsWith('Mtrini'));
    if (winFolder) {
      console.log(`Zipping Windows app from dist-desktop/win/${winFolder} to Mtrini_Desktop_1.1.zip...`);
      const start = Date.now();
      await zipFolderAsync(`dist-desktop/win/${winFolder}`, 'Mtrini_Desktop_1.1.zip');
      console.log(`[✔] Windows ZIP created successfully in ${((Date.now() - start)/1000).toFixed(2)}s.`);
    } else {
      console.log('[-] Windows compilation folder not found inside dist-desktop/win');
    }
  }

  // macOS Silicon ZIP
  if (fs.existsSync('dist-desktop/mac-silicon')) {
    const macSiliconFolder = fs.readdirSync('dist-desktop/mac-silicon').find((dir) => dir.startsWith('Mtrini'));
    if (macSiliconFolder) {
      console.log(`Zipping macOS Silicon app from dist-desktop/mac-silicon/${macSiliconFolder} to Mtrini_Mac_Silicon.zip...`);
      const start = Date.now();
      await zipFolderAsync(`dist-desktop/mac-silicon/${macSiliconFolder}`, 'Mtrini_Mac_Silicon.zip');
      console.log(`[✔] macOS Silicon ZIP created successfully in ${((Date.now() - start)/1000).toFixed(2)}s.`);
    } else {
      console.log('[-] macOS Silicon compilation folder not found inside dist-desktop/mac-silicon');
    }
  }

  // macOS Intel ZIP
  if (fs.existsSync('dist-desktop/mac-intel')) {
    const macIntelFolder = fs.readdirSync('dist-desktop/mac-intel').find((dir) => dir.startsWith('Mtrini'));
    if (macIntelFolder) {
      console.log(`Zipping macOS Intel app from dist-desktop/mac-intel/${macIntelFolder} to Mtrini_Mac_Intel.zip...`);
      const start = Date.now();
      await zipFolderAsync(`dist-desktop/mac-intel/${macIntelFolder}`, 'Mtrini_Mac_Intel.zip');
      console.log(`[✔] macOS Intel ZIP created successfully in ${((Date.now() - start)/1000).toFixed(2)}s.`);
    } else {
      console.log('[-] macOS Intel compilation folder not found inside dist-desktop/mac-intel');
    }
  }

  console.log('[✔] All desktop distribution bundles have been packed beautifully!');
  
  // Log sizes
  ['Mtrini_Desktop_1.1.zip', 'Mtrini_Mac_Silicon.zip', 'Mtrini_Mac_Intel.zip'].forEach((file) => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`[★] File: ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  });
}

main().catch(err => {
  console.error('[!] Packaging failed:', err);
  process.exit(1);
});
