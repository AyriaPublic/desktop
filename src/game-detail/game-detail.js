'use strict';

const pify = require('pify');
const fs = pify(require('fs'));
const path = require('path');

const envPaths = require('env-paths');
const mkdirp = pify(require('mkdirp'));
const R = require('ramda');

const dataPath = envPaths('ayria', {suffix: ''}).data;
const router = require('../router.js');

// Get the plugin files from the passed directory
// getgamePlugins :: String -> Promise -> Array
const getgamePlugins = function (pluginsPath, active) {
    return fs.readdir(pluginsPath)
        .then(R.map(path.parse))
        // Get .ayria32 and .ayria64 files
        .then(R.filter(file => file.ext.match(/\.ayria(32|64)/)))
        .then(R.map(file => ({
            'name': file.name,
            'active': active
        })))
        .catch(function (error) {
            if (error.code === 'ENOENT') {
                return mkdirp(pluginsPath)
                .then(() => Promise.resolve(getgamePlugins(pluginsPath)))
                .catch(function (error) {
                    Promise.reject(error);
                });
            } else {
                Promise.reject(error);
            }
        });
};

// Add plugin information to the DOM plugin list
// renderPlugin :: String -> ()
const renderPlugin = function (pluginData) {
    const pluginList = document.querySelector('[data-plugin-list]');
    const pluginItem = document.createElement('li');

    // Fill in DOM nodes with data
    pluginItem.setAttribute('data-plugin-active', pluginData.active);
    pluginItem.textContent = pluginData.name;

    // Construct and insert DOM structure
    pluginList.appendChild(pluginItem);
};

// Combine path to ayria data and slugified game name from the page URI
// getGameDirectory :: String, String -> String
const getGameDirectory = function (dataPath, gameSlug) {
    return path.join(dataPath, gameSlug);
};

// Render passed game slug and data
// renderGameDetail :: String, Object -> ()
const renderGameDetail = function (gameSlug, gameData) {
    const pluginList = document.querySelector('[data-plugin-list]');
    const gameName = document.querySelector('[data-game-detail-name]');
    const gameBackground = document.querySelector('[data-game-detail-background]');
    const backButton = document.querySelector('[data-game-detail-header-back]');

    gameName.textContent = gameData.name;
    gameBackground.src = gameData.background;

    // Activate navigation
    backButton.addEventListener('click', function (event) {
        event.preventDefault();
        router.onlyShowPartial('list-games');
    });

    // Empty list of plugins first
    pluginList.innerHTML = '';

    // Get plugins from the game directory and in the nested 'disabled' directory
    Promise.all([
        getgamePlugins(path.join(getGameDirectory(dataPath, gameSlug)), true),
        getgamePlugins(path.join(getGameDirectory(dataPath, gameSlug), 'disabled'), false)
    ])
        .then(R.flatten)
        .then(R.map(renderPlugin));
};

module.exports = renderGameDetail;
