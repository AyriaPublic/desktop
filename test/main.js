'use strict';

const Application = require('spectron').Application;
const path = require('path');
const test = require('ava');

test.beforeEach(t => {
    t.context.app = new Application({
        path: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        args: [
            path.join(__dirname, '..')
        ],
    });

    return t.context.app.start();
});

test.afterEach(t => {
    return t.context.app.stop();
});

test('start window accessibility', t => {
    return t.context.app.browserWindow
        .isVisible().then(visible =>
            t.true(visible, 'window is visible')
        )
        .auditAccessibility().then(audit =>
            t.false(audit.failed, 'accessibility audit was successful')
        );
});
