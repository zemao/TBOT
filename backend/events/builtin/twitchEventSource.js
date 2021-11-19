"use strict";

module.exports = {
    id: "twitch",
    name: "Twitch",
    description: "Events like Follow, Host, Subscribe and more from Twitch",
    events: [
        {
            id: "host",
            name: "Host",
            description: "When someone hosts your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Twitchbot",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-house-user",
                getMessage: (eventData) => {
                    return `**${eventData.username}** hosted with **${eventData.viewerCount}** viewer(s)`;
                }
            }
        },
        {
            id: "raid",
            name: "Raid",
            description: "When someone raids your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Twitchbot",
                viewerCount: 5
            },
            activityFeed: {
                icon: "fad fa-siren-on",
                getMessage: (eventData) => {
                    return `**${eventData.username}** raided with **${eventData.viewerCount}** viewer(s)`;
                }
            }
        },
        {
            id: "follow",
            name: "Follow",
            description: "When someone follows your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Twitchbot",
                userId: 0
            },
            activityFeed: {
                icon: "fas fa-heart",
                getMessage: (eventData) => {
                    return `**${eventData.username}** followed`;
                }
            }
        },
        {
            id: "sub",
            name: "Sub",
            description: "When someone subscribes (or resubscribes) to your channel.",
            cached: false,
            manualMetadata: {
                username: "Twitchbot",
                subPlan: "1000",
                totalMonths: 10,
                streak: 8,
                isPrime: false,
                isResub: false
            },
            activityFeed: {
                icon: "fas fa-star",
                getMessage: (eventData) => {
                    return `**${eventData.username}** ${eventData.isResub ? 'resubscribed' : 'subscribed'} for **${eventData.totalMonths} month(s)** ${eventData.subPlan === 'Prime' ?
                        "with **Twitch Prime**" : "at **Tier " + eventData.subPlan.replace("000", "") + "**"}`;
                }
            }
        },
        {
            id: "subs-gifted",
            name: "Sub Gifted",
            description: "When someone gifts a sub to someone else in your channel.",
            cached: false,
            manualMetadata: {
                username: "MageEnclave",
                giftSubMonths: 1,
                gifteeUsername: "MageEnclave",
                gifterUsername: "Twitchbot",
                subPlan: "1000"
            },
            activityFeed: {
                icon: "fad fa-gift",
                getMessage: (eventData) => {
                    return `**${eventData.gifterUsername}** gifted a ${eventData.giftSubMonths > 1 ? ` **${eventData.giftSubMonths} month** ` : ''} **${eventData.subPlan === 'Prime' ?
                        "Twitch Prime" : "Tier " + eventData.subPlan.replace("000", "")}** sub to **${eventData.gifteeUsername}**`;
                }
            }
        },
        {
            id: "community-subs-gifted",
            name: "Community Subs Gifted",
            description: "When someone gifts random subs to the community of the channel",
            cached: false,
            manualMetadata: {
                username: "Twitchbot",
                gifterUsername: "Twitchbot",
                subCount: 5,
                subPlan: "1000"
            },
            activityFeed: {
                icon: "fad fa-gifts",
                getMessage: (eventData) => {
                    return `**${eventData.username}** gifted **${eventData.subCount} Tier ${eventData.subPlan.replace("000", "")}** sub${eventData.subCount > 1 ? 's' : ''} to the community`;
                }
            }
        },
        {
            id: "cheer",
            name: "Cheer",
            description: "When someone cheers in your channel (uses bits).",
            cached: false,
            manualMetadata: {
                username: "Twitchbot",
                isAnonymous: false,
                bits: 100,
                totalBits: 1200
            },
            activityFeed: {
                icon: "fad fa-diamond",
                getMessage: (eventData) => {
                    return `**${eventData.username}** cheered **${eventData.bits}** bits. A total of **${eventData.totalBits}** were cheered by **${eventData.username}** in the channel.`;
                }
            }
        },
        {
            id: "viewer-arrived",
            name: "Viewer Arrived",
            description: "When a viewer first chats in your channel.",
            cached: true,
            cacheMetaKey: "username",
            manualMetadata: {
                username: "Twitchbot"
            },
            activityFeed: {
                icon: "fad fa-house-return",
                getMessage: (eventData) => {
                    return `**${eventData.username}** arrived`;
                }
            }
        },
        {
            id: "chat-message",
            name: "Chat Message",
            description: "When someone chats in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "Twitchbot",
                messageText: "Test message"
            }
        },
        {
            id: "banned",
            name: "Viewer Banned",
            description: "When someone is banned in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "Twitchbot"
            },
            activityFeed: {
                icon: "fad fa-gavel",
                getMessage: (eventData) => {
                    return `**${eventData.username}** was banned`;
                }
            }
        },
        {
            id: "timeout",
            name: "Viewer Timeout",
            description: "When someone is timed out in your channel",
            cached: false,
            queued: false,
            manualMetadata: {
                username: "Twitchbot",
                timeoutDuration: "1"
            },
            activityFeed: {
                icon: "fad fa-stopwatch",
                getMessage: (eventData) => {
                    return `**${eventData.username}** was timed out for **${eventData.timeoutDuration} sec(s)**`;
                }
            }
        },
        {
            id: "channel-reward-redemption",
            name: "Channel Reward Redemption",
            description: "When someone redeems a CUSTOM channel reward",
            cached: true,
            cacheMetaKey: "username",
            cacheTtlInSecs: 1,
            queued: false,
            manualMetadata: {
                username: "Twitchbot",
                rewardName: "Test Reward",
                rewardImage: "https://static-cdn.jtvnw.net/automatic-reward-images/highlight-1.png",
                rewardCost: "200",
                messageText: "Test message"
            },
            activityFeed: {
                icon: "fad fa-circle",
                getMessage: (eventData) => {
                    return `**${eventData.username}** redeemed **${eventData.rewardName}**${eventData.messageText && !!eventData.messageText.length ? `: *${eventData.messageText}*` : ''}`;
                }
            }
        },
        {
            id: "whisper",
            name: "Whisper",
            description: "When someone sends you a whisper.",
            cached: true,
            manualMetadata: {
                username: "Twitchbot",
                message: "Test whisper"
            },
            activityFeed: {
                icon: "fad fa-comment-alt",
                getMessage: (eventData) => {
                    return `**${eventData.username}** sent you the following whisper: ${eventData.message}`;
                }
            }
        }
    ]
};
