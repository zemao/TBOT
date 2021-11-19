"use strict";
const logger = require("./logwrapper");
const request = require("request");
const axios = require('axios');
const accountAccess = require("./common/account-access");
const CLIENT_ID = "umhhyrvkdriayr0psc3ttmsnq2j8h0";

const HEADERS = {
    'User-Agent': 'Twitchbot',
    'Client-ID': CLIENT_ID
};

function buildRequestOptions(method, route, body, apiVersion = "v1", authAsStreamer = true) {
    if (apiVersion !== "v1") {
        apiVersion = "v2";
    }

    let options = {
        url: `https://mixer.com/api/${apiVersion}/${route}`,
        method: method,
        headers: HEADERS,
        json: true,
        body: body
    };

    if (authAsStreamer) {
        let streamerData = accountAccess.getAccounts().streamer;
        if (streamerData.loggedIn) {
            options.headers.Authorization = `Bearer ${streamerData.auth.access_token}`;
        }

    }

    return options;
}

function promisifiedRequest(options, resolveResponse = false, resolveErrorResponse = false) {
    return new Promise((resolve, reject) => {

        request(options, function (err, res, body) {
            if (!err && res.statusCode >= 200 && res.statusCode <= 204) {
                if (resolveResponse) {
                    resolve(res);
                } else {
                    resolve(res.body);
                }
            } else {
                if (resolveErrorResponse) {
                    reject({
                        response: res,
                        body: body
                    });
                } else {
                    reject(err);
                }
            }
        });
    });
}

exports.requestWithoutAuth = function (method, route, body, apiVersion, resolveResponse) {

    let options = buildRequestOptions(method, route, body, apiVersion, false);

    return promisifiedRequest(options, resolveResponse);
};

exports.requestAsStreamer = function (method, route, body, apiVersion, resolveResponse) {

    let options = buildRequestOptions(method, route, body, apiVersion, true);

    return promisifiedRequest(options, resolveResponse);
};

exports.get = function (route, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("GET", route, null, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};

exports.post = function (route, body, apiVersion = "v1", resolveResponse = false, authAsStreamer = true, resolveErrorResponse = false) {

    let options = buildRequestOptions("POST", route, body, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse, resolveErrorResponse);
};

exports.patch = function (route, body, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("PATCH", route, body, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};

exports.delete = function (route, apiVersion = "v1", resolveResponse = false, authAsStreamer = true) {

    let options = buildRequestOptions("DELETE", route, null, apiVersion, authAsStreamer);

    return promisifiedRequest(options, resolveResponse);
};

exports.getUserCurrent = (accessToken) => {
    return new Promise(resolve => {
        request({
            url: 'https://api.twitch.tv/helix/users',
            auth: {
                'bearer': accessToken
            },
            headers: {
                'Authorization': accessToken,
                'User-Agent': 'Twitchbot',
                'Client-ID': CLIENT_ID
            },
            json: true
        }, function (err, response) {
            if (err) {
                logger.error(err);
                return resolve(null);
            }
            if (response.statusCode >= 200 && response.statusCode <= 204) {
                let userData = response.body;
                resolve(userData.data && userData.data.length > 0 ? userData.data[0] : null);
            } else {
                resolve(null);
            }
        });
    });
};