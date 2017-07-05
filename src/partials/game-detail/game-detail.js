'use strict';
const pify = require('pify');

const fs = pify(require('fs'));
const mkdirp = pify(require('mkdirp'));
const path = require('path');
const R = require('ramda');
const { getGlobal } = require('electron').remote;

// Get the plugin files from the passed directory
// getGamePlugins :: String -> Promise -> Array
const getGamePlugins = function (pluginsPath, active) {
    return fs.readdir(pluginsPath)
        .then(R.map(path.parse))
        // Get .ayria32 and .ayria64 files
        .then(R.filter(file => file.ext === '.ayria'))
        .then(R.map(file => ({
            'name': file.name,
            'active': active
        })))
        .catch(function (error) {
            if (error.code === 'ENOENT') {
                return mkdirp(pluginsPath)
                    .then(getGamePlugins)
                    .catch(function (error) {
                        Promise.reject(error);
                    });
            } else {
                Promise.reject(error);
            }
        });
};

// Add plugin information to the DOM plugin list
// renderPlugin :: Object -> ()
const renderPlugin = function (pluginData) {
    const pluginList = document.querySelector('[data-plugin-list]');
    const pluginItem = document.createElement('li');

    // Fill in DOM nodes with data
    pluginItem.setAttribute('data-plugin-active', pluginData.active);
    pluginItem.textContent = pluginData.name;

    // Construct and insert DOM structure
    pluginList.appendChild(pluginItem);
};

// Combine path to ayria data and slugified game name
// getGameDirectory :: String -> String
const getGameDirectory = function (gameSlug) {
    return path.join(getGlobal('appPaths').data, gameSlug);
};

// Render passed game slug and data
// renderGameDetail :: Object -> ()
const renderGameDetail = function (gameData) {
    const gameBackground = document.querySelector('[data-game-detail-background]');
    const gameDirectory = getGameDirectory(gameData.appSlug);
    const gameName = document.querySelector('[data-game-detail-name]');
    const pluginList = document.querySelector('[data-plugin-list]');

    gameName.textContent = gameData.name;
    gameBackground.src = gameData.background;

    pluginList.innerHTML = '';

    // Get plugins from the game directory and in the nested 'disabled' directory
    Promise.all([
        getGamePlugins(gameDirectory, true),
        getGamePlugins(path.join(gameDirectory, 'disabled'), false),
    ])
        .then(R.flatten)
        .then(R.map(renderPlugin));
};

module.exports = {
    render: renderGameDetail,
};
