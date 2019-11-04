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
    chrome.webNavigation.onHistoryStateUpdated.addListener( details => {
        if (contentMessenger.name === "uvpc-b") {
            sendToContentScript(contentMessenger, { listeningTo: currentTab.id, title: currentTab.title });
        } else {
            chrome.runtime.connect({ name: "uvpc-b" });
        }
        contentMessenger.onDisconnect.addListener(() => {
            console.info("disconnected from contentMessenger");
        });
        contentMessenger.onMessage.addListener((message, sender) => {
            if (message.badgeText) {
                chrome.browserAction.setBadgeText({
                    text: message.badgeText + "x",
                    tabId: sender.sender.tab.id,
                });
                chrome.browserAction.setBadgeBackgroundColor({
                    color: "#000000",
                    tabId: sender.sender.tab.id,
                });
                contentMessenger.postMessage({
                    newSpeed: 1.5,
                });
            }
        });
    })
};

const sendToContentScript = (port, message) => {
    port.postMessage(message);
}

chrome.runtime.onStartup.addListener(() => {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (tab.status === 'complete') {
            chrome.runtime.onConnect.addListener(getMessenger);
        }
    })
});
