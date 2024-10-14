// Global variable to hold messages until WebSocket is open
let messageQueue = [];
let tabIdG;
// Listen for the extension installation event
chrome.runtime.onInstalled.addListener(async () => {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = { tabId: tab.id, allFrames: cs.all_frames };

      chrome.scripting.executeScript({
        files: cs.js,
        injectImmediately: cs.run_at === "document_start",
        world: cs.world, // requires Chrome 111+
        target,
      });
    }
  }
});

// Initialize WebSocket connection to Streamer.bot
const ws = new WebSocket("ws://127.0.0.1:8080"); // Your Streamer.bot WebSocket URL

const eventHandler = {
  nextSong: function () {
    runInActiveTabs(() => {
      const nextSongButton = document.querySelector(".ytp-next-button");
      if (nextSongButton) {
        nextSongButton.click();
        console.log("Song skipped");
      } else {
        console.log("Song not skipped");
      }
    });
  },
  songRequest: function (url) {
    runInActiveTabs((variables) => {
      console.log(variables);
      location.href = variables;
    }, url);
  },
};

ws.onopen = () => {
  console.log("WebSocket connection established");
  ws.send(
    JSON.stringify({
      request: "Subscribe",
      id: "my-subscribe-id",
      events: {
        General: ["Custom"],
      },
    })
  );
  // Send any queued messages once the connection is open
  while (messageQueue.length > 0) {
    const message = messageQueue.shift(); // Get the first message in the queue
    ws.send(JSON.stringify(message)); // Send the message
  }
};

ws.onmessage = (event) => {
  let data = JSON.parse(event.data);
  console.log("Message from server:", data);
  if (data.data) {
    data = data.data;

    eventHandler[data.func](data.variables ? data.variables : null);
  }
};
ws.onclose = () => {
  console.log("WebSocket connection closed");
  ws.send(
    JSON.stringify({
      request: "Subscribe",
      id: "my-subscribe-id",
      events: {
        General: ["Custom"],
      },
    })
  );
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};
async function runInActiveTabs(functionToRun, variables) {
  for (const cs of chrome.runtime.getManifest().content_scripts) {
    for (const tab of await chrome.tabs.query({ url: cs.matches })) {
      if (tab.url.match(/(chrome|chrome-extension):\/\//gi)) {
        continue;
      }
      const target = { tabId: tab.id, allFrames: cs.all_frames };
      console.log(target);

      chrome.scripting.executeScript({
        target: { tabId: target.tabId },
        function: functionToRun,
        args: [variables ? variables : null],
      });
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "sendMessage") {
    // Check WebSocket state before sending
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          request: "Subscribe",
          id: "my-subscribe-id",
          events: {
            General: ["Custom"],
          },
        })
      );
      ws.send(JSON.stringify(request.data)); // Send the correctly formatted message
    } else {
      console.warn("WebSocket is not open. Queuing message.");
      messageQueue.push(request.data); // Add message to queue
      messageQueue.push({
        request: "Subscribe",
        id: "my-subscribe-id",
        events: {
          General: ["Custom"],
        },
      });
    }
  }
});
