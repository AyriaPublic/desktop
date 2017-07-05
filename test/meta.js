'use strict';

const test = require('ava');
const semverLevelHarmony = require('semver-level-harmony');
const { electron, spectron } = require('../package.json').devDependencies;

test('electron and spectron version minor levels are the same', t =>
    t.true(semverLevelHarmony('minor', electron, spectron))
);
