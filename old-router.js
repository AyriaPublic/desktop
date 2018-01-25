'use strict';

const routes = require('./routes');
const { app } = require('hyperapp');

let currentState = routes['list-steamapps'].state;
let currentActions = routes['list-steamapps'].actions;
let currentView = routes['list-steamapps'].view;

app(
    currentState,
    currentActions,
    (state, actions) => currentView(state, actions),
    document.querySelector('[data-main-view]')
);

document.addEventListener('navigate', function ({ detail }) {
    debugger;
    // currentState = Object.assign({}, routes[detail.viewName].state, detail.state);
    // currentActions = routes[detail.viewName].actions;
    currentView = routes[detail.viewName].view;
});


app(
    // Object.assign({}, routes[detail.viewName].state, detail.state),
    // routes[detail.viewName].actions,
    // routes[detail.viewName].view,
    Object.assign({}, {'viewName': 'list-steamapps'}, routes['list-steamapps'].state),
    routes['list-steamapps'].actions,
    (state, actions) => {
        return node('main', {}, [
            state.viewName === 'list-steamapps' && routes[state.viewName].view(state, actions),
            state.viewName === 'game-detail' && routes[state.viewName].view(
                Object.assign({}, routes[state.viewName].state, state),
                routes[state.viewName].actions
            ),
        ])
    },
    document.body
);