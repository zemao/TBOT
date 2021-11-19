"use strict";

(function() {
    angular.module("twitcherbotApp").component("eosContainer", {
        bindings: {
            header: "@",
            padTop: "<"
        },
        transclude: true,
        template: `
            <div class="effect-setting-container" ng-class="{ 'setting-padtop' : $ctrl.padTop }">
                <div class="effect-specific-title" ng-if="$ctrl.header">
                    <h4>{{$ctrl.header}}</h4>
                </div>
                <div class="effect-setting-content" ng-transclude></div>
            </div>
        `
    });
}());
