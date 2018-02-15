'use strict';

const { execFile } = require('child_process');
const { h: node } = require('hyperapp');
const path = require('path');
const R = require('ramda');

const appHeader = require('../../partials/app-header/app-header.js');
const gameDetailPlugins = require('../../partials/game-detail-plugins/game-detail-plugins.js');
const { getGamePlugins, ensurePluginSymlink } = require('../../core/plugin.js');
const steamFs = require('../../core/steam-fs.js');

// getGameDirectory :: Object -> Promise -> String
const getGameDirectory = function (gameData) {
    return steamFs.getSteamappLibraryDir(gameData.appid)
        .then(libraryDir => path.join(
            libraryDir,
            'common',
            gameData.installDirectory
        ))
}

// renderGameDetailBackground :: () -> Object
const renderGameDetailBackground = ({ background }) => node(
    'div',
    { 'class': 'game-detail-background-wrapper' },
    node(
        'img',
        {
            'class': 'game-detail-background',
            'src': background
        }
    ),
);

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
    ]
);

// Render button to launch game
// renderLauncher :: String, Object -> Object
const renderLauncher = (gameDirectory, launchConfig) => node(
    'button',
    {
        class: 'game-detail-launcher',
        onclick: function () {
            const execArgs = launchConfig['arguments']
            ? launchConfig['arguments'].split(' ')
            : [];

            const bootstrapDir = path.join(process.cwd(), 'src', 'bootstrap');
            const bootstrapPath = path.join(bootstrapDir, 'Bootstrap64.exe');
            const bootstrapArgs = [
                gameDirectory,
                launchConfig['executable'],
                ...execArgs,
            ];

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

module.exports = {
    state: {
        gameDetail: {
            plugins: [],
            gameDirectory: '',
            launchConfig: {},
        },
    },
    actions: {
        gameDetail: {
            getGamePlugins: (gameDirectory) => (state, actions) => (
                getGamePlugins(state.appData)
                    .then(
                        R.forEach((pluginData) => (
                            ensurePluginSymlink(gameDirectory, pluginData)
                        ))
                    )
                    .then(actions.setPlugins)
            ),
            setPlugins: (plugins) => ({ plugins }),
            setGameLaunchConfig: ({ gameDirectory, launchConfig }) => ({
                gameDirectory,
                launchConfig,
            }),
        },
    },
    view: (state, actions) => node(
        'section',
        {
            key: 'game-detail',
            'oncreate': () => {
                getGameDirectory(state.gameDetail.appData)
                    .then(gameDirectory => {
                        actions.gameDetail.getGamePlugins(gameDirectory);
                        actions.gameDetail.setGameLaunchConfig({
                            gameDirectory,
                            'launchConfig': steamFs.getSteamappVdfLaunch({
                                launchConfig: state.gameDetail.appData.launch
                            })
                        });
                    })
            }
        },
        [
            appHeader(['previous', 'addPlugin']),
            renderGameDetailBackground(state.gameDetail.appData),
            renderGameDetailHeader(state.gameDetail.appData),
            node(
                'div',
                { 'class': 'game-detail-content' },
                [
                    renderLauncher(
                        state.gameDetail.gameDirectory,
                        state.gameDetail.launchConfig,
                    ),
                    gameDetailPlugins.view(state.gameDetail.plugins),
                ]
            )
        ]
    )
};
