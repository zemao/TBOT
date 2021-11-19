"use strict";

const model = {
    definition: {
        id: "twitcherbot:chatMessages",
        name: "Chat Messages",
        description: "Restricts to users who have sent a certain number of chat messages.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="chatMessageRestriction" class="mixplay-header" style="padding: 0 0 4px 0">
                Minimum # of Messages
            </div>
            <input type="number" class="form-control" placeholder="0" ng-model="restriction.messages">
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let messages = restriction.messages || 0;

        return messages + "+";
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            const viewerDB = require('../../database/userDatabase');
            let viewer = await viewerDB.getUserByUsername(triggerData.metadata.username);
            let chatMessages = viewer.chatMessages;

            if (chatMessages >= restrictionData.messages) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                reject("You have not sent enough chat messages in this channel");
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;