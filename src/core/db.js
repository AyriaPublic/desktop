const { getGlobal } = require('electron').remote;
const path = require('path');
const PouchDB = require('pouchdb');

PouchDB.plugin(require('pouchdb-upsert'));

const pluginStore = new PouchDB(
    path.join(getGlobal('appPaths').data, 'plugins-store')
);

const pluginView = {
  _id: '_design/plugin-index',
  views: {
    byGameId: {
      map: String(function (doc) { emit(doc.game.id); }),
    }
  }
};

pluginStore.putIfNotExists(pluginView)

module.exports = {
    pluginStore
}
