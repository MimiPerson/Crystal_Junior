import { StreamerbotClient } from "@streamerbot/client";
// Global variable to hold messages until WebSocket is open
let songQueue: string[] = [];

// Event Handlers
const eventHandler: { [key: string]: (arg?: any) => void } = {
  setVolume: function (volume: string | null) {
    runInActiveTabs((volume: string | null) => {
      if (!volume) return console.log("volume not found");
      const parsedVolume = parseFloat(volume.replace(",", "."));

      const video = document.querySelector("video") as HTMLVideoElement;
      if (video) {
        video.volume = parsedVolume;
      }
    }, volume);
  },
  // addToQueue: function (url: string) {
  //   if (url) {
  //     client.doAction("d3f3cfe4-6352-42d5-9531-820a5143276e", {
  //       reply: "Successfully added song to queue",
  //     });
  //     songQueue.push(url);
  //   }
  // },

  nextSong: function () {
    if (songQueue.length > 0) {
      console.log("playing queue");
      const youtubeLink = songQueue.shift();
      runInActiveTabs((url: string) => {
        window.location.href = url;
      }, youtubeLink);
      return;
    }
    runInActiveTabs(() => {
      const nextSongButton = document.querySelector(
        ".ytp-next-button"
      ) as HTMLButtonElement | null;
      if (nextSongButton) {
        nextSongButton.click();
        console.log("Song skipped");
      } else {
        console.log("Song not skipped");
      }
    });
  },

  songRequest: function (url: string) {
    runInActiveTabs((variables: string) => {
      console.log(variables);
      location.href = variables;
    }, url);
  },
};

// // Initialize WebSocket connection to Streamer.bot
const client = new StreamerbotClient({
  onConnect: () => {
    client.on("General.*", (event) => {
      runInActiveTabs((event: any) => {
        console.log("General event: ", event);
      }, event);
      if (event.data) {
        const data = event.data;
        if (eventHandler.hasOwnProperty(data.func)) {
          eventHandler[data.func](data.variables ? data.variables : null);
        }
      }
    });
  },
});

client.on("WebsocketClient.Close", (event) => {
  console.error("Websocket closed with error: ", event);
});

