// Global variable to hold messages until WebSocket is open
let messageQueue: any[] = [];
let tabIdG: number;
let songQueue: string[] = [];
console.log(songQueue);

// Initialize WebSocket connection to Streamer.bot
const ws = new WebSocket("ws://127.0.0.1:8080"); // Your Streamer.bot WebSocket URL

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

// WebSocket Event Handlers
ws.onopen = () => {
  console.log("WebSocket connection established");
  subscribeToEvents();

  // Send any queued messages once the connection is open
  flushMessageQueue();
};

ws.onmessage = (event: MessageEvent) => {
  let data = JSON.parse(event.data);
  console.log("Message from server:", data);
  if (data.data) {
    data = data.data;

    if (data.func) {
      eventHandler[data.func](data.variables ? data.variables : null);
    }
  }
};

ws.onclose = () => {
  console.log("WebSocket connection closed");
  subscribeToEvents();
};

ws.onerror = (error: Event) => {
  console.error("WebSocket error:", error);
};

// Function to subscribe to events
function subscribeToEvents() {
  ws.send(
    JSON.stringify({
      request: "Subscribe",
      id: "my-subscribe-id",
      events: {
        General: ["Custom"],
      },
    })
  );
}
function queueCrystalSend(request: any) {
  // Check WebSocket state before sending
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(request)); // Send the correctly formatted message
  } else {
    messageQueue.push(request); // Add message to queue
  }
}
// Function to flush the message queue
function flushMessageQueue() {
  while (messageQueue.length > 0) {
    const message = messageQueue.shift(); // Get the first message in the queue
    ws.send(JSON.stringify(message)); // Send the message
  }
}
// Handle title updates
function HandleTitleUpdate(request: { data: any }) {
  queueCrystalSend(request.data);
}
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
  addToQueue: function (url: string) {
    const message = {
      request: "DoAction", // The type of request
      action: {
        id: "d3f3cfe4-6352-42d5-9531-820a5143276e",
        name: "Handle Reply",
      },
      args: {
        reply: "Successfully added song to queue",
        meow: "meow",
      },
      id: "Handle Reply", // Unique ID for tracking this request
    };
    if (url) {
      queueCrystalSend(message);
      songQueue.push(url);
    }
  },

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
// Run a function in all active tabs
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

function throttle(func: Function, delay: number) {
  let isThrottled = false;
  let lastArgs: any[] | null = null;

  return function (this: any, ...args: any[]) {
    if (isThrottled) {
      // If a call happens during the throttle, store the latest arguments
      lastArgs = args;
      return;
    }

    func.apply(this, args); // Run the function immediately
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false; // Allow new calls after delay

      // If a call was queued during the throttle, run it now with the last arguments
      if (lastArgs) {
        func.apply(this, lastArgs);
        lastArgs = null; // Clear the stored arguments after executing
      }
    }, delay);
  };
}

// Handle YouTube events
async function HandleYoutubeEvents(request: { data: any[] }) {
  switch (request.data[0]) {
    case "ended":
      if (songQueue.length > 0) {
        const youtubeLink = songQueue.shift();
        runInActiveTabs((url: string) => {
          window.location.href = url;
        }, youtubeLink);
      }
      break;
    default:
      break;
  }
}
function TestFunction(data: string) {
  const message = {
    request: "DoAction", // The type of request
    action: {
      id: "4e7b1832-0f85-4811-acc8-bd7dc1767601",
    },
    args: {
      event: data,
    },
    id: "Test", // Unique ID for tracking this request
  };
  queueCrystalSend(message);
}
// Listen for messages from the content.js
chrome.runtime.onMessage.addListener(
  (
    request: { type: string; data: any },
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) => {
    switch (request.type) {
      case "youtubeEvent":
        HandleYoutubeEvents(request);
        break;
      case "titleUpdate":
        HandleTitleUpdate(request);
        break;
      case "test":
        TestFunction(request.data);
        break;
    }
  }
);

// Periodically subscribe to events
setInterval(subscribeToEvents, 20000);
