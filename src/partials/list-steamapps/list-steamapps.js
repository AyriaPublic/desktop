'use strict';
const pify = require('pify');

const flatCache = require('flat-cache');
const fs = pify(require('fs'), { exclude: ['createWriteStream'] });
const got = require('got');
const node = require('inferno-create-element');
const path = require('path');
const R = require('ramda');
const slugify = require('github-slugid');
const { getGlobal } = require('electron').remote;

const steamFs = require('../../core/steam-fs');

const steamappsCache = flatCache.load('steamapps', getGlobal('appPaths').cache);

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
const getSteamappInfo = id =>
    Promise.all([
        steamFs.getAppInfo(id),
        fetchSteamappBackground(id),
    ]).then(R.mergeAll);

// Render passed object appData
// renderSteamapp :: Object -> ()
const renderSteamapp = function (appData) {
    return node(
        'li',
        {},
        node(
            'a',
            { onClick: handleClick},
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

    function handleClick (event) {
        event.preventDefault();

        document.dispatchEvent(
            new CustomEvent('navigate', {
                detail: {
                    state: Object.assign(
                        {},
                        appData,
                        { appSlug: slugify(String(appData.name)) },
                        {
                            headerNavigation: {
                                previous: true,
                                addPlugin: true,
                            },
                        }
                    ),
                    viewName: 'game-detail',
                },
            })
        );
    };
};

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

const filterSteamappInfo = ({ appid, common, background, config }) => ({
    appid,
    background,
    name: common.name,
    installDirectory: config.installdir,
    launch: config.launch,
});

const renderSteamapps = function () {
    return steamFs
        .getSteamappsDirectories()
        .then(paths => Promise.all(paths.map(steamFs.getSteamappIds)))
        .then(R.unnest)
        .then(
            R.map(
                R.either(
                    R.bind(steamappsCache.getKey, steamappsCache),
                    R.pipeP(getSteamappInfo, filterSteamappInfo, cacheSteamappData)
                )
            )
        )
        // .then(steamapps =>
        //     Promise.all(steamapps).then(() => {
        //         steamappsCache.save();
        //     })
        // )
        .then(appDatas => Promise.all(appDatas)
            .then(appDatas => (
                node(
                    'ul',
                    { className: 'list-steamapps' },
                    appDatas.map(appData => renderSteamapp(appData))
                )
            )
        ))
        // .then(R.forEach(function (appData) {
        //     return Promise.resolve(appData).then(function (appData) {
        //         return node(
        //             'ul',
        //             { className: 'list-steamapps' },
        //             'renderSteamapp(appData)'
        //         )
        //     });
        // }))
};


module.exports = {
    render: renderSteamapps,
};
