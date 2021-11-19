"use strict";

(function() {
    angular.module("twitcherbotApp").component("tooltip", {
        bindings: {
            text: "<",
            type: "@",
            styles: "@"
        },
        template: `
                <i class="fal" style="{{$ctrl.styles}}" ng-class="{'fa-question-circle': $ctrl.type === 'question', 'fa-info-circle': $ctrl.type === 'info' }" uib-tooltip="{{$ctrl.text}}" tooltip-append-to-body="true"></i>
            `,
        controller: function() {
            let ctrl = this;
            ctrl.$onInit = function() {
                if (ctrl.type == null) {
                    ctrl.type = "question";
                }
            };
        }
    });
}());
