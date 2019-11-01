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
        if (message.listeningTo) {
            findVideo().then(video => {
                backgroundMessenger.postMessage({
                    badgeText: video.playbackRate,
                    video,
                });
            });
        } else {
            backgroundMessenger.disconnect();
        }
    });
    backgroundMessenger.onDisconnect.addListener(() => {
        console.error("Disconnected from backgroundMessenger");
    });
};

window.addEventListener("load", connectToServices);
