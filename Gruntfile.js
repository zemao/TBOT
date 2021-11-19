/*
All registered tasks accept a platform flag to override the default os platform
  Example: grunt pack --platform=linux

Registered Tasks:
    setup - runs npm install, npm rebuild, and rebuild for robotjs

    cleanup         - Deletes compiled CSS, and empties /dist/
    cleanup:css     - Deletes compiled CSS
    cleanup:pack    - Deletes /dist/pack
    cleanup:install - Deletes /dist/install
    cleanup:dist    - Empties /dist/

    scss - Deletes compiled CSS, then recompiles SCSS

    lint - Runs eslint

    secrets:encrypt - Encrypts an updated secrets.json to secrets.gpg
    secrets:decrypt - Decrypts the repo's secrets.gpg to secrects.json

    pack
        - Runs electron-packager for the platform
        - Copies resources into the pack's resource folder

    compile - Creates an installer/tarball from the platform's pack

    build - Runs cleanup, scss, pack, and compile
*/

module.exports = function (grunt) {

    // Deduce platform
    let platform = grunt.option('platform');
    if (platform == null || platform == '' || platform instanceof Boolean) {
        platform = process.platform === 'win32' ? 'win64' : process.platform;
    }
    if (platform !== 'win64' && platform !== 'linux') {
        //grunt.fail.fatal(new Error('Platform not supported'), 1);
    }

    // Base configuration
    grunt.initConfig({
        watch: {
            css: {
                files: 'gui/scss/**/*.scss',
                tasks: ['scss'],
                options: {
                    livereload: true,
                },
            },
        },
        platform: platform,
        pkg: grunt.file.readJSON('package.json'),
    });

    // Register shell executor
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-develop');

    // Register project modules
    require('./grunt/cleanup.js')(grunt);
    require('./grunt/scss.js')(grunt);
    require('./grunt/lint.js')(grunt);
    require('./grunt/copy.js')(grunt);
    require('./grunt/pack.js')(grunt);
    require('./grunt/compile.js')(grunt);
    require('./grunt/setup.js')(grunt);
    require('./grunt/secrets.js')(grunt);
    require('./grunt/include-source')(grunt);

    grunt.registerTask('build', ['scss', 'include-source', 'pack', 'compile', 'watch']);
    // grunt.registerTask('default', ['develop', 'watch']);
};