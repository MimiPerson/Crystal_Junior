// Run a function in all active tabs

import { API_KEY } from "../config";

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
        if (!tabs) continue;

        for (const tab of tabs) {
          // Properly typing the 'tab' variable
          if (tab.url?.match(/(chrome|chrome-extension):\/\//gi)) {
            continue;
          }
          if (!tab.id) continue;

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

async function fetchVideoDetails(youtubeId: string) {
  const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${youtubeId}&key=${API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.items[0].snippet.title;
  } catch (error) {
    console.error("Error fetching video details:", error);
  }
}

function secondsToMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export { runInActiveTabs, fetchVideoDetails, secondsToMinutes };
