'use strict';

const routes = require('./routes');

const hideAllpartials = function () {
    const partials = document.querySelectorAll('[data-partial]');

    for (let partial of partials) {
        partial.classList.remove('is-shown');
    };
};

const showPartial = function (name) {
    document.querySelector(`[data-${name}]`).classList.add('is-shown');
};

document.addEventListener('navigate', function (event) {
  routes[event.detail.viewName].render(event.detail.state);
  hideAllpartials();
  showPartial(event.detail.viewName);
});
