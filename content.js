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
 * @param {Port} port
 */
const deployer = async (msg, port) => {
	var videoElement = await fetchVideoElement();
	if (!videoElement) return false;
	updateBadgeText(port, videoElement);
	var injectedFa = await injectStyles();
	if (!injectedFa.success) return false;
	switch (msg.domain) {
		case "netflix":
			return deployNetflix(port, videoElement);
		case "primevideo":
			return deployAPV(port, videoElement);
		default:
			console.error("Don't really need this!");
	}
};

/**
 * Deploys the UVP Controller for Amazon Prime Video
 * @param {Port} port
 * @param {HTMLVideoElement} videoElement
 */
const deployAPV = async (port, videoElement) => {
	var injectedController = await injectController("primevideo");
	if (!injectedController.success) return false;
    videoElement.onloadeddata = attachListeners(port, videoElement);
};

/**
 * Attaches Listeners to the controller
 * @param {Port} port
 * @param {HTMLVideoElement} videoElement
 */
const attachListeners = (port, videoElement) => {
    removeDuplicateControllers();
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
 * Deploys the UVP Controller for Netflix
 * @param {Port} port
 * @param {HTMLVideoElement} videoElement
 */
const deployNetflix = async (port, videoElement) => {
	var injectedController = await injectController("netflix");
	if (!injectedController.success) return false;
	videoElement.onloadeddata = attachListeners(port, videoElement);
};


/**
 * If something goes wrong and multiple controllers are injected,
 * this function will remove duplicate controllers.
 */
const removeDuplicateControllers = () => {
	var controllers = document.querySelectorAll("#playbackController");
	if (controllers.length > 1) {
		controllers.forEach((element, index) => {
			if (index > 0) element.remove();
		});
	}
};

/**
 * Builds the icon for the cog controller
 * @param {String} ottName
 */
const injectController = ottName => {
	// OTT specific
	let playerDiv = document.querySelector(playerDivs[ottName]);
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
                    <output name="rangeVal">1x</output>
                </div>
            </div>`;
		let videoControllerBtn = document.createElement("button");
		videoControllerBtn.id = "uvpc-btn";
		videoControllerBtn.style.background = "none";
		videoControllerBtn.innerHTML = '<i class="fa fa-cogs"></fa>';
		main.innerHTML =
			videoControllerDiv.outerHTML + videoControllerBtn.outerHTML;
		playerDiv.insertBefore(main, playerDiv.lastChild);
		if (!playerDiv.contains(main)) reject("Failed to inject the controller");
		resolve({ success: true, element: main });
	});
};

/**
 * List of playerDivs from different supported OTTs.
 */
const playerDivs = {
	netflix: ".PlayerControlsNeo__button-control-row",
	primevideo: ".controlsOverlayTopRight .topPanel .right .topButtons .hideableTopButtons",
};

const playBackToggler = event => {
	document.getElementById("uvpc-div").classList.toggle("active");
};

/**
 * When the playbackRate is changed, the output value
 * and the badgeText is updated to reflect the change.
 * @param {Port} port
 * @param {Event} event
 * @param {HTMLVideoElement} videoElement
 */
const valueChanged = (port, event, videoElement) => {
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
                if (element.currentSrc !== "") resolve(element);
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
