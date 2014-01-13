/*
 * Copyright (c) 2014 Enzo Wang. Released under MIT license, see LICENSE file.
 */

var KEYCODE_ENTER = 13;
var KEYCODE_ARROW_LEFT = 37;
var KEYCODE_ARROW_RIGHT = 39;
var KEYCODE_C = 99;
var KEYCODE_D = 100;
var KEYCODE_T = 84;

var trigger_key = KEYCODE_T;  // trigger popup is "ALT+T"
var tabsInfoCs; // tabs info in content script
var chexTvApp = angular.module('chexTvApp', []); // angular app object

window.addEventListener('keyup', doKeyPress, false);


chexTvApp.directive('chexTv', function(){
    return { restrict: 'E', template:
            '<input type="text" ng-model="tvQuery.title" ng-change="updateTabSearch()" ng-click="clearQuery()" ng-keyup="keyPressArrow($event)" tabindex="9999" ' +
            'placeholder="Search tabs or navigate pages" id="tvSearchVal">' +
            '<span id="tvUpdtTab" ng-click="updateTabs()"></span>' +
            '<ul class="tvTabInfos">' +
                '<li ng-repeat="tab in pagedTabs[currentPage]" class="tvTabItems" ' +
                'tabindex="10000" ng-key-listen-enter="keyPressEnter(tvTabInfos, {{tab.index}})" ' +
                'ng-key-listen-d="keyPressD(tvTabInfos, {{tab.index}})">' +
                    '<span class="tvTabIconTitle" >' +
                        '<span class="tvFavIcon" ng-click="clickToTab(tvTabInfos, tab.index)"><img src={{tab.favIconUrl}} class="tvFavIconImg"></span>' +
                        '<span class="tvTabTitle" ng-click="clickToTab(tvTabInfos, tab.index)">{{tab.title}}</span>' +
                        '<span class="tvCloseTab" ng-click="clickRmTab(tvTabInfos, tab.index)">✕</span>' +
                    '</span>' +
                '</li>' +
            '</ul>' +
            '<div class="tabPage" id="tabPager" ng-show="tvFilteredTabs.length">' +
               '<a href ng-click="prevPage()" ng-class="{leftEdgePage: currentPage == 0}" class="tvPrevPage">&lsaquo;&lsaquo;</a> ' +
               '<a ng-repeat="n in range(pagedTabs.length)" ng-class="{focusPage: n == currentPage}" ng-click="setPage()" href ng-bind="n + 1">1</a> ' +
               '<a href ng-click="nextPage()" ng-class="{rightEdgePage: currentPage == (pagedTabs.length-1)}" class="tvNextPage">&rsaquo;&rsaquo;</a>'+
            '</div>'+
            '<div ng-show="!tvFilteredTabs.length" class="tvNoTabFound">Opps, no tab found.</div>'
    };
});

chexTvApp.directive('ngKeyListenEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === KEYCODE_ENTER) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngKeyListenEnter);
                });
                event.preventDefault();
                $('#chexTvFrame').popup("hide");
            }
        });
    };
});

chexTvApp.directive('ngKeyListenD', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === KEYCODE_D) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngKeyListenD);
                });
                event.preventDefault();
            }
        });
    };
});

chexTvApp.factory('tabHandle', function() {
    var obj = new TabHandle();
    return obj;
});

chexTvApp.factory('popupHandle', function() {
    var obj = new PopupHandle();
    return obj;
});

