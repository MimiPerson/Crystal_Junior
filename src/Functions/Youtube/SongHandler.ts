import { runInActiveTabs } from "../MultiUseFunctions";
import { doAction } from "../Streamerbot/Client";

let songRequest: string | null;
// chrome.storage.local.set({ songQueue: ["song1", "song2", "song3"] }, () => {
//   console.log("Song queue saved!");
// });
// Exported Variables
let savedVolume: number | null = null;
export let volumeOpen: boolean = true;
function saveVolume(volume: number) {
  savedVolume = volume;
}
/**
 * Handles the redemption of a song request.
 *
 * @param event - The event object containing the song request details.
 */
function SongRequestRedeem(
  song: string,
  title: string = "none",
  user_login: string = ""
) {
  if (songRequest == song) return;
  console.log("Song request received:", title);

  songRequest = song;
  QueueSong(song, title, user_login);
}



function SongPlaying() {
  volumeOpen = false;
  // const playSpam = setInterval(() => {
  //   UpdateVolume(savedVolume);
  // }, 200);
  // setTimeout(() => {
  //   volumeOpen = true;
  //   clearInterval(playSpam);
  // }, 3000);
}

/**
 * Adds a song to the queue if the user is not blacklisted.
 *
 * @param songUrl - The URL of the song to be queued.
 * @param title - The title of the song. Defaults to "none".
 * @param user_login - The login name of the user adding the song. Defaults to "none".
 *
 * This function checks if the user is blacklisted. If the user is blacklisted,
 * it triggers an action with a message indicating the user is blacklisted.
 * If the user is not blacklisted, it retrieves the current song queue from
 * local storage, adds the new song to the queue, and updates the local storage
 * with the new queue. It also triggers an action with a message indicating
 * the song has been added to the queue.
 */
function QueueSong(
  songUrl: string,
  title: string = "none",
  user_login: string = "none"
) {
  chrome.storage.local.get(["blackListedUsers"], (result) => {
    let blackListedUsers: string[] = result.blackListedUsers || [];
    console.log(blackListedUsers);
    if (blackListedUsers.includes(user_login)) {
      doAction("bcc0cc17-fb61-42b4-a4f7-f1b86ec1322a", {
        message: `${user_login} is blacklisted`,
      });
      return;
    }
    chrome.storage.local.get(["songQueue"], (result) => {
      let songQueue = result.songQueue || [];
      songQueue.push([songUrl, title, user_login]);
      chrome.storage.local.set({ songQueue }, () => {
        console.log("Song added to queue: ", songUrl);
        doAction("bcc0cc17-fb61-42b4-a4f7-f1b86ec1322a", {
          message: `Song added to queue: ${title}`,
        });
      });
    });
  });
}

/**
 * Handles the end of a song.
 *
 * @remarks
 * This function checks if there are more songs in the queue and plays the next song if available.
 */
function SongEnded() {
  chrome.storage.local.get(["songQueue"], (result) => {
    let songQueue = result.songQueue || [];

    if (songQueue.length > 0) {
      const youtubeLink = songQueue.shift();
      if (youtubeLink == undefined) return;
      PlaySong(youtubeLink);
      chrome.storage.local.set({ songQueue }, () => {
        console.log("song shifted out");
      });
    }
  });
}

/**
 * Plays a specified song.
 *
 * @param song - The URL of the song to be played.
 */
function PlaySong(song: string[]) {
  console.log("playing song: ", song);
  chrome.storage.local.set({ requestedSong: song });
  runInActiveTabs((variables: string) => {
    window.location.href = variables;
  }, song[0]);
}

/**
 * Skips the current song and plays the next song in the queue.
 *
 * @remarks
 * If there are no more songs in the queue, it attempts to click the "next song" button on YouTube.
 */
function SkipSong() {
  chrome.storage.local.get(["songQueue"], (result) => {
    let songQueue = result.songQueue || [];
    if (songQueue.length > 0) {
      console.log("playing queue");
      const youtubeLink = songQueue.shift();
      if (youtubeLink == undefined) return;

      PlaySong(youtubeLink);

      chrome.storage.local.set({ songQueue }, () => {
        console.log("Song added to the queue.");
      });
      return;
    }
  });
  runInActiveTabs(() => {
    const nextSongButton = document.querySelector(
      ".ytp-next-button"
    ) as HTMLButtonElement | null;
    if (nextSongButton) {
      nextSongButton.click();
      console.log("Song skipped");
    }
  });
}

/**
 * Updates the volume of the currently playing video.
 *
 * @param volume - The new volume level to be set.
 */
function UpdateVolume(volume: any) {
  console.log("updating volume: ", volume);

  if (!volume) return console.log("volume not found");
  const parsedVolume = parseFloat(`${volume}`.replace(",", "."));

  saveVolume(parsedVolume);
  runInActiveTabs((volume: number) => {
    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      video.volume = volume;
    }
  }, parsedVolume);
}

// Exporting functions and variables for use in other modules
export {
  SongRequestRedeem,
  PlaySong,
  SongEnded,
  SkipSong,
  UpdateVolume,
  QueueSong,
  SongPlaying,
  saveVolume,
  songRequest,
 
};
