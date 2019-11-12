/**
 * Extension-only (Popup) Script
 * These operate within the context of the popup/extension page.
 */

const getMessenger = contentMessenger => {
	console.log(chrome);
};

window.addEventListener("load", getMessenger);
