'use strict';

const test = require('ava');
const steamFs = require('../src/core/steam-fs.js');

test('getSteamappVdfLaunch with no config or default', t => {
    const launchConfig = {
        '0': {
            executable: 'BFBC2Game.exe',
        },
        '1': {
            description: 'View Support Information',
            executable: 'support.htm',
        },
    };

    t.deepEqual(
        steamFs.getSteamappVdfLaunch({ launchConfig }),
        launchConfig['0'],
        'get the first executable'
    );
});

test('getSteamappVdfLaunch with multiple OS', t => {
    const launchConfig = {
        '0': {
            executable: 'trine2_launcher.exe',
            config: {
                oslist: 'windows',
            },
        },
        '1': {
            executable: 'Trine2Launcher.app',
            config: {
                oslist: 'macos',
            },
        },
        '2': {
            executable: 'trine2.sh',
            config: {
                oslist: 'linux',
            },
        },
    };

    t.is(
        steamFs.getSteamappVdfLaunch({
            steamPlatform: 'windows',
            launchConfig,
        }),
        launchConfig['0'],
        'get the windows executable '
    );

    t.is(
        steamFs.getSteamappVdfLaunch({ steamPlatform: 'linux', launchConfig }),
        launchConfig['2'],
        'get the linux executable '
    );
});

test('getSteamappVdfLaunch with multiple OS and Arch types', t => {
    const launchConfig = {
        '0': {
            executable: 'Faeria.exe',
            type: 'default',
            config: {
                oslist: 'windows',
            },
        },
        '1': {
            executable: 'Faeria.app\\Contents\\MacOS\\Faeria',
            type: 'default',
            config: {
                oslist: 'macos',
            },
        },
        '2': {
            executable: 'Faeria.x86_64',
            type: 'default',
            config: {
                oslist: 'linux',
                osarch: 64,
            },
        },
        '3': {
            executable: 'Faeria.x86',
            type: 'default',
            config: {
                oslist: 'linux',
                osarch: 32,
            },
        },
    };

    t.is(
        steamFs.getSteamappVdfLaunch({
            steamArch: 64,
            steamPlatform: 'linux',
            launchConfig,
        }),
        launchConfig['2'],
        'get the 64 bit executable'
    );

    t.is(
        steamFs.getSteamappVdfLaunch({
            steamArch: 32,
            steamPlatform: 'linux',
            launchConfig,
        }),
        launchConfig['3'],
        'get the 32 bit executable'
    );
});
