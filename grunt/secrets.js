'use strict';
const path = require('path');
const fs = require('fs');
const gpgBase = `gpg --cipher-algo AES256 --passphrase ${process.env.PASSKEY_FOR_FIREBOT_SECRETS} --pinentry-mode loopback`;

module.exports = function (grunt) {
    grunt.config.merge({
        shell: {
            encryptsecrets: {
                command: `${gpgBase} --output secrets.gpg --symmetric secrets.json`
            },
            decryptsecrets: {
                command: `${gpgBase} --output secrets.json --decrypt secrets.gpg`
            }
        }
    });

    grunt.registerTask('secrets', function (action) {
        if (process.env.PASSKEY_FOR_FIREBOT_SECRETS == null) {
            throw new Error('passkey for twitcherbot\'s secrets not found');
        }

        if (action === 'encrypt') {
            if (!fs.existsSync(path.join(__dirname, '../secrets.json'))) {
                throw new Error('secrets.json not found');
            }

            if (fs.existsSync(path.join(__dirname, '../secrets.gpg'))) {
                fs.unlink('../secrets.gpg');
            }

            grunt.task.run('shell:encryptsecrets');

        } else if (action === 'decrypt') {
            if (!fs.existsSync(path.join(__dirname, '../secrets.gpg'))) {
                throw new Error('secrets.gpg not found');
            }

            if (fs.existsSync(path.join(__dirname, '../secrets.json'))) {
                fs.unlink('../secrets.json');
            }

            grunt.task.run('shell:decryptsecrets');
        } else {
            throw new Error('unknown action');
        }
    });
};