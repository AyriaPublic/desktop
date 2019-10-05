'use strict';

const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

global.appPaths = require('./core/app-paths').setup();

// Global reference of the window object to prevent it being garbage collected
let mainWindow;

const isDevelopment =
    process.env.NODE_ENV === 'development' &&
    process.defaultApp;

if (isDevelopment) {
    require('electron-reload')(__dirname);
}

// Open index.html in a new browser window
const createWindow = function () {
    mainWindow = new BrowserWindow({
        show: false,
        minWidth: 896,
        minHeight: 504,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        },
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
        mainWindow = null;
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', app.quit);
