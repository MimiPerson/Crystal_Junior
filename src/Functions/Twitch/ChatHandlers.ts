import { StreamerbotEventPayload } from "@streamerbot/client";
import { action, doAction } from "../Streamerbot/Client";
import { extractYouTubeId } from "../Streamerbot/Events";
import { fetchVideoDetails } from "../MultiUseFunctions";
import { SongRequestRedeem } from "../Youtube/SongHandler";

export async function ChatMessageHandler(
  event: StreamerbotEventPayload<"Twitch.ChatMessage">
) {
  const message = event.data.message.message; // Extract the chat message content
  const user = event.data.message.username; // Extract the username of the sender
  const firstMessage = event.data.message.firstMessage; // Check if it's the user's first message
  const args = message.split(" "); // Split the message into arguments

  if (message[0] == "!")
    return handleCommand(message, user, firstMessage, args);
}

function handleCommand(
  message: string,
  user: string,
  firstMessage: boolean,
  args: string[]
) {
  const command = message.slice(1); // Remove the '!' prefix to get the command
  const commandName = command.split(" ")[0]; // Extract the command name
  const commandArgs = args.slice(1); // Get the arguments for the command

  switch (commandName) {
    case "sr":
      songRequest(commandArgs[0], user);
  }
}
let timeoutId: string | null = "";
async function songRequest(url: string, user: string) {
  const youtubeId = extractYouTubeId(url);
  if (timeoutId === youtubeId) return;
  timeoutId = youtubeId;
  if (youtubeId == null) {
    doAction("bcc0cc17-fb61-42b4-a4f7-f1b86ec1322a", {
      message: `Please enter a Youtube.com URL for song requests`,
    });
    return;
  }
  let title = await fetchVideoDetails(youtubeId);
  // Call the SongRequestRedeem function for "Song Request" rewards
  console.log("Song request received:", url, title);
  SongRequestRedeem(
    `https://www.youtube.com/watch?v=${youtubeId}`,
    title,
    user
  );
}
