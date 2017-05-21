'use strict';

const concatStream = require('concat-stream');
const yauzl = require('yauzl');
const fs = require('fs');
const path = require('path');
const R = require('ramda');
const slugify = require('github-slugid');
const { getGlobal } = require('electron').remote;
const PouchDB = require('pouchdb');

const pluginStore = new PouchDB(
    path.join(getGlobal('appPaths').data, 'plugins-store')
);
PouchDB.replicate(
    path.join(getGlobal('appPaths').data, 'plugins-store'),
    'http://localhost:5984/plugins-store',
    { live: true }
);

const extractPlugin = function (pluginPath, slug) {
    return new Promise(function (resolve, reject) {
        yauzl.open(pluginPath, {lazyEntries: true}, function(error, zipfile) {
            if (error) return reject(error);

            zipfile.readEntry();

            zipfile.on('entry', function(entry) {
                let file = path.parse(entry.fileName);
                if (file.ext.match(/\.ayria(32|64)/)) {
                    zipfile.openReadStream(entry, function(error, readStream) {
                        if (error) return reject(error);
                        readStream.on('end', function() {
                            zipfile.readEntry();
                        });
                        readStream.pipe(fs.createWriteStream(path.join(
                            getGlobal('appPaths').data, slug, entry.fileName
                        )));
                    });
                }
                if (file.base === 'ayria-plugin.json') {
                    zipfile.openReadStream(entry, function(error, readStream) {
                        if (error) return reject(error);
                        readStream.on('end', function() {
                            zipfile.readEntry();
                        });
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
    pluginStore.get(slugify(metadata.name))
        .then(doc => pluginStore.remove(doc))
        .then(() => {
            return pluginStore.put(
                R.assoc('_id', slugify(metadata.name), metadata)
            )
        })
        .then(() => {
            pluginStore.get(slugify(metadata.name)).then(console.log);
        })
}

module.exports = {
    render: () => {},
    extractPlugin,
};
