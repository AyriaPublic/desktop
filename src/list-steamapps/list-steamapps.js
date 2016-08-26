'use strict';

const pify = require('pify');
const fs = pify(require('fs'));
const path = require('path');

const entries = require('object.entries');
const hyperquest = require('hyperquest');
const JSONStream = require('JSONStream');
const vdf = require('vdfjs');
const winreg = require('winreg');

// Return location of primary Steam library (installation directory)
const getSteamInstallPath = function () {
    const steamRegistryKey = winreg({
        hive: winreg.HKCU,
        key: '\\SOFTWARE\\Valve\\Steam'
    });

    return new Promise(function (resolve, reject) {
        steamRegistryKey.get('SteamPath', function (error, result) {
            if (error) {
                reject(error);
            }

            resolve(result.value);
        });
    });
};

// Parses the `libraryfolders.vdf` config as found in the primary Steam library's steamapps directory
const getSteamLibraryFoldersConfig = function () {
    return getSteamInstallPath().then(steamInstall => {
        const config = path.join(steamInstall, 'steamapps', 'libraryfolders.vdf');

        return fs.readFile(config, 'utf-8').then(vdf.parse);
    });
};

// Return location of all Steam libraries, including the installation directory
const getSteamLibraries = function () {
    return Promise.all([getSteamInstallPath(), getSteamLibraryFoldersConfig()])
        .then(([steamInstall, settings]) => {
            const folders = entries(settings['LibraryFolders'])
                .filter(([key, _]) => key.match(/^\d+$/)) // Filter any non-numeric entries
                .map(([_, path]) => path); // Discards key from entries

            return [steamInstall].concat(folders);
        });
};

// Return each Steam libraries' steamapps directory
const getSteamAppsPaths = function () {
    return getSteamLibraries().then(libraries => libraries.map(library => {
        return path.join(library, 'steamapps');
    }));
};

// Return array of app ID's
const getSteamAppIds = function (path) {
    return fs.readdir(path).then(function (fileNames) {
        // Filter out non appmanifest fileNames
        fileNames = fileNames.filter(function (fileName) {
            return ~fileName.indexOf('appmanifest');
        });

        // Get the digits and thus app ID's out of the filename
        return fileNames.map(function (fileName) {
            return fileName.match(/\d+/)[0];
        });
    });
};

// Return array of promises containing app information
const getSteamAppInfo = function (appIds) {
    const steamApiUrl = 'http://store.steampowered.com/api/appdetails?appids=';

    return Promise.all(appIds.map(function (appId) {
        return new Promise(function (resolve, reject) {
            hyperquest(`${steamApiUrl}${appId}&filters=basic,background`)
              .pipe(JSONStream.parse('*'))
              .on('data', function (response) {
                  if (response.success) {
                      renderSteamApp(response.data);
                      resolve(response.data);
                  }
                  reject('Steam API failed at responding.');
              })
              .on('error', function (error) {
                  reject(error);
              });
        });
    }));
};

// Render passed object appData
const renderSteamApp = function (appData) {
    const gamesListElement = document.querySelector('[data-list-games]');

    const appItem = document.createElement('li');
    const appContainer = document.createElement('figure');
    const appName = document.createElement('figcaption');
    const appBackground = document.createElement('img');

    // Fill in DOM nodes with data
    appName.textContent = appData.name;
    appBackground.src = appData.background;

    // Construct and insert DOM structure
    appItem.appendChild(appContainer);
    appContainer.appendChild(appName);
    appContainer.appendChild(appBackground);
    gamesListElement.appendChild(appItem);
};

getSteamAppsPaths()
    .then(paths => Promise.all(paths.map(getSteamAppIds)))
    .then(appIds => appIds.forEach(getSteamAppInfo));
