/**
 * Content Script
 * Has Access to the DOM & *some* Chrome APIs, operates within the browser tab(s).
 */

/**
 * Creates a communication channel
 * between background.js & content.js
 */
const connectToServices = () => {
    const initContent = chrome.runtime.connect({ name: "uvpc-b" });
    console.log("connecting from contentjs", initContent);
    initContent.postMessage({ initiated: true });
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        deployer(msg, initContent);
    });
};

window.addEventListener("load", connectToServices);

/**
 * Based on the domain passed, deploy the controller element onto DOM
 * @param {string} msg
 */
const deployer = (msg, port) => {
    switch (msg.domain) {
        case "netflix":
            return deployNetflix(port);
        case "primevideo":
            console.log("APV Deploy!");
        // return deployAPV(port);
        default:
            console.error("Don't really need this!");
    }
};

const deployNetflix = async port => {
    var videoElement = await fetchVideoElement();
    if (!videoElement) return false;
    updateBadgeText(port, videoElement);
    var injectedFa = await injectStyles();
    if (!injectedFa.success) return false;
    var injectedController = await injectControllerToNetflix();
    var controllers = document.querySelectorAll("#playbackController");
    if (controllers.length > 1) {
        controllers.forEach((element, index) => {
            if (index > 0) element.remove();
        });
    }
    if (!injectedController.success) return false;
    document
        .getElementById("uvpc-btn")
        .addEventListener("click", playBackToggler);
    document
        .getElementById("uvpc-value")
        .addEventListener("input", event =>
            valueChanged(port, event, videoElement)
        );
    document.getElementById("uvpc-value").value = videoElement.playbackRate;
};

/**
 * Builds the icon for the cog controller
 */
const injectControllerToNetflix = () => {
    // OTT specific
    let playerDiv = document.querySelector(
        ".PlayerControlsNeo__button-control-row"
    );
    if (!document.contains(playerDiv)) return false;
    // cog
    return new Promise((resolve, reject) => {
        let main = document.createElement("div");
        main.id = "playbackController";
        let videoControllerDiv = document.createElement("div");
        videoControllerDiv.id = "uvpc-div";
        videoControllerDiv.innerHTML = `<div class="playbackSpeeds">
                <h3 class="playback-header">Playback Rate</h3>
                <div class="range-stuff">
                    <input id="uvpc-value" type="range" name="speed" data-thumbwidth="20" step="0.25" min="0" max="4">
                    <output name="rangeVal">1</output>
                </div>
            </div>`;
        let videoControllerBtn = document.createElement("button");
        videoControllerBtn.id = "uvpc-btn";
        videoControllerBtn.style.background = "none";
        videoControllerBtn.style.border = "none";
        videoControllerBtn.style.fontSize = "inherit";
        videoControllerBtn.style.marginBottom = "8px";
        videoControllerBtn.innerHTML = '<i class="fa fa-cogs fa-4x"></fa>';
        main.innerHTML =
            videoControllerDiv.outerHTML + videoControllerBtn.outerHTML;
        playerDiv.insertBefore(main, playerDiv.lastChild);
        if (!playerDiv.contains(main))
            reject("Failed to inject the controller");
        resolve({ success: true, element: main });
    });
};

const playerDivs = {
    netflix: ".PlayerControlsNeo__button-control-row",
};

const playBackToggler = event => {
    console.log("Event fired!", event);
    document.getElementById("uvpc-div").classList.toggle("active");
};

const valueChanged = (port, event, videoElement) => {
    console.log(event);
    var controlMin = Number(event.target.min),
        controlMax = Number(event.target.max),
        controlVal = Number(event.target.value),
        range = controlMax - controlMin,
        output = event.target.nextElementSibling;
    position = ((controlVal - controlMin) / range) * 100;
    output.innerHTML = controlVal + "x";
    videoElement.playbackRate = event.target.valueAsNumber;
    updateBadgeText(port, videoElement);
};

/**
 * Builds and injects Stylesheets for font awesome 4.7.0
 * and the playback controller to the page
 */
const injectStyles = () => {
    return new Promise((resolve, reject) => {
        let headOfDoc = document.head;
        let faLink = document.createElement("link");
        faLink.id = "fa-uvpc";
        faLink.href =
            "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
        faLink.rel = "stylesheet";
        faLink.integrity =
            "sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN";
        faLink.crossOrigin = "anonymous";
        headOfDoc.appendChild(faLink);
        if (!headOfDoc.contains(faLink))
            reject("Failed to inject styles to the Page");
        resolve({ success: true, element: faLink });
    });
};

/**
 * Waits for video element to be loaded, then resolves promise with the element.
 * @returns {HTMLVideoElement}
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
 * Updates the BadgeText for the Extension
 * @param {Port} port
 * @param {HTMLVideoElement} video
 */
const updateBadgeText = (port, video) => {
    port.postMessage({
        badgeText: video.playbackRate,
        video,
    });
};
