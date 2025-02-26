import { saveVolume, SongEnded, SongPlaying, volumeOpen } from "./SongHandler";

export async function HandleYoutubeEvents(request: { data: any[] }) {
  switch (request.data[0]) {
    
    case "play":
      SongPlaying();
      break;
    case "ended":
      SongEnded();

      break;
    case "volumechange":
      volumeOpen && saveVolume(request.data[1]);
      break;
  }
}

// for(const listen in getEventListeners(video)) {
//   video.addEventListener(listen, (e) => {console.log(e)})
// }
