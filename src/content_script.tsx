import { secondsToMinutes } from "./Functions/MultiUseFunctions";

let lastVideoTitle = ""; // Variable to track the last video title
let debounceTimer: ReturnType<typeof setTimeout> | null = null; // Timer for debounce
const DEBOUNCE_DELAY = 1000; // Adjust delay as needed

/**
 * Debounces a function to prevent it from being called too frequently.
 *
 * @template T - The type of the function to debounce.
 *
 * @param func - The function to debounce.
 * @param delay - The delay in milliseconds to wait before calling the debounced function.
 *
 * @returns A debounced version of the input function.
 *
 * @remarks
 * This function creates a debounced version of the input function. The debounced function will only be called once after the specified delay has passed since the last time it was invoked.
 * If the debounced function is invoked again before the delay has elapsed, the timer will be reset, and the delay will start again.
 *
 * @example
 * const debouncedFunction = debounce(() => console.log("Debounced function called"), 1000);
 * debouncedFunction(); // Will not be called immediately
 * debouncedFunction(); // Will not be called again until 1 second has passed
 */
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  return function (this: any, ...args: Parameters<T>) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

const interval = setInterval(() => {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    clearInterval(interval);
    setEventListeners(videoElement);
  }
}, 100);

/**
 * Sets event listeners for the provided video element.
 *
 * @param video - The HTMLVideoElement to attach event listeners to.
 *
 * @remarks
 * This function attaches two event listeners to the provided video element:
 * 1. An "ended" event listener that sends a message to the background script with the event type.
 * 2. A "volumechange" event listener that calculates the current volume and sends a message to the background script with the event type and volume.
 */
function setEventListeners(video: HTMLVideoElement) {
  // Listener for when the video ends
  video.addEventListener("ended", (event) => {
    try {
      chrome.runtime?.sendMessage({
        type: "youtubeEvent",
        data: [event.type],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  video.addEventListener("timeupdate", (event) => {
    chrome.runtime?.sendMessage({
      type: "youtubeTimeEvent",
      data: ["youtubeEvent", `${secondsToMinutes(video.currentTime)} / ${secondsToMinutes(video.duration)}`],
    });
  });
  video.addEventListener("play", () => {
    try {
      chrome.runtime?.sendMessage({
        type: "youtubeEvent",
        data: ["play"],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  video.addEventListener("volumechange", (event) => {
    try {
      const volumePanel = document.querySelector(".ytp-volume-panel");
      const volume = volumePanel
        ? parseFloat(volumePanel.ariaValueNow ?? "0") / 100
        : 0;

      chrome.runtime?.sendMessage({
        type: "youtubeEvent",
        data: [event.type, volume],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
}

/**
 * Handles the video load event by extracting the video title, comparing it with the last known title,
 * and sending a message to the background script if the title has changed.
 *
 * @remarks
 * This function is responsible for extracting the video title from the DOM, comparing it with the last known title,
 * and sending a message to the background script if the title has changed.
 * It also handles any errors that may occur during the process.
 */
function onVideoLoad() {
  const videoTitleElement = document.querySelector(
    "yt-formatted-string.style-scope.ytd-watch-metadata"
  ) as HTMLElement | null;
  const videoUrl = window.location.href;

  if (videoTitleElement) {
    const videoTitle = videoTitleElement.textContent?.trim() || "";

    // Check if the title has changed
    if (videoTitle !== lastVideoTitle) {
      lastVideoTitle = videoTitle; // Update the last video title
      const message = {
        youtubeUrl: videoUrl,
        youtubeTitle: videoTitle,
      };

      // Send the message to the background script

      chrome.runtime?.sendMessage({ type: "titleUpdate", data: message });
    }
  }
}

// Create a debounced version of onVideoLoad
const debouncedOnVideoLoad = debounce(onVideoLoad, DEBOUNCE_DELAY);

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver(() => {
  // Check if any mutation is related to the childList of the video title element
  const videoTitleElement = document.querySelector(
    "yt-formatted-string.style-scope.ytd-watch-metadata"
  );

  if (videoTitleElement) {
    debouncedOnVideoLoad();
  }
});

// Start observing the body for child additions
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
