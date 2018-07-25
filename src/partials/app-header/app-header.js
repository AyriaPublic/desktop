'use strict';
const dialog = require('electron').remote.dialog;
const { h: node } = require('hyperapp');
const { installPlugin } = require('../../core/plugin');

const renderHeaderItem = ({ iconName, onclick }) => node(
    'a',
    { 'class': 'app-header-item', onclick},
    node('img', { 'src': `./assets/${iconName}.svg`, alt: '' })
);

const headerItems = {
    previous: renderHeaderItem({
        'iconName': 'arrow-left-icon',
        'onclick': function (event) {
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
        }
    }),
    addPlugin: renderHeaderItem({
        'iconName': 'plus-icon',
        'onclick': function (event) {
            event.preventDefault();
            dialog.showOpenDialog(
                {
                    'title': 'Open Ayria plugin package',
                    'filters': [
                        {'name': 'Ayria plugin package', extensions: ['zip', 'ayria']}
                    ]
                },
                function (filePath) {
                    if (!filePath) return;

                    installPlugin(filePath[0]);
                }
            );
        }
    }),
};

const renderHeader = (activeItems = []) => node(
    'nav',
    { 'class': 'app-header' },
    [
        activeItems.map(name => headerItems[name]),
        node('div', {'class': 'app-header-logo-container'}, node(
            'img',
            {
                'class': 'app-header-logo',
                'src': './assets/ayria-logo.svg',
                'alt': 'Ayria logo'
            }
        ))
    ]
);

module.exports = renderHeader;
