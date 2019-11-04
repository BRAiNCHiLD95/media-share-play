/**
 * Content Script
 * Has Access to the DOM & *some* Chrome APIs, operates within the browser tab(s).
 */

/**
 * Waits for video element to be loaded, then resolves promise with the element.
 * @returns {Promise}
 */

const fetchVideoElement = () => {
    return new Promise((resolve, reject) => {
        new MutationObserver((mutationRecords, observer) => {
            Array.from(document.querySelectorAll("video")).forEach(element => {
                resolve(element);
                observer.disconnect();
            });
        }).observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
    });
};

/**
 * Makes an Async/Await call to fetchVideoElement
 */

const findVideo = async () => {
    return await fetchVideoElement();
};

/**
 * Creates a communication channel
 * between background.js & content.js
 */
const connectToServices = () => {
    const backgroundMessenger = chrome.runtime.connect({ name: "uvpc-b" });
    backgroundMessenger.onMessage.addListener(message => {
        findVideo().then(
            video => {
                if (message.listeningTo) {
                    updateBadgeText(backgroundMessenger, video);
                }
                if (message.newSpeed) {
                    video.playbackRate = message.newSpeed;
                    updateBadgeText(backgroundMessenger, video);
                }
            },
            error => {
                console.info("No video found yet\n", error);
                backgroundMessenger.disconnect();
            });
    });
};

const updateBadgeText = (port, video) => {
    port.postMessage({
        badgeText: video.playbackRate,
        video,
    });
}

window.addEventListener("load", connectToServices);
