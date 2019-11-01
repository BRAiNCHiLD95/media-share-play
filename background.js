/**
 * Background Services
 * These have access to all Chrome APIs & operate in an isolated environment
 */

/**
 * Fetches the incoming port and opens a
 * channel to communicate between scripts
 */
const getMessenger = contentMessenger => {
    let currentTab = contentMessenger.sender.tab;
    if (contentMessenger.name === "uvpc-b") {
        contentMessenger.postMessage({
            listeningTo: currentTab.id,
            title: currentTab.title,
        });
    }
    contentMessenger.onDisconnect.addListener(() => {
        console.error("disconnected from contentMessenger");
    });
    contentMessenger.onMessage.addListener( (message, sender) => {
        if (message.badgeText) {
            chrome.browserAction.setBadgeText({ text: message.badgeText+"x", tabId : sender.sender.tab.id })
        }
    })
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.audible) {
        chrome.runtime.onConnect.addListener(getMessenger);
    }
});
