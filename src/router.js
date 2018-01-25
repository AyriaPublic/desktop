'use strict';

const partials = require('./partials.js');
const { app, h: node } = require('hyperapp');

const { mergeDeepRight, prop } = require('ramda');

const main = app(
    Object.assign(
        ...Object.values(partials).map(prop('state'))
    ),
    Object.assign(
        {
            'mergeState': newState => state => mergeDeepRight(state, newState)
        },
        ...Object.values(partials).map(prop('actions'))
    ),
    (state, actions) => node('main', {}, [
            state.viewName === 'list-steamapps' &&
                partials[state.viewName].view(
                    state,
                    actions,
                ),
            state.viewName === 'game-detail' &&
                partials[state.viewName].view(
                    state,
                    actions,
                ),
        ]),
    document.body,
);

document.addEventListener('navigate', function ({ detail }) {
    main.mergeState(detail);
});
