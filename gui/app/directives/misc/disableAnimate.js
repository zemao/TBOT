"use strict";

angular.module('twitcherbotApp')
    .directive("disableAnimate", function ($animate) {
        return {
            scope: false,
            link: function (_, element) {
                $animate.enabled(element, false);
            }
        };
    });