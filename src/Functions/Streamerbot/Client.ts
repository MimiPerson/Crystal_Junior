import { StreamerbotClient } from "@streamerbot/client";
import { clientStarted } from "./Events";

export const action = {
  message: "bcc0cc17-fb61-42b4-a4f7-f1b86ec1322a",
  timeout: "355ef523-d4bb-4e86-ab56-85da2b37d190",
  deleteMessage: "c99a9f7e-344c-48ea-81ed-c85dd9025527",
};

let actionQueue: Array<{ actionId: string; params: any }> = [];

let isConnecting = true; // Flag to track connection state
// Initialize WebSocket connection to Streamer.bot
const client = new StreamerbotClient({
  onConnect: () => {
    console.log("Connected to Streamer.bot");
    isConnecting = false;
    processActionQueue();
    clientStarted();
  },
  onDisconnect: () => {
    console.log("Disconnected from Streamer.bot");
    isConnecting = true;
  },
  onError: (error) => {
    console.error("Error:", error);
  },
});

// Override the doAction method to queue actions if the client is connecting
async function doAction(actionId: string, params: any) {
  if (isConnecting) return actionQueue.push({ actionId, params });
  try {
    client.doAction(actionId, params);
    console.log("Action executed:", actionId, params);
  } catch (error) {
    console.log("Failed to execute action:", error);
    actionQueue.push({ actionId, params }); // Re-queue the action if it fails
  }
}

// Function to process the action queue
function processActionQueue() {
  while (actionQueue.length > 0) {
    const { actionId, params } = actionQueue.shift()!;
    client.doAction(actionId, params);
  }
}

export { client, doAction };
