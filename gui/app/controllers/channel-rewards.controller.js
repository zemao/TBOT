"use strict";
(function () {
    angular
        .module("twitcherbotApp")
        .controller("channelRewardsController", function (
            $scope,
            channelRewardsService,
            utilityService
        ) {
            $scope.channelRewardsService = channelRewardsService;

            // triggering twitch sync
            channelRewardsService.syncChannelRewards();

            $scope.onRewardsUpdated = (items) => {
                channelRewardsService.saveAllRewards(items);
            };

            $scope.headers = [
                {
                    headerStyles: {
                        'width': '50px'
                    },
                    cellTemplate: `
                        <div style="width: 30px; height: 30px; border-radius: 5px; padding: 5px; background-color: {{data.twitchData.backgroundColor}};">
                            <img ng-src="{{data.twitchData.image ? data.twitchData.image.url1x : data.twitchData.defaultImage.url1x}}"  style="width: 100%;filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.50));"/>
                        </div>
                    `,
                    cellController: () => { }
                },
                {
                    name: "NAME",
                    icon: "fa-user",
                    headerStyles: {
                        'min-width': '125px'
                    },
                    cellTemplate: `{{data.twitchData.title}} <i ng-hide="data.manageable" class="fas fa-lock muted" style="font-size: 12px;" uib-tooltip="This reward was created outside of Twitchbot, it's settings are locked from changes." />`,
                    cellController: () => { }
                },
                {
                    name: "COST",
                    icon: "fa-coin",
                    cellTemplate: `{{data.twitchData.cost}}`,
                    cellController: () => { }
                }
            ];


            $scope.rewardMenuOptions = (item) => {
                const options = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> ${item.manageable ? "Edit" : "Edit Effects"}</a>`,
                        click: function () {
                            channelRewardsService.showAddOrEditRewardModal(item);
                        }
                    },
                    {
                        html: `<a href uib-tooltip="This reward was created outside of Twitchbot, it's enabled status cannot be edited." tooltip-enable="${!item.manageable}"><i class="far fa-toggle-off" style="margin-right: 10px;"></i> Toggle Enabled</a>`,
                        click: function () {
                            item.twitchData.isEnabled = !item.twitchData.isEnabled;
                            channelRewardsService.saveChannelReward(item);
                        },
                        compile: true,
                        enabled: item.manageable
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function () {
                            channelRewardsService.duplicateChannelReward(item.id);
                        },
                        enabled: channelRewardsService.channelRewards.length < 50
                    },
                    {
                        html: `<a href style="${item.manageable ? 'color: #fb7373;' : ''}" uib-tooltip="This reward was created outside of Twitchbot, it cannot be deleted from here." tooltip-enable="${!item.manageable}"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function () {
                            utilityService
                                .showConfirmationModal({
                                    title: "Delete Channel Reward",
                                    question: `Are you sure you want to delete the Channel Reward "${item.twitchData.title}"?`,
                                    confirmLabel: "Delete",
                                    confirmBtnType: "btn-danger"
                                })
                                .then(confirmed => {
                                    if (confirmed) {
                                        channelRewardsService.deleteChannelReward(item.id);
                                    }
                                });

                        },
                        compile: true,
                        enabled: item.manageable
                    }
                ];

                return options;
            };
        });
}());