chexTvApp.controller('TabViewerCtrl', function($scope, $filter, tabHandle, popupHandle) {
    $scope.tvQuery = {};
    $scope.tvTabInfos = [];
    $scope.pagedTabs = [];
    $scope.tabsPerPage = 10;
    $scope.currentPage = 0;

    $scope.updateTabs = function() {
        updateInvaildFavIcon(tabsInfoCs);
        $scope.tvTabInfos = tabsInfoCs;
        $scope.tvFilteredTabs = $filter('filter')($scope.tvTabInfos, $scope.tvQuery);
        $scope.updatePagedTabs();
    };

    $scope.updateTabSearch = function() {
        $scope.tvFilteredTabs = $filter('filter')($scope.tvTabInfos, $scope.tvQuery);
        $scope.currentPage = 0;
        $scope.updatePagedTabs();
    };

    $scope.updatePagedTabs = function () {
        $scope.pagedTabs = [];
        for (var i = 0; i < $scope.tvFilteredTabs.length; i++) {
            if (i % $scope.tabsPerPage === 0) {
                $scope.pagedTabs[Math.floor(i / $scope.tabsPerPage)] = [ $scope.tvFilteredTabs[i] ];
            } else {
                $scope.pagedTabs[Math.floor(i / $scope.tabsPerPage)].push($scope.tvFilteredTabs[i]);
            }
        }
    };

    $scope.range = function (start, end) {
        var ret = [];
        if (!end) {
            end = start;
            start = 0;
        }
        for (var i = start; i < end; i++) {
            ret.push(i);
        }
        return ret;
    };

    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };

    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pagedTabs.length - 1) {
            $scope.currentPage++;
        }
    };

    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };

    $scope.clearQuery = function() {
        $scope.tvQuery = {};
        $scope.updateTabSearch();
    };

    $scope.keyPressEnter = function(arrTabInfos, index) {
        tabHandle.gotoTab(arrTabInfos[index].id,arrTabInfos[index].windowId);
        popupHandle.hide();
    };

    $scope.keyPressD = function(arrTabInfos, index) {
        tabHandle.remove(arrTabInfos[index].id);
        arrTabInfos.splice(index,1);
    };

    $scope.clickToTab = function(arrTabInfos, index) {
        tabHandle.gotoTab(arrTabInfos[index].id,arrTabInfos[index].windowId);
        popupHandle.hide();
    };

    $scope.clickRmTab = function(arrTabInfos, index) {
        tabHandle.remove(arrTabInfos[index].id);
        arrTabInfos.splice(index,1);
        popupHandle.show();
    };

    $scope.keyPressArrow = function(event) {
        if(event.which === KEYCODE_ARROW_LEFT) {
            $scope.prevPage();
        }
        if(event.which === KEYCODE_ARROW_RIGHT) {
            $scope.nextPage();
        }
    };
});

// let angularjs can see chrome-extension img src
chexTvApp.config(['$compileProvider', function($compileProvider) {
      var oldWhiteList = $compileProvider.imgSrcSanitizationWhitelist();
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|chrome-extension):|data:image\//);
}]);

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.action == "[From bg] your tabs info need update") {
        tabsInfoCs = request.tabsInfoUpdt;
        $('#tvUpdtTab').trigger("click");
    }
});

function TabHandle() {
    TabHandle.prototype.gotoTab = function(tabid, winid) {
        chrome.runtime.sendMessage(
                {action: "[From cs] go to tab", tabId: tabid, winId: winid},
                 function(response) {});
    };
    TabHandle.prototype.remove = function(tabid) {
        chrome.runtime.sendMessage(
                {action: "[From cs] remove tab with tab id", tabId: tabid},
                 function(response) {});
    };
}

function PopupHandle() {
    PopupHandle.prototype.show = function () {
        $('#chexTvFrame').popup("show");
    };

    PopupHandle.prototype.hide = function () {
        $('#chexTvFrame').popup("hide");
    };
}

function injectNgApp() {
    if (document.getElementById("chexTvFrame") === null) {
        var el,html;
        el=document.createElement("div");
        el.className="tvCssReset";
        html = '<div class="tvCssReset">';
        html += '<div ng-app="chexTvApp" id="chexTvFrame" ng-csp>';
        html += '<chex-tv ng-controller="TabViewerCtrl">';
        html += '</chex-tv>';
        html += '</div>';
        html += '</div>';
        el.innerHTML=html;
        document.body.appendChild(el);
        ngBootstrap();
    }
}

function ngBootstrap()  {
    angular.bootstrap(document.getElementById("chexTvFrame"), ['chexTvApp']);
}

function doKeyPress(e) {
    if (e.keyCode == trigger_key && e.altKey) {
        injectNgApp();

        /* clear query text */
        $('#tvSearchVal').trigger("click");

        chrome.runtime.sendMessage({action: "[From cs] give me tabs info"}, function(response) {
            if (response.tabInfo === null) {
                alert("tab info is null");
            }
            if (response.tabInfo.length === 0) {
                alert("tab info is empty");
            }
            /* workaround: sometimes tab info is undefined */
            if (response.tabInfo !== undefined) {
                tabsInfoCs = response.tabInfo;
                $('#tvUpdtTab').trigger("click");
            } else {
                //alert("tab info is undefined");
            }
        });
        $('#chexTvFrame').popup( {vertical: "top",// blur: false,
            opacity: 0.5, "autozindex": true,  // set highest z-index
            //onclose: function() {}});
            onopen: function() {
                $('#tvSearchVal').focus();
                $('#tvUpdtTab').trigger("click");
            }});
        $('#chexTvFrame').popup("show");
        $('#tvSearchVal').trigger("focus");
    }
}

