'use strict';

const routes = require('./routes');
const header = require('./header/header');

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
    console.log('state', detail.state);
    routes[detail.viewName].render(detail.state);
    header.render(detail.state);
    hideAllpartials();
    showPartial(detail.viewName);
});
