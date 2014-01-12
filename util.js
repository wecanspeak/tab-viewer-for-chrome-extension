/*
 * Copyright (c) 2014 Enzo Wang. Released under MIT license, see LICENSE file.
 */

function updateInvaildFavIcon(tabs) {
    tabs.forEach(function(tab, index, array){
        if (isFavIconUrlGood(tab.favIconUrl) === false) {
            var selfFavIconUrl = chrome.extension.getURL("images/empty_page.png");
            tabs[index].favIconUrl = selfFavIconUrl;
        }
    });
}

function isFavIconUrlGood(url) {
    if (url === undefined ||
            url === "" ||
            url === "chrome://theme/IDR_EXTENSIONS_FAVICON" ||
            url === "chrome://theme/IDR_EXTENSIONS_FAVICON@2x"
       )
        return false;
    else
        return true;
}

