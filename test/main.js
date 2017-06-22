'use strict';

const Application = require('spectron').Application;
const path = require('path');
const test = require('ava');
const semverLevelHarmony = require('semver-level-harmony');
const { electron, spectron } = require('../package.json').devDependencies;

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
        .isVisible().then(visible => t.true(visible, 'window is visible'))
        .auditAccessibility().then(audit => {
            t.false(audit.failed, 'accessibility audit was successful');
        });
});

test('electron and spectron version minor levels are the same', t => {
    t.true(semverLevelHarmony('minor', electron, spectron));
});
