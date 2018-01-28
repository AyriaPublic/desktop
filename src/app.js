'use strict';

const views = require('./views/index.js');
const { app, h: node } = require('hyperapp');

const { mergeDeepRight, prop } = require('ramda');

const main = app(
    Object.assign(
        ...Object.values(views).map(prop('state'))
    ),
    Object.assign(
        {
            'mergeState': newState => state => mergeDeepRight(state, newState),
        },
        ...Object.values(views).map(prop('actions'))
    ),
    (state, actions) => node(
        'main',
        {},
        views[state.viewName].view(state, actions)
    ),
    document.body,
);

document.addEventListener('navigate', function ({ detail }) {
    main.mergeState(detail);
});
