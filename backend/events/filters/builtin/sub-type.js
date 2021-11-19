"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "twitcherbot:sub-type",
    name: "Sub Tier",
    description: "Filter by the tier of sub (Prime, Tier 1, 2, 3, etc)",
    events: [
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "community-subs-gifted" }
    ],
    comparisonTypes: [ComparisonType.IS, ComparisonType.IS_NOT],
    valueType: "preset",
    presetValues: () => {
        return [
            {
                value: "Prime",
                display: "Prime"
            },
            {
                value: "1000",
                display: "Tier 1"
            },
            {
                value: "2000",
                display: "Tier 2"
            },
            {
                value: "3000",
                display: "Tier 3"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {
        switch (filterSettings.value) {
        case "Prime":
            return "Prime";
        case "1000":
            return "Tier 1";
        case "2000":
            return "Tier 2";
        case "3000":
            return "Tier 3";
        default:
            return "[Not set]";
        }
    },
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        if (value == null) {
            return true;
        }

        let subPlan = eventMeta.subPlan;

        if (comparisonType === ComparisonType.IS) {
            return subPlan === value;
        } else if (comparisonType === ComparisonType.IS_NOT) {
            return subPlan !== value;
        }

        return true;
    }
};