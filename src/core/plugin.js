'use strict';

const concatStream = require('concat-stream');
const yauzl = require('yauzl');
const yazl = require('yazl');
const fs = require('fs');
const path = require('path');
const r = require('ramda');
const slugify = require('github-slugid');
const { getGlobal } = require('electron').remote;
const { pluginStore } = require('./db');

// addDefaultPluginData :: Object -> Object
const addDefaultPluginData = r.assoc('active', true);

// upsertPluginData :: Object -> ()
const upsertPluginData = function (metadata) {
    pluginStore.upsert(
        slugify(metadata.name),
        () => metadata
    );
};

// savePlugin :: String -> ()
const savePlugin = r.pipe(
    JSON.parse,
    addDefaultPluginData,
    upsertPluginData
);

// Extract binaries and plugin information from zip archive and store in DB
// installPlugin :: String -> Promise -> ()
const installPlugin = function (pluginPath) {
    const pluginPackage = new yazl.ZipFile();

    pluginPackage.outputStream.pipe(fs.createWriteStream(path.join(
        getGlobal('appPaths').data, path.parse(pluginPath).name + '.ayria'
    )));

    return new Promise(function (resolve, reject) {
        yauzl.open(pluginPath, {lazyEntries: true}, function (error, zipfile) {
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
                if (file.base === 'ayria-plugin.json') {
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

module.exports = {
    installPlugin,
};
