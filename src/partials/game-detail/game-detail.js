'use strict';
const R = require('ramda');

const { pluginStore } = require('../../core/db');
const { execFile } = require('child_process');
const steamFs = require('../../core/steam-fs.js');
const path = require('path');

// Get the plugin files from the plugin store
// getGamePlugins :: Object -> Object
const getGamePlugins = function ({ appid: gameId }) {
    return pluginStore
        .query('plugin-index/byGameId', {
            key: `steam:${gameId}`,
            include_docs: true,
        })
        .then(R.prop('rows'))
        .then(R.map(R.prop('doc')));
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

// Render button to launch game
// renderLaunchOption :: String, Object -> ()
const renderLaunchOption = function (execDir, launchOption) {
    const launchOptions = document.querySelector('[data-launch-options]');
    const launchOptionButton = document.createElement('button');
    launchOptions.innerHTML = '';

    // Fill in DOM nodes with data
    launchOptionButton.textContent = `Launch ${launchOption['executable']}`;
    launchOptionButton.addEventListener('click', () => {
        const execArgs = launchOption['arguments']
            ? launchOption['arguments'].split(' ')
            : [];

        const bootstrapDir = path.join(process.cwd(), 'src', 'bootstrap');
        const bootstrapPath = path.join(bootstrapDir, 'Bootstrap64.exe');
        const bootstrapArgs = [execDir, launchOption['executable'], ...execArgs];

        const bootstrapProcess = execFile(
            bootstrapPath,
            bootstrapArgs,
            { cwd: bootstrapDir },
            error => {
                if (error) throw error;
            }
        );

        bootstrapProcess.stdout.pipe(process.stdout);
        bootstrapProcess.stderr.pipe(process.stderr);
    });

    // Construct and insert DOM structure
    launchOptions.appendChild(launchOptionButton);
};

// Render passed game slug and data
// renderGameDetail :: Object -> ()
const renderGameDetail = function (gameData) {
    const gameBackground = document.querySelector(
        '[data-game-detail-background]'
    );
    const gameName = document.querySelector('[data-game-detail-name]');
    const pluginList = document.querySelector('[data-plugin-list]');

    gameName.textContent = gameData.name;
    gameBackground.src = gameData.background;

    pluginList.innerHTML = '';

    steamFs.getSteamappLibraryDir(gameData.appid).then(libraryDir => {
        renderLaunchOption(
            path.join(libraryDir, 'common', gameData.installDirectory),
            steamFs.getSteamappVdfLaunch({ launchConfig: gameData.launch })
        );
    });

    getGamePlugins(gameData).then(R.map(renderPlugin));
};

module.exports = {
    render: renderGameDetail,
};
