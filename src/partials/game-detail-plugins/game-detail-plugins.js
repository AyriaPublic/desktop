'use strict';

const { h: node } = require('hyperapp');

// renderPlugin :: Object -> Object
const renderPlugin = (pluginData) => node(
    'li',
    { 'data-plugin-active': pluginData.active },
    `${pluginData.name} - ${pluginData.version}`
);

// renderGameDetailPlugins :: [Object] -> Object
const renderGameDetailPlugins = (plugins) => node(
    'section',
    { 'class': 'game-detail-plugins' },
    [
        node('h2', {}, 'Installed plugins'),
        node(
            'ul',
            { 'class': 'plugin-list' },
            plugins.map(renderPlugin)
        )
    ]
);

module.exports = {
    view: renderGameDetailPlugins,
};
