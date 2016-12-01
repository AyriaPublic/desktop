'use strict';

const hideAllpartials = function () {
    // refine this querySelectorAll
    const partials = document.querySelectorAll('.is-shown');
    Array.prototype.forEach.call(partials, function (partial) {
        partial.classList.remove('is-shown');
    });
};

const onlyShowPartial = function (name) {
    hideAllpartials();

    // Display the current partial
    document.querySelector(`[data-${name}]`).classList.add('is-shown');
};

module.exports = {
    hideAllpartials: hideAllpartials,
    onlyShowPartial: onlyShowPartial
};
