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

// renderPlugin :: Object -> Object
const renderPlugin = (pluginData) => node(
    'li',
    { 'data-plugin-active': pluginData.active },
    `${pluginData.name} - ${pluginData.version}`
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


const renderGameDetailContent = (plugins) => node(
    'main',
    { 'className': 'game-detail-content' },
    [
        // launch button here
        node('h2', null, 'Installed plugins'),
        node(
            'ul',
            { 'className': 'plugin-list' },
            plugins
        )
    ]
)

// Render passed game slug and data
// renderGameDetail :: Object -> ()
const renderGameDetail = function (gameData) {
    return steamFs.getSteamappLibraryDir(gameData.appid).then(libraryDir => {
        const gameDirectory = path.join(
            libraryDir,
            'common',
            gameData.installDirectory
        );

        console.log('gameData', gameData);

        return getGamePlugins(gameData)
            .then(R.tap(console.log))
            .then(R.map(renderPlugin))
            .then(
                R.forEach(pluginData =>
                    ensurePluginSymlink(gameDirectory, pluginData)
                )
            )
            .then((plugins) => {
                return node(
                    'section',
                    null,
                    [
                        renderGameDetailHeader(gameData),
                        renderGameDetailContent(plugins),
                        renderLauncher(
                            gameDirectory,
                            steamFs.getSteamappVdfLaunch({ launchConfig: gameData.launch })
                        )
                    ]
                )
            })
    });
};

module.exports = {
    render: renderGameDetail,
};
