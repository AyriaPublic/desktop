'use strict';

const concatStream = require('concat-stream');
const yauzl = require('yauzl');
const yazl = require('yazl');
const fs = require('fs');
const path = require('path');
const slugify = require('github-slugid');
const { getGlobal } = require('electron').remote;
const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-upsert'));

const pluginStore = new PouchDB(
    path.join(getGlobal('appPaths').data, 'plugins-store')
);

const extractPlugin = function (pluginPath, slug) {
    const pluginPackage = new yazl.ZipFile();

    pluginPackage.outputStream.pipe(fs.createWriteStream(path.join(
        getGlobal('appPaths').data, slug, path.parse(pluginPath).name
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
                        readStream.pipe(concatStream(content => {
                            storePluginMetadata(JSON.parse(content));
                        }));
                    });
                }
            });

            zipfile.on('end', resolve);
        });
    });
};

const storePluginMetadata = function (metadata) {
    pluginStore.upsert(
        slugify(metadata.name),
        () => metadata
    );
};

module.exports = {
    render: () => {},
    extractPlugin,
};
