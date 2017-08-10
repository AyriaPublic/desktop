'use strict';

const { getGlobal } = require('electron').remote;
const path = require('path');
const PouchDB = require('pouchdb');

PouchDB.plugin(require('pouchdb-upsert'));

const pluginStore = new PouchDB(
    path.join(getGlobal('appPaths').data, 'plugins-store')
);

// db.find({
//   selector: {games: {$in: [steamapp_id]}}
// });

const pluginView = {
    _id: '_design/plugin-index',
    views: {
        byGameId: {
            map: 'function (doc) { emit(doc.game.id); }',
        }
    }
};

pluginStore.putIfNotExists(pluginView);

module.exports = {
    pluginStore
};
