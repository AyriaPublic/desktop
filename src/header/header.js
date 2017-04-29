'use strict';
const dialog = require('electron').remote.dialog;
const yauzl = require('yauzl');
const fs = require('fs');
const path = require('path');
const getGameDirectory = require('../game-detail/game-detail').getGameDirectory;

const navigation = {
    previous: document.querySelector('[data-header-previous]'),
    addPlugin: document.querySelector('[data-header-add-plugin]'),
};

navigation.previous.addEventListener('click', function (event) {
    event.preventDefault();
    document.dispatchEvent(
        new CustomEvent('navigate', {
            detail: {
                state: {
                    headerNavigation: {
                        previous: false,
                        addPlugin: false,
                    }
                },
                viewName: 'list-steamapps',
            }
        })
    );
});

navigation.addPlugin.addEventListener('click', function (event) {
    event.preventDefault();

    yauzl.open('/home/selwyn/floating-sheep.zip', {lazyEntries: true}, function(error, zipfile) {
        if (error) throw error;

        zipfile.readEntry();
        zipfile.on("entry", function(entry) {
            let slug = navigation.addPlugin.getAttribute('game-slug');
            let file = path.parse(entry.fileName);
            if (file.ext.match(/\.ayria(32|64)/)) {
                zipfile.openReadStream(entry, function(error, readStream) {
                    if (error) throw error;
                    readStream.on('end', function() {
                        zipfile.readEntry();
                    });
                    readStream.pipe(fs.createWriteStream(path.join(getGameDirectory(slug), entry.fileName)));
                });
            }
        });
    });
    // dialog.showOpenDialog(
    //     {
    //         'title': 'Open Ayria plugin package',
    //         'filters': [
    //         {'name': 'Ayria plugin package', extensions: ['zip']}
    //         ]
    //     },
    //   function (filePath) {
    //       if (!filePath) return;
    //
    //       console.log(filePath, navigation.addPlugin.getAttribute('game-id'));
    //   }
    // );
    // document.dispatchEvent(
    //     new CustomEvent('navigate', {
    //         detail: {
    //             state: {
    //                 headerNavigation: {
    //                     previous: true,
    //                     addPlugin: false,
    //                 }
    //             },
    //             viewName: 'add-plugin',
    //         }
    //     })
    // );
});

const renderHeader = function (state) {
    if(!state.headerNavigation) {
        return;
    }

    Object.entries(navigation).forEach(function ([key, element]) {
        element.setAttribute('disabled', !state.headerNavigation[key]);
    });

    navigation.addPlugin.setAttribute('game-id', state.steam_appid);
    navigation.addPlugin.setAttribute('game-slug', state.appSlug);
};

module.exports = {
    render: renderHeader,
};
