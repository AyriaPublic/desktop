'use strict';

const electron = require('electron');
const envPaths = require('env-paths')('ayria-desktop', {suffix: ''});

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected
let mainWindow;

const isDevelopment =
    process.env.NODE_ENV === 'development' &&
    process.defaultApp;

if (isDevelopment) {
    require('electron-reload')(__dirname);
}

global.appPaths = {
    'cache': envPaths.cache,
    'data': envPaths.data,
};

// Open index.html in a new browser window
const createWindow = function () {
    mainWindow = new BrowserWindow({
        show: false,
        minWidth: 500,
        minHeight: 500
    });
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Run live reload and open DevTools when in development environment
    if (isDevelopment) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', function () {
        mainWindow.show();
    });

    mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
        mainWindow = null;
    });
};

app.on('ready', createWindow);

// Quit when all windows are closed except on OS X
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (mainWindow === null) {
        createWindow();
    }
});
