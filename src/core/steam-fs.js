'use strict';
const pify = require('pify');

const binaryVdf = require('binary-vdf');
const envPaths = require('env-paths');
const winreg = require('winreg');
const vdf = require('vdfjs');
const fs = pify(require('fs'), {exclude: ['createReadStream']});
const path = require('path');
const entries = require('object.entries');

// Return location of primary Steam library (installation directory)
// getInstallPath :: () -> Promise -> String
const getInstallPath = function () {
    if (process.platform === 'linux') {
        return Promise.resolve(envPaths('Steam', {suffix: ''}).data);
    }

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
// getLibraryFoldersConfig :: () -> Promise -> {Object}
const getLibraryFoldersConfig = function () {
    return getInstallPath().then(steamInstall => {
        const configPath = path.join(steamInstall, 'steamapps', 'libraryfolders.vdf');

        return fs.readFile(configPath, 'utf-8').then(vdf.parse);
    });
};

// Return location of all Steam libraries, including the installation directory
// getSteamLibraries :: () -> Promise -> [String]
const getSteamLibraries = function () {
    return Promise.all([getInstallPath(), getLibraryFoldersConfig()])
        .then(([steamInstall, settings]) => {
            const folders = entries(settings['LibraryFolders'])
                // Filter any non-numeric entries by matching the key
                .filter(pair => pair[0].match(/^\d+$/))
                // Discards key from entries
                .map(pair => pair[1]);

            return [steamInstall].concat(folders);
        });
};

// Return each Steam libraries' steamapps directory
// getSteamappsDirectories :: () -> [String]
const getSteamappsDirectories = function () {
    return getSteamLibraries().then(libraries => libraries.map(library => {
        return path.join(library, 'steamapps');
    }));
};

// Return array of app ID's reading from files in the give given path
// getSteamappIds :: String -> Promise -> [String]
const getSteamappIds = function (path) {
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

// Get steamapp info from appinfo.vdf file
// getAppInfo :: Number -> Promise -> Object
const getSteamappInfo = function (appId) {
    return getInstallPath()
        .then((installPath) => {
            const vdfPath = path.join(installPath, 'appcache', 'appinfo.vdf');
            return binaryVdf.readAppInfo(fs.createReadStream(vdfPath))
                .then(appinfo => appinfo.find((app) => app.id === appId))
                .then(app => app.entries);
        });
};

module.exports = {
    getSteamLibraries,
    getSteamappsDirectories,
    getSteamappIds,
    getSteamappInfo,
};
