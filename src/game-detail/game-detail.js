'use strict';

const pify = require('pify');
const fs = pify(require('fs'));
const path = require('path');

const envPaths = require('env-paths');
const mkdirp = pify(require('mkdirp'));
const R = require('ramda');

const dataPath = envPaths('ayria', {suffix: ''}).data;

// Get the plugin files from the passed directory
// getAppPlugins :: String -> Promise -> Array
const getAppPlugins = function (pluginsPath, active) {
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
                .then(() => Promise.resolve(getAppPlugins(pluginsPath)))
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
// getGameDirectory :: String -> String
const getGameDirectory = function (dataPath) {
    return path.join(dataPath, window.location.hash.slice(1));
};

// Get plugins from the game directory and in the nested 'disabled' directory
Promise.all([
    getAppPlugins(path.join(getGameDirectory(dataPath)), true),
    getAppPlugins(path.join(getGameDirectory(dataPath), 'disabled'), false)
])
    .then(R.flatten)
    .then(R.map(renderPlugin));
