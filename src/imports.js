'use strict';

const importLinks = document.querySelectorAll('link[rel="import"]');

// Import and add each view to the DOM
for (let link of importLinks) {
    const template = link.import.querySelector('template');
    const clone = document.importNode(template.content, true);

    document.querySelector('[data-main-view]').appendChild(clone);
}
