'use strict';
const pify = require('pify');

const flatCache = require('flat-cache');
const fs = pify(require('fs'), {exclude: ['createWriteStream']});
const got = require('got');
const mkdirp = pify(require('mkdirp'));
const path = require('path');
const R = require('ramda');
const slugify = require('github-slugid');
const { getGlobal } = require('electron').remote;

const steamFsUtils = require('../../core/steam-fs');

const steamappsCache = flatCache.load('steamapps', getGlobal('appPaths').cache);

// Requests appInfo from the passed appId at the Steam API
// getSteamappInfo :: String -> Promise -> Object
const getSteamappInfo = function (appId) {
    const steamApiUrl = 'http://store.steampowered.com/api/appdetails?appids=';

    return new Promise(function (resolve, reject) {
        got(
            `${steamApiUrl}${appId}&filters=basic,background`,
            {json: true, useElectronNet: false}
        )
            .then((response) => {
                if (response.body[appId].success) {
                    resolve(response.body[appId].data);
                }
                reject('Steam API failed at responding.');
            })
            .catch(reject)
    });
};

// Render passed object appData
// renderSteamapp :: Object -> ()
const renderSteamapp = function (appData) {
    const gamesListElement = document.querySelector('[data-list-steamapps] > ul');

    const appItem = document.createElement('li');
    const appLink = document.createElement('a');
    const appContainer = document.createElement('figure');
    const appName = document.createElement('figcaption');
    const appBackground = document.createElement('img');

    // Slugify steamapp name
    const appSlug = slugify(String(appData.name));

    // Fill in DOM nodes with data
    appName.textContent = appData.name;
    appBackground.src = appData.background;
    appBackground.alt = '';

    appLink.addEventListener('click', function (event) {
        event.preventDefault();

        document.dispatchEvent(
            new CustomEvent('navigate', {
                detail: {
                    state: Object.assign(
                        {},
                        appData,
                        {appSlug},
                        {
                            headerNavigation: {
                                previous: true,
                                addPlugin: true,
                            }
                        }
                    ),
                    viewName: 'game-detail',
                }
            })
        );
    });

    // Construct and insert DOM structure
    appItem.appendChild(appLink);
    appLink.appendChild(appContainer);
    appContainer.appendChild(appName);
    appContainer.appendChild(appBackground);
    gamesListElement.appendChild(appItem);
};

// Takes steamappData, downloads the background and save the data to the cache
// cacheSteamappData :: Object -> Promise -> Object
const cacheSteamappData = function (appData) {
    const backgroundPath = path.join(getGlobal('appPaths').cache, 'backgrounds');
    const appBackgroundPath = path.format({
        dir: backgroundPath,
        name: appData.steam_appid,
        ext: '.jpg'
    });

    steamappsCache.setKey(appData.steam_appid, appData);

    return new Promise(function (resolve, reject) {
        got.stream(appData.background, { useElectronNet: false })
            .pipe(fs.createWriteStream(appBackgroundPath, {}))
            .on('finish', function () {
                appData.background = appBackgroundPath;
                resolve(appData);
            })
            .on('error', function (error) {
                // If directory doesn't exist create it and call again
                if (error.code === 'ENOENT') {
                    return mkdirp(backgroundPath)
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

const filterSteamappInfo = R.pick([
    'name',
    'steam_appid',
    'background',
]);

steamFsUtils.getSteamappsDirectories()
    .then(paths => Promise.all(paths.map(steamFsUtils.getSteamappIds)))
    .then(R.unnest)
    .then(R.map(R.either(
        R.bind(steamappsCache.getKey, steamappsCache),
        R.pipeP(getSteamappInfo, filterSteamappInfo, cacheSteamappData)
    )))
    .then(R.forEach(function (appData) {
        Promise.resolve(appData).then(function (appData) {
            renderSteamapp(appData);
        });
    }))
    .then(steamapps => Promise.all(steamapps).then(() => {
        steamappsCache.save();
    }));

module.exports = {
    render: () => {},
};
