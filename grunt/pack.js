/*
grunt pack
    Removes the /dist/pack/ directory
    Runs electron packager for the current platform
    Copies Resources into /dist/pack/{platform}/resources/
*/

'use strict';
module.exports = function (grunt) {
    let flags = [
        '--out="./dist/pack"',
        '--arch=x64',
        '--electronVersion=7.1.9',
        '--js-flags="--harmony"',
        '--asar.unpack="moderation-service.js"',
        '--prune',
        '--overwrite',
        '--version-string.ProductName="Twitchbot"',
        '--executable-name="Twitchbot"',
        '--icon="./gui/images/icon_transparent.ico"',
        '--ignore=/.github',
        '--ignore=/.vscode',
        '--ignore=/grunt',
        '--ignore=/resources',
        '--ignore=/doc',
        '--ignore=/profiles',
        '--ignore=/dist/install'
    ].join(' ');

    grunt.config.merge({
        shell: {
            packwin64: {
                command: `npx --no-install --ignore-existing electron-packager . Twitchbot --platform=win32 ${flags}`
            },
            packlinux: {
                command: `npx --no-install --ignore-existing electron-packager . Twitchbot --platform=linux ${flags}`
            },
            packdarwin: {
                command: `npx --no-install --ignore-existing electron-packager . Twitchbot --platform=darwin ${flags}`
            }
        }
    });

    let platform = grunt.config.get('platform');
    grunt.registerTask('pack', ['cleanup:pack', `shell:pack${platform}`, 'copy']);
};