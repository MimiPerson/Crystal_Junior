import { StreamerbotEventPayload } from "@streamerbot/client";
import { action, doAction } from "../Streamerbot/Client";

export async function ChatMessageHandler(
  event: StreamerbotEventPayload<"Twitch.ChatMessage">
) {
  const message = event.data.message.message; // Extract the chat message content
  const user = event.data.message.username; // Extract the username of the sender
  const firstMessage = event.data.message.firstMessage; // Check if it's the user's first message
  const args = message.split(" "); // Split the message into arguments
}
