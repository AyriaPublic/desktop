'use strict';
const R = require('ramda');

const { getGamePlugins, ensurePluginSymlink } = require('../../core/plugin.js');
const { execFile } = require('child_process');
const node = require('inferno-create-element');
const steamFs = require('../../core/steam-fs.js');
const path = require('path');

// renderGameDetailHeader :: Object -> Object
const renderGameDetailHeader = (gameData) => node(
    'header',
    { 'className': 'game-detail-header' },
    [
        node(
            'h1',
            { 'className': 'game-detail-title' },
            gameData.name,
        ),
        node(
            'div',
            { 'className': 'game-detail-background-wrapper' },
            node(
                'img',
                {
                    'className': 'game-detail-background',
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
    { 'className': 'game-detail-plugins' },
    [
        node('h2', null, 'Installed plugins'),
        node(
            'ul',
            { 'className': 'plugin-list' },
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
    render: renderGameDetail,
};
