'use strict';

const routes = require('./routes');
const inferno = require('inferno');
// const header = require('./partials/app-header/app-header');

const hideAllpartials = function () {
    const partials = document.querySelectorAll('[data-partial]');

    for (let partial of partials) {
        partial.classList.remove('is-shown');
    }
};

const showPartial = function (name) {
    document.querySelector(`[data-${name}]`).classList.add('is-shown');
};

document.addEventListener('navigate', function ({detail}) {
    routes[detail.viewName].render(detail.state).then(nodes => {
        console.log('nodes', nodes);
        inferno.render(
            nodes,
            document.querySelector('[data-main-view]')
        )
    })
    // header.render(detail.state);
    // hideAllpartials();
    // showPartial(detail.viewName);
});
