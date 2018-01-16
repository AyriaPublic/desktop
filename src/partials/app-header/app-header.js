'use strict';
const dialog = require('electron').remote.dialog;
const node = require('inferno-create-element');
const { installPlugin } = require('../../core/plugin');

const renderHeaderItem = ({ iconName, onClick }) => node(
    'a',
    { 'className': 'app-header-item', onClick},
    node('img', { 'src': `./assets/${iconName}.svg`, alt: '' })
);

const headerItems = {
    previous: () => renderHeaderItem({
        'iconName': 'arrow-left-icon',
        'onClick': function (event) {
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
    addPlugin: () => renderHeaderItem({
        'iconName': 'plus-icon',
        'onClick': function (event) {
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

const renderHeader = function (activeItems = []) {
    return node(
        'nav',
        { 'className': 'app-header' },
        [
            activeItems.map(name => headerItems[name]()),
            node('div', {'className': 'app-header-logo-container'}, node(
                'img',
                {
                    'className': 'app-header-logo',
                    'src': './assets/ayria-logo.png',
                    'alt': 'Ayria logo'
                }
            ))
        ]
    )
}

module.exports = {
    render: renderHeader,
}
