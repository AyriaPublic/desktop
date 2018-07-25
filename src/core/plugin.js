'use strict';

const concatStream = require('concat-stream');
const { getGlobal } = require('electron').remote;
const fs = require('fs');
const slugify = require('github-slugid');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const path = require('path');
const R = require('ramda');
const yauzl = require('yauzl');
const yazl = require('yazl');

const { pluginStore } = require('./db');

// addDefaultPluginData :: Object -> Object
const addDefaultPluginData = R.assoc('active', true);

// getPluginPath :: String -> String
const getPluginPath = name =>
    path.join(getGlobal('appPaths').data, name + '.ayria');

// upsertPluginData :: Object -> ()
const upsertPluginData = function (metadata) {
    pluginStore.upsert(slugify(metadata.name), () => metadata);
};

// savePlugin :: String -> ()
const savePlugin = R.pipe(yaml.safeLoad, addDefaultPluginData, upsertPluginData);

// Extract plugin from zip archive and store in DB and FS
// installPlugin :: String -> Promise -> ()
const installPlugin = function (pluginPath) {
    const pluginPackage = new yazl.ZipFile();

    pluginPackage.outputStream.pipe(
        fs.createWriteStream(getPluginPath(path.parse(pluginPath).name))
    );

    return new Promise(function (resolve, reject) {
        yauzl.open(pluginPath, { lazyEntries: true }, function (error, zipfile) {
            if (error) return reject(error);

            zipfile.readEntry();

            zipfile.on('entry', function (entry) {
                let file = path.parse(entry.fileName);
                if (file.ext.match(/\.ayria(32|64)/)) {
                    zipfile.openReadStream(entry, function (error, readStream) {
                        if (error) return reject(error);
                        readStream.on('end', function () {
                            zipfile.readEntry();
                        });
                        pluginPackage.addReadStream(
                            readStream,
                            entry.fileName,
                            { compress: false }
                        );
                    });
                }
                if (file.base === 'ayria-plugin.yaml') {
                    zipfile.openReadStream(entry, function (error, readStream) {
                        if (error) return reject(error);
                        readStream.on('end', function () {
                            zipfile.readEntry();
                        });
                        pluginPackage.addReadStream(
                            readStream,
                            entry.fileName,
                            { compress: false }
                        );
                        readStream.pipe(concatStream(savePlugin));
                    });
                }
            });

            zipfile.on('end', resolve);
        });
    });
};

// Get the plugin files from the plugin store
// getGamePlugins :: Object -> Promise -> Object
const getGamePlugins = function ({ appid: gameId }) {
    return pluginStore
        .query('plugin-index/byGameId', {
            key: `steam:${gameId}`,
            include_docs: true,
        })
        .then(R.prop('rows'))
        .then(R.map(R.prop('doc')));
};

// Ensure the plugin is symlinked to the given game directory
// ensurePluginSymlink :: String, Object -> ()
const ensurePluginSymlink = function (gameDirectory, pluginData) {
    const pluginPath = getPluginPath(pluginData.name);
    const gamePluginsPath = path.join(gameDirectory, 'plugins');
    const gamePluginPath = path.join(
        gamePluginsPath,
        pluginData.name + '.ayria'
    );
    const linkMethod = {
        linux: 'symlink',
        win32: 'link',
    };

    mkdirp.sync(gamePluginsPath);

    return new Promise(function (resolve, reject) {
        fs[linkMethod[process.platform]](pluginPath, gamePluginPath, function (
            error
        ) {
            if (error && !error.message.includes('file already exists')) {
                reject(error);
            }
            resolve(gamePluginPath);
        });
    });
};


module.exports = {
    installPlugin,
    getGamePlugins,
    ensurePluginSymlink,
};
