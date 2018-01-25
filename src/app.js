'use strict';

const { app, h: node } = require('hyperapp');
const { Link, Route, location } = require('@hyperapp/router');

const partials = {
    'counter': require('./partials/counter/counter.js'),
}

const state = Object.assign(
    {},
    { location: location.state },
    partials.counter.state,
);

const actions = Object.assign(
    {},
    { location: location.actions },
    partials.counter.actions,
);

const main = app(
  state,
  actions,
  (state, actions) =>
    node("main", {}, [
      Link({ to: "/counter" }, "counter"),
      Link({ to: "/dragons" }, "dragon cave"),
      Route({
        path: "/counter",
        render: partials.counter.view(state, actions),
      }),
      Route({
        path: "/dragons",
        render: () => node("h1", {}, "Woosh!")
      })
    ]),
  document.body
);

console.log(main);
const unsubscribe = location.subscribe(main.location);
