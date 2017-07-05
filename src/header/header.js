'use strict';
const dialog = require('electron').remote.dialog;
const extractPlugin = require('../add-plugin/add-plugin').extractPlugin;

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
    dialog.showOpenDialog(
        {
            'title': 'Open Ayria plugin package',
            'filters': [
                {'name': 'Ayria plugin package', extensions: ['zip']}
            ]
        },
        function (filePath) {
            if (!filePath) return;

            extractPlugin(
                filePath[0],
                navigation.addPlugin.getAttribute('game-slug')
            );
        }
    );
});

const renderHeader = function (state) {
    if (!state.headerNavigation) return;

    Object.entries(navigation).forEach(function ([key, element]) {
        element.setAttribute('disabled', !state.headerNavigation[key]);
    });
};

module.exports = {
    render: (state) => {
        renderHeader(state);
        navigation.addPlugin.setAttribute('game-slug', state.appSlug);
    },
};
