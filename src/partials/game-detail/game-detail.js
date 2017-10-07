'use strict';
const R = require('ramda');

const { pluginStore } = require('../../core/db');

// Get the plugin files from the plugin store
// getGamePlugins :: Object -> Object
const getGamePlugins = function ({appid: gameId}) {
    return pluginStore.query(
        'plugin-index/byGameId',
        {
            key: `steam:${gameId}`,
            include_docs: true,
        }
    )
        .then(R.prop('rows'))
        .then(R.map(R.prop('doc')))
};

// Add plugin information to the DOM plugin list
// renderPlugin :: Object -> ()
const renderPlugin = function (pluginData) {
    const pluginList = document.querySelector('[data-plugin-list]');
    const pluginItem = document.createElement('li');

    // Fill in DOM nodes with data
    pluginItem.setAttribute('data-plugin-active', pluginData.active);
    pluginItem.textContent = `${pluginData.name} - ${pluginData.version}`;

    // Construct and insert DOM structure
    pluginList.appendChild(pluginItem);
};

// Render passed game slug and data
// renderGameDetail :: Object -> ()
const renderGameDetail = function (gameData) {
    const gameBackground = document.querySelector('[data-game-detail-background]');
    const gameName = document.querySelector('[data-game-detail-name]');
    const pluginList = document.querySelector('[data-plugin-list]');

    gameName.textContent = gameData.name;
    gameBackground.src = gameData.background;

    pluginList.innerHTML = '';

    getGamePlugins(gameData)
        .then(R.map(renderPlugin));
};

module.exports = {
    render: renderGameDetail,
};
