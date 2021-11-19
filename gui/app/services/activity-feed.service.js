"use strict";

(function() {

    const marked = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module("twitcherbotApp")
        .factory("activityFeedService", function($q, $sce, backendCommunicator, utilityService, gaService,
            settingsService, ngToast) {
            let service = {};

            service.allActivities = [];
            service.activities = [];

            backendCommunicator.on("event-activity", (activity) => {

                activity.message = $sce.trustAsHtml(sanitize(marked(activity.message)));

                service.allActivities.unshift(activity);
                if (service.allActivities.length > 500) {
                    service.allActivities.length = 500;
                }

                const allowedEvents = settingsService.getAllowedActivityEvents();
                if (!allowedEvents.includes(`${activity.source.id}:${activity.event.id}`)) {
                    return;
                }

                service.activities.unshift(activity);
                if (service.activities.length > 100) {
                    service.activities.length = 100;
                }
            });

            service.allAcknowledged = () => {
                if (service.activities.length < 1) {
                    return false;
                }
                return !service.activities.some(a => a.acknowledged === false);
            };

            service.markAllAcknowledged = () => {
                service.allActivities.forEach(a => {
                    a.acknowledged = true;
                });
            };

            service.markAllNotAcknowledged = () => {
                service.allActivities.forEach(a => {
                    a.acknowledged = false;
                });
            };

            service.toggleMarkAllAcknowledged = () => {
                if (service.allAcknowledged()) {
                    service.markAllNotAcknowledged();
                } else {
                    service.markAllAcknowledged();
                }
            };

            service.unacknowledgedCount = () => {
                return service.activities.filter(a => !a.acknowledged).length;
            };

            backendCommunicator.on("acknowledge-all-activity", () => {
                service.markAllAcknowledged();
            });

            service.retriggerEvent = (activityId) => {
                backendCommunicator.send("retrigger-event", activityId);
                ngToast.create({
                    className: 'success',
                    content: "Successfully retriggered event!",
                    timeout: 5000
                });
            };

            service.showEditActivityFeedEventsModal = () => {
                utilityService.showModal({
                    component: "editActivityEventsModal",
                    size: "sm",
                    closeCallback: () => {
                        const allowedEvents = settingsService.getAllowedActivityEvents();
                        service.activities = service.allActivities
                            .filter(a => allowedEvents.includes(`${a.source.id}:${a.event.id}`));
                    }
                });
                gaService.sendEvent("dashboard", "open", "activity feed filter");
            };

            return service;
        });
}());