// Listen for the extension installation event
chrome.runtime.onInstalled.addListener(async () => {
  const manifest = chrome.runtime.getManifest();
  const contentScripts = manifest.content_scripts; // Get content_scripts

  // Check if content_scripts is defined and is an array
  if (Array.isArray(contentScripts)) {
    for (const cs of contentScripts) {
      const matches = cs.matches as string[]; // Ensure matches is an array of strings

      // Ensure matches is defined and not empty
      if (Array.isArray(matches) && matches.length > 0) {
        // Querying tabs based on the content script matches
        const tabs = await chrome.tabs.query({ url: matches });
        if (!tabs) return false;
        for (const tab of tabs) {
          // Properly typing the 'tab' variable
          if (tab.url?.match(/(chrome|chrome-extension):\/\//gi)) {
            continue;
          }
          if (!tab.id) return;
          const target: { tabId: number; allFrames: boolean } = {
            tabId: tab.id,
            allFrames: cs.all_frames ?? false, // Provide a default value if undefined
          };

          chrome.scripting.executeScript({
            files: cs.js ?? [], // Provide a default empty array if undefined
            target,
          });
        }
      }
    }
  } else {
    console.warn("No content scripts defined in the manifest.");
  }
});

// Run a function in all active tabs
/**
 * Executes a function in all active tabs that match the content script's matches pattern.
 *
 * @remarks
 * This function queries all active tabs that match the content script's matches pattern and executes the provided function in each tab.
 * The function can accept an optional `variables` parameter, which will be passed to the executed function.
 *
 * @param functionToRun - The function to execute in each matching tab.
 * @param variables - An optional parameter that will be passed to the executed function.
 *
 * @returns {Promise<void>} - A promise that resolves when the function completes execution in all matching tabs.
 *
 * @example
 * // Example usage
 * runInActiveTabs((variables: string) => {
 *   console.log(variables);
 *   location.href = variables;
 * }, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
 */
async function runInActiveTabs(functionToRun: Function, variables?: any) {
  const manifest = chrome.runtime.getManifest();
  const contentScripts = manifest.content_scripts; // Get content_scripts

  // Check if content_scripts is defined and is an array
  if (Array.isArray(contentScripts)) {
    for (const cs of contentScripts) {
      const matches = cs.matches as string[]; // Ensure matches is an array of strings

      // Ensure matches is defined and not empty
      if (Array.isArray(matches) && matches.length > 0) {
        // Querying tabs based on the content script matches
        const tabs = await chrome.tabs.query({ url: matches });
        if (!tabs) return false;

        for (const tab of tabs) {
          // Properly typing the 'tab' variable
          if (tab.url?.match(/(chrome|chrome-extension):\/\//gi)) {
            continue;
          }
          if (!tab.id) return;

          const target: { tabId: number; allFrames: boolean } = {
            tabId: tab.id,
            allFrames: cs.all_frames ?? false, // Provide a default value if undefined
          };

          chrome.scripting.executeScript({
            target: { tabId: target.tabId },
            func: functionToRun as (...args: any[]) => unknown,
            args: [variables ? variables : null],
          });
        }
      }
    }
  }
}

// /**
//  * Throttles a function to prevent it from being called too frequently.
//  *
//  * @param func - The function to throttle.
//  * @param delay - The delay in milliseconds to wait before calling the throttled function.
//  *
//  * @returns A throttled version of the input function.
//  *
//  * @remarks
//  * This function creates a throttled version of the input function. The throttled function will only be called once after the specified delay has passed since the last time it was invoked.
//  * If the throttled function is invoked again before the delay has elapsed, the timer will be reset, and the delay will start again.
//  *
//  * @example
//  * const throttledFunction = throttle(() => console.log("Throttled function called"), 1000);
//  * throttledFunction(); // Will be called immediately
//  * throttledFunction(); // Will not be called again until 1 second has passed
//  */
// function throttle(func: Function, delay: number) {
//   let isThrottled = false;
//   let lastArgs: any[] | null = null;

//   return function (this: any, ...args: any[]) {
//     if (isThrottled) {
//       // If a call happens during the throttle, store the latest arguments
//       lastArgs = args;
//       return;
//     }

//     func.apply(this, args); // Run the function immediately
//     isThrottled = true;

//     setTimeout(() => {
//       isThrottled = false; // Allow new calls after delay

//       // If a call was queued during the throttle, run it now with the last arguments
//       if (lastArgs) {
//         func.apply(this, lastArgs);
//         lastArgs = null; // Clear the stored arguments after executing
//       }
//     }, delay);
//   };
// }

// // Handle YouTube events
// /**
//  * Handles YouTube events received from the content script.
//  *
//  * @remarks
//  * This function listens for YouTube events such as "ended" and performs specific actions based on the received event.
//  * When the "ended" event is received, it checks if there are songs in the `songQueue` and navigates to the next song if available.
//  *
//  * @param request - The request object containing the YouTube event data.
//  * @param request.data - An array containing the YouTube event data. The first element of the array is the event type.
//  *
//  * @returns {Promise<void>} - A promise that resolves when the function completes.
//  *
//  * @example
//  * // Example usage
//  * HandleYoutubeEvents({ data: ["ended"] });
//  */
// async function HandleYoutubeEvents(request: { data: any[] }) {
//   switch (request.data[0]) {
//     case "ended":
//       if (songQueue.length > 0) {
//         const youtubeLink = songQueue.shift();
//         runInActiveTabs((url: string) => {
//           window.location.href = url;
//         }, youtubeLink);
//       }
//       break;
//   }
// }

// Listen for messages from the content.js
chrome.runtime.onMessage.addListener(
  (
    request: { type: string; data: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (request.type) {
      case "youtubeEvent":
        //HandleYoutubeEvents(request);
        break;
      case "titleUpdate":
        client.doAction("e4b9e04a-5afb-4dbb-8724-a63e9c3c6e1c", request.data);

        break;
    }
  }
);
