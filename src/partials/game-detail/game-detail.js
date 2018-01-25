'use strict';

const { execFile } = require('child_process');
const { h: node } = require('hyperapp');
const path = require('path');
const R = require('ramda');

const appHeader = require('../app-header/app-header.js');
const { getGamePlugins, ensurePluginSymlink } = require('../../core/plugin.js');
const steamFs = require('../../core/steam-fs.js');

// renderGameDetailHeader :: Object -> Object
const renderGameDetailHeader = (gameData) => node(
    'header',
    { 'class': 'game-detail-header' },
    [
        node(
            'h1',
            { 'class': 'game-detail-title' },
            gameData.name,
        ),
        node(
            'div',
            { 'class': 'game-detail-background-wrapper' },
            node(
                'img',
                {
                    'class': 'game-detail-background',
                    'src': gameData.background
                }
            ),
        ),
    ]
);

// Render button to launch game
// renderLauncher :: String, Object -> Object
const renderLauncher = (execDir, launchConfig) => node(
    'button',
    {
        onClick: function () {
            const execArgs = launchConfig['arguments']
            ? launchConfig['arguments'].split(' ')
            : [];

            const bootstrapDir = path.join(process.cwd(), 'src', 'bootstrap');
            const bootstrapPath = path.join(bootstrapDir, 'Bootstrap64.exe');
            const bootstrapArgs = [execDir, launchConfig['executable'], ...execArgs];

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
        }
    },
    `Launch ${launchConfig['executable']}`
);

// renderPlugin :: Object -> Object
const renderPlugin = (pluginData) => node(
    'li',
    { 'data-plugin-active': pluginData.active },
    `${pluginData.name} - ${pluginData.version}`
);

// renderGameDetailPlugins :: [Object] -> Object
const renderGameDetailPlugins = (plugins) => node(
    'section',
    { 'class': 'game-detail-plugins' },
    [
        node('h2', {}, 'Installed plugins'),
        node(
            'ul',
            { 'class': 'plugin-list' },
            plugins.map(renderPlugin)
        )
    ]
);

// Render passed game slug and data
// renderGameDetail :: Object -> ()
const renderGameDetail = function (gameData) {
    return steamFs.getSteamappLibraryDir(gameData.appid)
        .then(libraryDir => path.join(
            libraryDir,
            'common',
            gameData.installDirectory
        ))
        .then(gameDirectory => getGamePlugins(gameData)
            .then(R.forEach(pluginData =>
                ensurePluginSymlink(gameDirectory, pluginData)
            ))
            .then((plugins) => node(
                'section',
                null,
                [
                    appHeader.render(['previous', 'addPlugin']),
                    renderGameDetailHeader(gameData),
                    renderGameDetailPlugins(plugins),
                    renderLauncher(
                        gameDirectory,
                        steamFs.getSteamappVdfLaunch({
                            launchConfig: gameData.launch
                        })
                    )
                ]
            ))
        )
};

module.exports = {
    state: { 'gameDetail': {
        plugins: [],
    } },
    actions: { 'gameDetail': {
        getGamePlugins: () => (state, actions) => (
            getGamePlugins(state.appData)
                .then(actions.setPlugins)
        ),
        setPlugins: plugins => ({ plugins }),
    } },
    view: (state, actions) => node(
        'section',
        { key: 'game-detail', 'oncreate': actions.gameDetail.getGamePlugins },
        [
            appHeader.render(['previous', 'addPlugin']),
            renderGameDetailHeader(state.gameDetail.appData),
            renderGameDetailPlugins(state.gameDetail.plugins),
        ]
    )
};
