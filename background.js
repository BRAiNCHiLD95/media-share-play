/**
 * Background Services
 * These have access to all Chrome APIs & operate in an isolated environment
 */

/**
 * Fetches the incoming port and opens a
 * channel to communicate between scripts
 */
const getMessenger = contentMessenger => {
    if ((contentMessenger.name = "uvpc-b")) {
        const checkForOTTs = (tabId, changeInfo, tab) => {
            if (changeInfo.url || changeInfo.audible || changeInfo.status === "complete") {
                let currentUrl = changeInfo.url || tab.url;
                if (currentUrl && tab.status === "complete") {
                    if (currentUrl.match(netflixRegex)) {
                        sendToContentScript(contentMessenger, {
                            domain: "netflix",
                            audible: tab.audible,
                        }, tabId);
                        return;
                    }
                    if (currentUrl.match(apvRegex)) {
                        sendToContentScript(contentMessenger, {
                            domain: "primevideo",
                            audible: tab.audible,
                        }, tabId);
                        return;
                    }
                }
            }
        };
        contentMessenger.onMessage.addListener(message => {
            console.log(message);
            if (message.initiated) {
                console.log(`connected to ${contentMessenger.sender.tab.title}`);
                chrome.tabs.onCreated.addListener(checkForOTTs);
                chrome.tabs.onUpdated.addListener(checkForOTTs);
            }
            if (message.badgeText) {
                chrome.browserAction.setBadgeText({
                    text: message.badgeText + "x",
                    tabId: contentMessenger.sender.tab.id,
                });
                chrome.browserAction.setBadgeBackgroundColor({
                    color: "#000000",
                    tabId: contentMessenger.sender.tab.id,
                });
            }
        });
        contentMessenger.onDisconnect.addListener(() => {
            console.info("disconnected from backgroundjs");
            chrome.tabs.onCreated.removeListener(checkForOTTs);
            chrome.tabs.onUpdated.removeListener(checkForOTTs);
            contentMessenger = null;
        });
    }
};

const sendToContentScript = (port, message, tabId) => {
    if (port) {
        console.log(`SENDING ${JSON.stringify(message, null, 2)} to Tab #${tabId}`);
        chrome.tabs.sendMessage(tabId, message);
    } else {
        console.log("PORT GONE!");
    }
};

const netflixRegex = /(http(s)?:\/\/.)?(www\.)?(netflix.com\/watch)/;
const apvRegex = /(http(s)?:\/\/.)?(www\.)?(primevideo.com\/detail)/;

chrome.runtime.onConnect.addListener(getMessenger);
