/**
 * Extension-only (Popup) Script
 * This operates ONLY within the context of the popup/extension page.
 * But can communicate with the content/background script.
 */

const getMessenger = contentMessenger => {
	console.log(chrome);
};

window.addEventListener("load", getMessenger);
