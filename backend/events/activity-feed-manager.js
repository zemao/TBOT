"use strict";
const app = require('electron').app;
const moment = require("moment");
const uuid = require("uuid/v4");
const frontendCommunicator = require("../common/frontend-communicator");

const eventManager = require("./EventManager");

const isUSLocale = app.getLocale() === "en-US";
const timeFormat = isUSLocale ? "h:mm" : "k:mm";

const previousActivity = [];

function handleTriggeredEvent(source, event, metadata) {
    if (source == null || event == null || metadata == null) {
        return;
    }

    if (event.activityFeed == null ||
        event.activityFeed.getMessage == null) return;


    const activityId = uuid();

    previousActivity.unshift({
        id: activityId,
        eventId: event.id,
        sourceId: source.id,
        metadata: metadata
    });

    if (previousActivity.length > 500) {
        previousActivity.length = 500;
    }

    frontendCommunicator.send("event-activity", {
        id: activityId,
        source: {
            id: source.id,
            name: source.name
        },
        event: {
            id: event.id,
            name: event.name
        },
        message: event.activityFeed.getMessage(metadata),
        icon: event.activityFeed.icon,
        acknowledged: false,
        timestamp: moment().format(timeFormat)
    });
}

eventManager.on("event-triggered", ({
    event,
    source,
    meta,
    isManual,
    isRetrigger
}) => {
    if (isManual || isRetrigger) {
        return;
    }
    handleTriggeredEvent(source, event, meta);
});

frontendCommunicator.on("retrigger-event", (activityId) => {
    const activity = previousActivity.find(a => a.id === activityId);
    if (activity == null) return;
    eventManager.triggerEvent(activity.sourceId, activity.eventId,
        activity.metadata, false, true);
});

frontendCommunicator.onAsync("get-all-activity-events", async () => previousActivity);

frontendCommunicator.onAsync("get-activity-feed-supported-events", async () => {
    return eventManager
        .getAllEventSources()
        .map(es =>
            es.events
                .filter(e => e.activityFeed != null)
                .map(e => (
                    {
                        eventId: e.id,
                        eventName: e.name,
                        sourceId: es.id,
                        sourceName: es.name
                    }
                )))
        .flat()
        .filter(e => e != null);
});

frontendCommunicator.onAsync("get-activity-feed-supported-event-filters", async () => {
    return eventManager
        .getAllEventFilters()
        .map(fs =>
            fs.filters
                .filter(f => f.id != null)
                .map(f => (
                    {
                        id: f.id,
                        name: f.name
                    }
                )))
        .flat()
        .filter(f => f != null);
});




