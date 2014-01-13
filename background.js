/*
 * Copyright (c) 2014 Enzo Wang. Released under MIT license, see LICENSE file.
 */

var tabsInfo;

(function resgisterTabInfoUpdate() {
    chrome.tabs.onCreated.addListener(updateTabInfo);
    chrome.tabs.onRemoved.addListener(updateTabInfo);
    chrome.tabs.onUpdated.addListener(updateTabInfo);
    chrome.tabs.onReplaced.addListener(updateTabInfo);
    chrome.tabs.onDetached.addListener(updateTabInfo);
    chrome.tabs.onMoved.addListener(updateTabInfo);
}).call(this);

function updateTabInfo() {
    chrome.tabs.query({}, function(tabs) {
        tabNotify(tabs);
        /* show tab counts on app logo */
        var tabCnt = tabs.length;
        var tabCntShow;
        if (tabCnt > 99) {
            tabCntShow = "99+";
        } else {
            tabCntShow = tabCnt.toString();
        }
        chrome.browserAction.setBadgeText({text: tabCntShow});
    });
}

function tabNotify(tabs) {
    tabsInfo = tabs;
    tabs.forEach(function(tab, index, array){
        chrome.tabs.sendMessage(
            tab.id,
            {action: "[From bg] your tabs info need update", tabsInfoUpdt: tabsInfo},
            function(response) {});
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "[From cs] give me tabs info") {
        sendResponse({tabInfo: tabsInfo});
    }
    if (request.action == "[From cs] remove tab with tab id") {
        chrome.tabs.remove(request.tabId);
    }
    if (request.action == "[From cs] go to tab") {
        chrome.tabs.update(request.tabId, {active:true}, function(tab){});
        chrome.windows.update(request.winId, {focused:true});
    }
});


