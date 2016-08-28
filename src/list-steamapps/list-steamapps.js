'use strict';

const pify = require('pify');
const fs = pify(require('fs'));
const path = require('path');

const hyperquest = require('hyperquest');
const JSONStream = require('JSONStream');
const winreg = require('winreg');

// Return location of installed Steam games
const getSteamAppsPath = function () {
    const steamRegistryKey = winreg({
        hive: winreg.HKCU,
        key: '\\SOFTWARE\\Valve\\Steam'
    });

    return new Promise(function (resolve, reject) {
        steamRegistryKey.get('SteamPath', function (error, result) {
            if (error) {
                reject(error);
            }

            resolve(path.join(result.value, 'steamapps'));
        });
    });
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

getSteamAppsPath()
    .then(getSteamAppIds)
    .then(getSteamAppInfo);
