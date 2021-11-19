"use strict";

(function() {

    angular
        .module('twitcherbotApp')
        .component("sortTagDropdown", {
            bindings: {
                context: "@",
                style: "@?"
            },
            template: `
            <div
                class="btn-group"
                style="{{$ctrl.style}}"
                uib-dropdown
                ng-show="$ctrl.context != null"
            >
                <button
                    id="single-button"
                    type="button"
                    class="btn btn-default"
                    uib-dropdown-toggle
                >
                    {{sts.getSelectedSortTagDisplay($ctrl.context)}}
                    <span class="caret"></span>
                </button>
                <ul
                    class="dropdown-menu"
                    uib-dropdown-menu
                    role="menu"
                    aria-labelledby="single-button"
                >
                    <li
                        role="menuitem"
                        ng-click="sts.setSelectedSortTag($ctrl.context, null)"
                    >
                        <a href>All {{$ctrl.context}}</a>
                    </li>
                    <li
                        class="divider"
                        ng-show="sts.getSortTags($ctrl.context).length > 0"
                    ></li>
                    <li
                        class="dropdown-header"
                        ng-show="sts.getSortTags($ctrl.context).length > 0"
                    >
                        Sort Tags
                    </li>
                    <li
                        ng-repeat="tag in sts.getSortTags($ctrl.context)"
                        ng-click="sts.setSelectedSortTag($ctrl.context, tag)"
                        role="menuitem"
                    >
                        <a href>{{tag.name}}</a>
                    </li>
                    <li class="divider"></li>
                    <li
                        role="menuitem"
                        ng-click="sts.showEditSortTagsModal($ctrl.context)"
                    >
                        <a href>Edit sort tags</a>
                    </li>
                </ul>
            </div>
  
            `,
            controller: function($scope, sortTagsService) {
                $scope.sts = sortTagsService;
            }
        });
}());
