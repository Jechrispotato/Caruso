const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.removeMenu();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('save-dialog', async (event, buffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Collage',
    defaultPath: 'collage.png',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ]
  });

  if (!canceled && filePath) {
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return true;
  }
  return false;
});
