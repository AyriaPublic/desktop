'use strict';
const pify = require('pify');

const { getGlobal } = require('electron').remote;
const flatCache = require('flat-cache');
const fs = pify(require('fs'), { exclude: ['createWriteStream'] });
const slugify = require('github-slugid');
const got = require('got');
const { h: node } = require('hyperapp');
const path = require('path');
const R = require('ramda');

const steamFs = require('../../core/steam-fs');
const appHeader = require('../app-header/app-header.js');

const steamappsCache = flatCache.create('steamapps', getGlobal('appPaths').cache);

// Fetch background URL using appId from the Steam API
// fetchSteamappBackground :: String -> Promise -> Object
const fetchSteamappBackground = function (appId) {
    const steamApiUrl = 'http://store.steampowered.com/api';

    return new Promise(function (resolve, reject) {
        got(`${steamApiUrl}/appdetails?appids=${appId}&filters=background`, {
            json: true,
            useElectronNet: false,
        })
            .then(response => {
                if (response.body[appId].success) {
                    resolve(response.body[appId].data);
                }
                reject('Steam API failed at responding.');
            })
            .catch(reject);
    });
};

// Get all needed steamapp info
// getSteamappInfo :: Number -> Promise -> Object
const getSteamappInfo = id => (
    Promise.all([
        steamFs.getAppInfo(id),
        fetchSteamappBackground(id),
    ])
    .then(R.mergeAll)
);

// Takes steamappData, downloads the background and save the data to the cache
// cacheSteamappData :: Object -> Promise -> Object
const cacheSteamappData = function (appData) {
    const backgroundPath = path.join(
        getGlobal('appPaths').cache,
        'backgrounds'
    );
    const appBackgroundPath = path.format({
        dir: backgroundPath,
        name: appData.appid,
        ext: '.jpg',
    });

    steamappsCache.setKey(appData.appid, appData);

    return new Promise(function (resolve, reject) {
        got
            .stream(appData.background, { useElectronNet: false })
            .pipe(fs.createWriteStream(appBackgroundPath, {}))
            .on('finish', function () {
                appData.background = appBackgroundPath;
                resolve(appData);
            })
            .on('error', function (error) {
                // If directory doesn't exist create it and call again
                if (error.code === 'ENOENT') {
                    return fs
                        .mkdir(backgroundPath)
                        .then(() => resolve(cacheSteamappData(appData)))
                        .catch(function (error) {
                            // If directory already exists call again
                            if (error.code === 'EEXIST') {
                                resolve(cacheSteamappData(appData));
                            } else {
                                reject(error);
                            }
                        });
                } else {
                    reject(error);
                }
            });
    });
};

// filterSteamappInfo :: Object -> Object
const filterSteamappInfo = ({ appid, common, background, config }) => ({
    appid,
    background,
    name: common.name,
    installDirectory: config.installdir,
    launch: config.launch,
});

// Render passed object appData
// renderSteamapp :: Object -> ()
const renderSteamapp = function (appData, actions) {
    return node(
        'li',
        {},
        node(
            'a',
            { onclick },
            node(
                'figure',
                {},
                [
                    node('img', { src: appData.background }),
                    node('figcaption', {}, appData.name),
                ]
            )
        )
    )

    function onclick (event) {
        event.preventDefault();
        actions.navigate({'viewName': 'wat'})
        // actions.navigate(Object.assign(
        //     {},
        //     { 'viewName': 'game-detail' },
        //     appData,
        //     { 'appSlug': slugify(String(appData.name)) },
        //     {
        //         'headerNavigation': {
        //             previous: true,
        //             addPlugin: true,
        //         },
        //     }
        // ))

        // document.dispatchEvent(
        //     new CustomEvent('navigate', {
        //         detail: {
        //             state: Object.assign(
        //                 {},
        //                 appData,
        //                 { appSlug: slugify(String(appData.name)) },
        //                 {
        //                     headerNavigation: {
        //                         previous: true,
        //                         addPlugin: true,
        //                     },
        //                 }
        //             ),
        //             viewName: 'game-detail',
        //         },
        //     })
        // );
    };
};

module.exports = {
    state: {
        games: [],
    },
    actions: {
        getGames: () => (state, actions) => {

            return steamFs
                .getSteamappsDirectories()
                .then(paths => Promise.all(paths.map(steamFs.getSteamappIds)))
                .then(R.unnest)
                .then(
                    R.map(
                        R.either(
                            R.bind(steamappsCache.getKey, steamappsCache),
                            R.pipeP(
                                getSteamappInfo,
                                filterSteamappInfo,
                                cacheSteamappData
                            )
                        )
                    )
                )
                .then(
                    R.tap(
                        R.map(gameData =>
                            Promise.resolve(gameData).then(actions.addGame)
                        )
                    )
                )
                .then(Promise.all.bind(Promise))
                .then(R.tap(() => steamappsCache.save(false)));
        },
        addGame: gameData => (state, actions) => {
            debugger;
            return ({
                    games: state.games.concat([renderSteamapp(gameData, actions)]),
            })
        },
        // navigate: (newState) => state => {
        //     debugger;
        //     return newState
        // },
    },
    view: (state, actions) => { return node(
        'section',
        { key: 'list-unsdilfj' },
        [
            appHeader.render(),
            node(
                'ul',
                {
                    'class': 'list-steamapps',
                    'oncreate': actions.listSteamapps.getGames,
                },
                state.listSteamapps.games
            )
        ]
    )}
};
