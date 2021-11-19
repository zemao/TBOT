/*
grunt compile
   Compiles a previously made pack into an installer(for windows) or tarball(for linux)
*/

'use strict';
const path = require('path');
module.exports = function (grunt) {
    grunt.config.merge({
        'create-windows-installer': {
            win64: {
                appDirectory: path.join(__dirname, '../dist/pack/Twitchbot-win32-x64/'),
                outputDirectory: path.join(__dirname, '../dist/install/Windows/'),
                loadingGif: path.join(__dirname, '../gui/images/animated.gif'),
                iconUrl: path.join(__dirname, '../gui/images/icon_transparent.ico'),
                setupIcon: path.join(__dirname, '../gui/images/icon_transparent.ico'),
                exe: "Twitchbot.exe",
                title: " Twitchbot",
                setupExe: "twitchbot_release_stable_v1.0.0_setup.exe",
                noMsi: true
            }
        },
        compress: {
            linux: {
                options: {
                    archive: path.join(__dirname, '../dist/install/Linux/Twitchbot-linux-x64.tar.gz'),
                    mode: 'tgz'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/pack/Twitchbot-linux-x64/',
                    src: ['**'],
                    dest: '/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-electron-installer');
    grunt.loadNpmTasks('grunt-contrib-compress');

    let task = grunt.config.get('platform') === 'win64' ? 'create-windows-installer:win64' : 'compress:linux';
    grunt.registerTask('compile', ['cleanup:install', task]);
};