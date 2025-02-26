import { runInActiveTabs } from "./Functions/MultiUseFunctions";
import { doAction } from "./Functions/Streamerbot/Client";
import { HandleYoutubeEvents } from "./Functions/Youtube/EventHandler";
import "./Functions/CrystalWebsocket/Websocket";
import { wsSend } from "./Functions/CrystalWebsocket/Websocket";

export const ws = new WebSocket("ws://localhost:3344");

ws.onopen = () => {
  console.log("Connected to server");
  ws.send(JSON.stringify("Hello from client"));
};

ws.onmessage = (message) => {
  console.log("Received message", JSON.parse(message.data));
};

// Global variable to hold messages until WebSocket is open

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

// Handle YouTube events
/**
 * Handles YouTube events received from the content script.
 *
 * @remarks
 * This function listens for YouTube events such as "ended" and performs specific actions based on the received event.
 * When the "ended" event is received, it checks if there are songs in the `songQueue` and navigates to the next song if available.
 *
 * @param request - The request object containing the YouTube event data.
 * @param request.data - An array containing the YouTube event data. The first element of the array is the event type.
 *
 * @returns {Promise<void>} - A promise that resolves when the function completes.
 *
 * @example
 * // Example usage
 * HandleYoutubeEvents({ data: ["ended"] });
 */

// Listen for messages from the content.js
chrome.runtime.onMessage.addListener(
  (
    request: { type: string; data: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (request.type) {
      case "youtubeTimeEvent":
        // console.log(request.data);
        // wsSend(JSON.stringify({ event: "youtubeTimeUpdate", data: request.data }));
        break;
      case "youtubeEvent":
        HandleYoutubeEvents(request);
        break;
      case "titleUpdate":
        chrome.storage.local.set({
          currentSong: request.data.youtubeTitle,
        });
        wsSend(
          JSON.stringify({ event: "youtubeTitleUpdate", data: request.data })
        );
        doAction("e4b9e04a-5afb-4dbb-8724-a63e9c3c6e1c", request.data);
        break;
    }
  }
);

setInterval(() => {
  runInActiveTabs(() => {});
}, 10000); // keeping the background active
