"use strict";

const model = {
    definition: {
        id: "twitcherbot:followcheck",
        name: "Follow Check",
        description: "Restrict based on if user is following everyone in a comma separated list.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div id="userFollowList" class="mixplay-header" style="padding: 0 0 4px 0">
                User follows
            </div>
            <input type="text" class="form-control" placeholder="Enter value" ng-model="restriction.value">
        </div>
    `,
    optionsController: ($scope) => {

    },
    optionsValueDisplay: (restriction) => {
        let value = restriction.value;

        if (value == null) {
            return "";
        }

        return value;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: async (trigger, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            const userAccess = require("../../common/user-access");

            let triggerUsername = trigger.metadata.username || "";
            let followListString = restrictionData.value || "";

            if (triggerUsername === "", followListString === "") {
                return resolve();
            }

            let followCheckList = followListString.split(',')
                .filter(f => f != null)
                .map(f => f.toLowerCase().trim());

            let followCheck = await userAccess.userFollowsChannels(triggerUsername, followCheckList);

            if (followCheck) {
                return resolve();
            }

            return reject("You must be following: " + restrictionData.value);
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;