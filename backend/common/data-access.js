"use strict";

const electron = require("electron");
const path = require("path");
const fs = require("fs-extra");
const JsonDB = require("node-json-db");

// This is the path to folder the app is currently living in. IE: C:\Users\<user>\AppData\Local\Twitchbot\app-4.0.0\
// This will change after every update.
const workingDirectoryPath = process.cwd();

let getWorkingDirectoryPath = function () {
    return workingDirectoryPath;
};

// Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
// app.getPath('userData') will return a string of the user's app data directory path.
// This is the path to the user data folder. IE: C:\Users\<user>\AppData\Roaming\Twitchbot\
// This stays the same after every update.
const appDataPath = (electron.app || electron.remote.app).getPath("appData");

const rootUserDataPath = appDataPath + path.sep + "Twitchbot";
const userDataPath = rootUserDataPath + path.sep + "v5";

const tmpDirectoryPath = path.join(rootUserDataPath, "tmp");

let getPathInUserData = function (filePath) {
    return path.join(userDataPath, filePath);
};

let getPathInWorkingDir = function (filePath) {
    return path.join(workingDirectoryPath, filePath);
};

let getPathInTmpDir = function (filePath) {
    return path.join(tmpDirectoryPath, filePath);
};

let deletePathInTmpDir = function (filePath) {
    fs.unlink(path.join(tmpDirectoryPath, filePath));
};

let deletePathInUserData = function (filePath) {
    fs.unlink(path.join(userDataPath, filePath));
};

let deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            let curPath = path + "/" + file;
            if (fs.statSync(curPath).isDirectory()) {
                // recurse
                deleteFolderRecursive(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

let getUserDataPath = function () {
    return userDataPath;
};

function pathExists(path) {
    return new Promise(resolve => {
        fs.access(path, err => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === "ENOENT") {
                    // This folder doesn't exist. Resolve and create it.
                    resolve(false);
                } else {
                    const logger = require("../logwrapper");
                    // Some weird error happened other than the path missing.
                    logger.error(err);
                }
            } else {
                resolve(true);
            }
        });
    });
}

let createTwitchbotDataDir = function () {
    if (!pathExists(userDataPath)) {
        const logger = require("../logwrapper");
        logger.info("Creating twitcherbot-data folder...");
        fs.mkdirSync(userDataPath);
    }
};

let getJsonDbInUserData = function (filePath) {
    let jsonDbPath = path.join(userDataPath, filePath);
    return new JsonDB(jsonDbPath, true, true);
};

let makeDirInUserData = async function (filePath) {
    new Promise(resolve => {
        let joinedPath = path.join(userDataPath, filePath);
        fs.mkdir(joinedPath, () => {
            resolve();
        });
    });
};

let makeDirInUserDataSync = function (filePath) {
    try {
        let joinedPath = path.join(userDataPath, filePath);
        fs.mkdirSync(joinedPath);
        return true;
    } catch (err) {
        const logger = require("../logwrapper");
        logger.error(`Error creating ${filePath}: ` + err);
        return false;
    }
};

let writeFileInWorkingDir = function (filePath, data, callback) {
    let joinedPath = path.join(workingDirectoryPath, filePath);
    fs.writeFile(joinedPath, data, "utf8", callback);
};

let writeFileInUserData = function (filePath, data, callback) {
    let joinedPath = path.join(userDataPath, filePath);
    fs.writeFile(joinedPath, data, "utf8", callback);
};

let copyDefaultConfigToUserData = function (
    configFileName,
    userDataDestination
) {
    let source = getPathInWorkingDir(
        "/resources/default-configs/" + configFileName
    );
    let destination = getPathInUserData(
        userDataDestination + "/" + configFileName
    );
    fs.writeFileSync(destination, fs.readFileSync(source));
};

const copyResourceToUserData = function (
    resourcePath = "",
    resourceName,
    userDataDestination = ""
) {
    try {
        const source = getPathInWorkingDir(
            resourcePath == null || resourcePath === ""
                ? path.join("/resources/", resourceName)
                : path.join("/resources/", resourcePath, resourceName)
        );

        const destination = getPathInUserData(
            path.join(userDataDestination, resourceName)
        );
        fs.writeFileSync(destination, fs.readFileSync(source));
    } catch (error) {
        const logger = require("../logwrapper");
        logger.error(`Failed to copy resource ${resourceName}`, error);
    }
};

let workingDirPathExists = function (filePath) {
    let joinedPath = path.join(workingDirectoryPath, filePath);
    return pathExists(joinedPath);
};

let userDataPathExists = function (filePath) {
    let joinedPath = path.join(userDataPath, filePath);
    return pathExists(joinedPath);
};

function pathExistsSync(path) {
    return fs.existsSync(path);
}

let userDataPathExistsSync = function (filePath) {
    let joinedPath = path.join(userDataPath, filePath);
    return pathExistsSync(joinedPath);
};

exports.getPathInWorkingDir = getPathInWorkingDir;
exports.getPathInUserData = getPathInUserData;
exports.createTwitchbotDataDir = createTwitchbotDataDir;
exports.makeDirInUserData = makeDirInUserData;
exports.makeDirInUserDataSync = makeDirInUserDataSync;
exports.writeFileInWorkingDir = writeFileInWorkingDir;
exports.writeFileInUserData = writeFileInUserData;
exports.copyDefaultConfigToUserData = copyDefaultConfigToUserData;
exports.copyResourceToUserData = copyResourceToUserData;
exports.workingDirPathExists = workingDirPathExists;
exports.userDataPathExists = userDataPathExists;
exports.userDataPathExistsSync = userDataPathExistsSync;
exports.getWorkingDirectoryPath = getWorkingDirectoryPath;
exports.getJsonDbInUserData = getJsonDbInUserData;
exports.getUserDataPath = getUserDataPath;
exports.getTmpDirectory = tmpDirectoryPath;
exports.getPathInTmpDir = getPathInTmpDir;
exports.deletePathInTmpDir = deletePathInTmpDir;
exports.deletePathInUserData = deletePathInUserData;
exports.deleteFolderRecursive = deleteFolderRecursive;
