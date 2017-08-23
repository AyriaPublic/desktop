'use strict';
const dialog = require('electron').remote.dialog;
const { installPlugin } = require('../../core/plugin');

const navigation = {
    previous: document.querySelector('[data-app-header-previous]'),
    addPlugin: document.querySelector('[data-app-header-add-plugin]'),
};

let appSlug;

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

            installPlugin(filePath[0]);
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
        appSlug = state.appSlug;
    },
};
