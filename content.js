/**
 * @author Brian Sam Thomas <thebrainchild95@gmail.com>
 * @file Content-Script i.e. - does most of the heavy-lifting
 */

/**
 * List of playerDivs for supported OTTs.
 */
const playerDivs = {
	netflix: "div.PlayerControlsNeo__button-control-row",
	primevideo:
		"div.controlsOverlayTopRight div.topPanel div.right div.topButtons div.hideableTopButtons",
	hotstar:
		"div.controls-overlay div.bottom-panel div.controls-container div.bottom-right-panel",
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

/**
 * Based on the domain passed, deploys the UVP Controller
 * @param {string} msg
 * @param {Port} port
 */
const deployer = async (msg, port) => {
	var videoElement = await fetchVideoElement();
	if (!videoElement) return false;
	var injectedController = await injectController(msg.domain);
	if (!injectedController.success) return false;
	videoElement.onloadeddata = attachListeners(port, videoElement);
};

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

/**
 * Builds the icon for the cog controller
 * @param {String} ottName
 */
const injectController = ottName => {
	let playerDiv = document.querySelector(playerDivs[ottName]);
	if (!document.contains(playerDiv)) return false;
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
		let cogsIcon = chrome.runtime.getURL("images/cogs.svg");
		let videoControllerBtn = document.createElement("button");
		videoControllerBtn.id = "uvpc-btn";
		videoControllerBtn.style.background = "none";
		videoControllerBtn.innerHTML = `<img id="cogsIcon" src="${cogsIcon}">`;
		main.innerHTML =
			videoControllerDiv.outerHTML + videoControllerBtn.outerHTML;
		playerDiv.insertBefore(main, playerDiv.lastChild);
		if (!playerDiv.contains(main)) reject("Failed to inject the controller");
		resolve({ success: true, element: main });
	});
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
	return true;
};

/**
 * Attaches Listeners to the controller
 * @param {Port} port
 * @param {HTMLVideoElement} videoElement
 */
const attachListeners = (port, videoElement) => {
	updateBadgeText(port, videoElement);
	var done = removeDuplicateControllers();
	if (done) {
		document
			.getElementById("uvpc-btn")
			.addEventListener("click", playbackToggler);
		document
			.getElementById("uvpc-value")
			.addEventListener("input", event =>
				valueChanged(port, event, videoElement)
			);
		document.getElementById("uvpc-value").value = videoElement.playbackRate;
	}
};

/**
 * Toggles the visibility of the playback controller div
 */
const playbackToggler = () =>
	document.getElementById("uvpc-div").classList.toggle("active");

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

window.addEventListener("load", connectToServices);
