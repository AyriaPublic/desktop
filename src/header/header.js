'use strict';

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

const renderHeader = function (state) {
    if(!state.headerNavigation) {
        return;
    }

    Object.entries(navigation).forEach(function ([key, element]) {
        element.setAttribute('disabled', !state.headerNavigation[key]);
    });
};

module.exports = {
    render: renderHeader,
};
