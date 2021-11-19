"use strict";

const { ComparisonType } = require("../../../../shared/filter-constants");

module.exports = {
    id: "twitcherbot:message-text",
    name: "Message Text",
    description: "Filter based on chat message text",
    events: [
        { eventSourceId: "twitch", eventId: "chat-message" }
    ],
    comparisonTypes: [
        ComparisonType.IS,
        ComparisonType.IS_NOT,
        ComparisonType.CONTAINS,
        ComparisonType.STARTS_WITH,
        ComparisonType.DOESNT_STARTS_WITH,
        ComparisonType.ENDS_WITH,
        ComparisonType.DOESNT_END_WITH,
        ComparisonType.MATCHES_REGEX,
        ComparisonType.DOESNT_MATCH_REGEX
    ],
    valueType: "text",
    predicate: (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        /**
         * @type {string}
         */
        let chatMessage = eventMeta.messageText || "";

        switch (comparisonType) {
        case ComparisonType.IS:
            return chatMessage === value;
        case ComparisonType.IS_NOT:
            return chatMessage !== value;
        case ComparisonType.CONTAINS:
            return chatMessage.includes(value);
        case ComparisonType.STARTS_WITH:
            return chatMessage.startsWith(value);
        case ComparisonType.DOESNT_STARTS_WITH:
            return !chatMessage.startsWith(value);
        case ComparisonType.ENDS_WITH:
            return chatMessage.endsWith(value);
        case ComparisonType.DOESNT_END_WITH:
            return !chatMessage.endsWith(value);
        case ComparisonType.MATCHES_REGEX: {
            let regex = new RegExp(value, "gi");
            return regex.test(chatMessage);
        }
        case ComparisonType.DOESNT_MATCH_REGEX: {
            let regex = new RegExp(value, "gi");
            return !regex.test(chatMessage);
        }
        default:
            return false;
        }
    }
};