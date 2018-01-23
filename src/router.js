'use strict';

const routes = require('./routes');
const { app, h: node } = require('hyperapp');

const gameDetail = require('./partials/game-detail/game-detail');
const listSteamapps = require('./partials/list-steamapps/list-steamapps');

const navigate = viewName => state => Object.assign({}, state, {viewName})

document.addEventListener('navigate', function ({ detail }) {
    navigate(detail.viewName)
});

app(
    Object.assign(
        { viewName: 'list-steamapps' },
        { 'listSteamapps': listSteamapps.state },
        { 'gameDetail': gameDetail.state },
    ),
    {
        'listSteamapps': listSteamapps.actions,
        'gameDetail': gameDetail.actions,
        'navigate': navigate,
    },
    (state, actions) => {
        debugger;
        return node('main', {}, [
            state.viewName === 'list-steamapps' &&
                routes[state.viewName].view(
                    state,
                    actions,
                ),
            state.viewName === 'game-detail' &&
                routes[state.viewName].view(
                    // Object.assign({}, routes['gameDetail'].state, state),
                    state,
                    actions,
                ),
        ])
    },
    document.body,
);
