"use strict";

const { ComparisonType } = require("../../../../../shared/filter-constants");

module.exports = {
    id: "streamloots:gift-purchase",
    name: "Chest Purchase",
    description: "Filter by whether or not the StreamLoots chest purchase was a gift.",
    events: [
        { eventSourceId: "streamloots", eventId: "purchase" }
    ],
    comparisonTypes: [ComparisonType.IS],
    valueType: "preset",
    presetValues: async () => {
        return [
            {
                value: "true",
                display: "A Gift"
            },
            {
                value: "false",
                display: "Not A Gift"
            }
        ];
    },
    getSelectedValueDisplay: (filterSettings) => {

        if (filterSettings.value == null) {
            return "[Not set]";
        }

        if (filterSettings.value) {
            return "A Gift";
        }

        return "Not A Gift";
    },
    predicate: (filterSettings, eventData) => {

        let { value } = filterSettings;
        let { eventMeta } = eventData;

        let filterGiftValue = value === "true";

        let isGift = eventMeta.giftee != null;

        return filterGiftValue === isGift;
    }
};