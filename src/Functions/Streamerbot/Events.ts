import { fetchVideoDetails } from "../MultiUseFunctions";
import { ChatMessageHandler } from "../Twitch/ChatHandlers";
import { SongRequestRedeem } from "../Youtube/SongHandler";
import { action, client, doAction } from "./Client";
import { eventHandler } from "./EventHandler";

/**
 *
 * @param input Youtube URL
 * @returns Youtube ID string
 */
function extractYouTubeId(input: string) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = input.match(regex);
  return match ? match[1] : null;
}
/**
 * Initializes the client and sets up event listeners for various events.
 *
 * @remarks
 * This function sets up event listeners for general events and Twitch reward redemptions.
 * It ensures that the client is properly connected and handles incoming events accordingly.
 */
export function clientStarted() {
  // Listen for all general events
  client.on("General.*", (event) => {
    console.log("General event received:", event);
    if (event.data) {
      const data = event.data;
      // Call the corresponding event handler function with the event variables
      eventHandler[data.func](data.variables ? data.variables : null);
    }
  });

  client.on("Twitch.ChatMessage", async (event) => {
    ChatMessageHandler(event);
  });

  let timeoutId: string | null = "";
  // Listen for Twitch reward redemptions
  client.on("Twitch.RewardRedemption", async (event) => {
    console.log("Twitch reward redemption received:", event);
    // Handle specific reward titles
    switch (event.data.reward.title) {
      case "Song Request":
        const youtubeId = extractYouTubeId(event.data.user_input);
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
        console.log("Song request received:", event.data.user_input, title);
        SongRequestRedeem(
          `https://www.youtube.com/watch?v=${youtubeId}`,
          title,
          event.data.user_login
        );

        break;
      default:
        console.log("Unhandled reward title:", event.data.reward.title);
    }
  });
}
