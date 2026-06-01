const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Set environment as production
process.env.NODE_ENV = 'production';
process.env.MTRINI_ELECTRON = 'true';

// Start our bundled fully functional backend server
try {
  console.log('[Electron] Starting Mtrini integrated backend...');
  require('./dist/server.cjs');
} catch (e) {
  console.error('[Electron] Error starting integrated server:', e);
}

let mainWindow = null;

function createWindow() {
  // Let's wait for local Express server port to be assigned
  const checkPortInterval = setInterval(() => {
    const port = global.mtriniPort || process.env.MTRINI_PORT;
    if (port) {
      clearInterval(checkPortInterval);
      launchAppWindow(port);
    }
  }, 100);
}

function launchAppWindow(port) {
  const localUrl = `http://localhost:${port}`;
  console.log(`[Electron] Integrated backend is ready on port ${port}. Loading UI...`);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    title: 'Mtrini Desktop Studio',
    backgroundColor: '#0a0a0f', // Match slate-color dark theme
    show: false, // Show once ready to avoid white flash
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL(localUrl);

  // Eliminate standard menu bar for sleek, clean native app appearance
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Electron] Native app window display successful.');
  });

  // Keep external links opening in external default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
