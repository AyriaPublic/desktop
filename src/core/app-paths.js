'use strict';

const envPaths = require('env-paths')('ayria-desktop', {suffix: ''});
const mkdirp = require('mkdirp');

const setup = function () {
    mkdirp.sync(envPaths.cache);
    mkdirp.sync(envPaths.data);

    return {
        'cache': envPaths.cache,
        'data': envPaths.data,
    };
};

module.exports = {
    setup,
};
