'use strict';
const dialog = require('electron').remote.dialog;

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

          console.log(filePath, navigation.addPlugin.getAttribute('game-id'));
      }
    );
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
};

module.exports = {
    render: renderHeader,
};
