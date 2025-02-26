import {
  PlaySong,
  QueueSong,
  SkipSong,
  songRequest,
  UpdateVolume,
} from "../Youtube/SongHandler";
// Event Handlers
const eventHandler: { [key: string]: (arg?: any) => void } = {
  setVolume: function (volume: string | null = "0") {
    console.log("eventHandler: \n Volume: ", volume);
    UpdateVolume(volume);
  },

  queueSong: function () {
    songRequest && QueueSong(songRequest);
    console.log("Song queue received:", songRequest);
  },

  nextSong: function () {
    SkipSong();
  },

  // songRequest: () => {
  //   console.log("Song request received:", songRequest);
  //   songRequest && PlaySong(songRequest);
  // },
};

export { eventHandler };
