/**
 * @author Brian Sam Thomas <thebrainchild95@gmail.com>
 * @file Background Service Script i.e. - runs in the background
 * and works it's magic by latching onto content-scripts
 */

const netflixRegex = /(http(s)?:\/\/.)?(www\.)?(netflix.com\/watch)/;
const apvRegex = /(http(s)?:\/\/.)?(www\.)?(primevideo.com\/(gp\/video\/detail|detail))/;
const hotstarRegex = /(http(s)?:\/\/.)?(www\.)?(hotstar.com\/in\/(tv|movies))/;

/**
 * Sends a message to the content-script for specified tab
 * @param {Port} port
 * @param {Object} message
 * @param {Number} tabId
 */
const sendToContentScript = (port, message, tabId) => {
	if (port) {
		chrome.tabs.sendMessage(tabId, message);
	} else {
		console.error("PORT GONE!");
	}
};

/**
 * Fetches the incoming port and opens a
 * channel to communicate between scripts
 */
const getMessenger = contentMessenger => {
	if ((contentMessenger.name = "uvpc-b")) {
		const checkForOTTs = (tabId, changeInfo, tab) => {
			if (
				changeInfo &&
				(changeInfo.url ||
					changeInfo.audible ||
					changeInfo.status === "complete")
			) {
				let currentUrl = changeInfo.url || tab.url;
				if (currentUrl && tab.status === "complete") {
					if (currentUrl.match(netflixRegex)) {
						return sendToContentScript(
							contentMessenger,
							{
								domain: "netflix",
								audible: tab.audible,
							},
							tabId
						);
					}
					if (currentUrl.match(apvRegex)) {
						return sendToContentScript(
							contentMessenger,
							{
								domain: "primevideo",
								audible: tab.audible,
							},
							tabId
						);
					}
					if (currentUrl.match(hotstarRegex)) {
						return sendToContentScript(
							contentMessenger,
							{
								domain: "hotstar",
								audible: tab.audible,
							},
							tabId
						);
					}
				}
			}
		};
		contentMessenger.onMessage.addListener(message => {
			if (message.initiated) {
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
			chrome.tabs.onCreated.removeListener(checkForOTTs);
			chrome.tabs.onUpdated.removeListener(checkForOTTs);
			contentMessenger = null;
		});
	}
};

chrome.runtime.onConnect.addListener(getMessenger);
