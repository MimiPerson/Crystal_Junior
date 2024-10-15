let lastVideoTitle = ""; // Variable to track the last video title
let debounceTimer: NodeJS.Timeout | null = null; // Timer for debounce
const DEBOUNCE_DELAY = 1000; // Adjust delay as needed

// Debounce function to prevent multiple triggers
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  return function (this: any, ...args: Parameters<T>) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Function to be called when a new video loads
/**
 * This function is called when a new video loads on YouTube.
 * It retrieves the video title and URL, compares it with the last video title,
 * and sends a message to the background script if the title has changed.
 *
 * @returns {void}
 */
const interval = setInterval(() => {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    clearInterval(interval);
    setEventListeners(videoElement);
  }
}, 100);

function setEventListeners(video: HTMLVideoElement) {
  // Listener for when the video ends
  video.addEventListener("ended", (event) => {
    chrome.runtime.sendMessage({
      type: "youtubeEvent",
      data: [event.type],
    });
  });

  // Additional listeners can be added here, e.g.:
  // video.addEventListener("volumechange", (event) => {
  //   const volume = parseFloat(
  //     (document.querySelector(".ytp-volume-panel") as HTMLDivElement)?.ariaValueNow ?? '0'
  //   ) / 100;
  //   chrome.runtime.sendMessage({
  //     type: "youtubeEvent",
  //     data: [event.type, volume],
  //   });
  // });
}

function onVideoLoad() {
  try {
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
          request: "DoAction",
          action: {
            id: "e4b9e04a-5afb-4dbb-8724-a63e9c3c6e1c",
            name: "UpdateYoutubeData",
          },
          args: {
            youtubeUrl: videoUrl,
            youtubeTitle: videoTitle,
          },
          id: "youtubeInfo",
        };

        // Send the message to the background script
        chrome.runtime.sendMessage({ type: "titleUpdate", data: message });
      }
    } else {
      console.warn("Video title element not found.");
    }
  } catch (error) {
    console.error("Error in onVideoLoad:", error);
  }
}

// Create a debounced version of onVideoLoad
const debouncedOnVideoLoad = debounce(onVideoLoad, DEBOUNCE_DELAY);

// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver(() => {
  try {
    // Check if any mutation is related to the childList of the video title element
    const videoTitleElement = document.querySelector(
      "yt-formatted-string.style-scope.ytd-watch-metadata"
    );

    if (videoTitleElement) {
      debouncedOnVideoLoad();
    }
  } catch (error) {
    console.error("Error in MutationObserver:", error);
  }
});

// Start observing the body for child additions
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
