import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { PlaySong } from "./Functions/Youtube/SongHandler";

function unblacklistUser(
  user: string,
  setBlackList: React.Dispatch<React.SetStateAction<string[]>>
) {
  chrome.storage.local.get(["blackListedUsers"], (result) => {
    let blackListedUsers: string[] = result.blackListedUsers || [];

    blackListedUsers.splice(blackListedUsers.indexOf(user), 1);

    chrome.storage.local.set({ blackListedUsers }, () => {
      console.log(user, " Removed from blacklist");
      setBlackList(blackListedUsers);
    });
  });
}

function blackListUser(
  song: string[],
  setSongQueue: React.Dispatch<React.SetStateAction<string[][]>>,
  setBlackList: React.Dispatch<React.SetStateAction<string[]>>,
  index: number | null
) {
  chrome.storage.local.get(["blackListedUsers"], (result) => {
    let blackListedUsers: string[] = result.blackListedUsers || [];

    if (blackListedUsers.includes(song[2])) return;

    blackListedUsers.push(song[2]);

    chrome.storage.local.set({ blackListedUsers }, () => {
      console.log(`${song[2]} added to blacklist`);
      index && skipSong(index, setSongQueue);
      setBlackList(blackListedUsers);
    });
  });
}
function playNow(
  song: string[],
  index: number,
  setSongQueue: React.Dispatch<React.SetStateAction<string[][]>>
) {
  chrome.storage.local.get(["songQueue"], (result) => {
    let songQueue: string[][] = result.songQueue || [];

    songQueue.splice(index, 1);
    PlaySong(song);
    chrome.storage.local.set({ songQueue }, () => {
      console.log("song added to queue");
      setSongQueue(songQueue);
    });
  });
}
function skipSong(
  index: number,
  setSongQueue: React.Dispatch<React.SetStateAction<string[][]>>
) {
  chrome.storage.local.get(["songQueue"], (result) => {
    let songQueue = result.songQueue || [];
    songQueue.splice(index, 1);
    chrome.storage.local.set({ songQueue }, () => {
      console.log("song skipped");
      setSongQueue(songQueue);
    });
  });
}
const Popup = () => {
  const [songQueue, setSongQueue] = useState<string[][]>([]);
  const [blacklist, setBlackList] = useState<string[]>([]);
  const [activeList, setActiveList] = useState<number>(0);
  const [currentSong, setCurrentSong] = useState<string>("");
  const [requestedSong, setRequestedSong] = useState<string[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["requestedSong"], (result) => {
      setRequestedSong([
        result.requestedSong[0],
        result.requestedSong[1],
        result.requestedSong[2],
      ]);
    });
    chrome.storage.local.get(["currentSong"], (result) => {
      setCurrentSong(result.currentSong || "No song playing");
    });

    chrome.runtime.onMessage.addListener(
      (request: { type: string; data: any }) => {
        switch (request.type) {
          case "titleUpdate":
            setCurrentSong(request.data.youtubeTitle);

            chrome.storage.local.get(["requestedSong"], (result) => {
              if (result.requestedSong[0] == request.data.youtubeUrl) {
                setRequestedSong([
                  result.requestedSong[0],
                  result.requestedSong[1],
                  result.requestedSong[2],
                ]);
              } else {
                setRequestedSong(["", "", ""]);
                chrome.storage.local.set({ requestedSong: ["", "", ""] });
              }
            });

            break;
        }
      }
    );

    return () => {
      chrome.runtime.onMessage.removeListener(
        (request: { type: string; data: any }) => {
          switch (request.type) {
            case "titleUpdate":
              setCurrentSong(request.data.youtubeTitle);
              break;
          }
        }
      );
    };
  }, []);
  // Fetch the song queue when the component mounts
  useEffect(() => {
    setActiveList(1);

    chrome.storage.local.get(["songQueue"], (result) => {
      let songQueue = result.songQueue || [];
      setSongQueue(songQueue);
    });
    chrome.storage.local.get(["blackListedUsers"], (result) => {
      let blackListedUsers: string[] = result.blackListedUsers || [];

      setBlackList(blackListedUsers);
    });
  }, []);

  return (
    <div>
      <div className="songRequestBody">
        <div className="headerContainer">
          <h1>{activeList == 1 ? "Song Requests" : "Blacklisted Users"}</h1>
          <button onClick={() => setActiveList(activeList == 1 ? 0 : 1)}>
            💀
          </button>
        </div>
        <ul className={activeList == 0 ? "hidden" : ""} id="songRequestList">
          <li id="currentSong">
            <div className="stringDiv">
              <p id="currentVideoTitle" className="title">
                {currentSong}
              </p>
              {requestedSong[2] && <p id="songRequester">{requestedSong[2]}</p>}
            </div>
            <div className="buttonDiv">
              <button className="transparentButton">⛔</button>
              <button
                className="transparentButton"
                onClick={() => {
                  blackListUser(
                    ["", "", requestedSong[2]],
                    setSongQueue,
                    setBlackList,
                    null
                  );
                }}
              >
                🔕
              </button>
            </div>
          </li>
          {songQueue.map((song, index) => (
            <li key={index}>
              <div className="stringDiv">
                <p className="index">{index + 1}</p>
                <p className="title">{song[1] || "Untitled"}</p>
              </div>
              <div className="buttonDiv">
                <button
                  className="transparentButton"
                  id="playNowBtn"
                  onClick={() => playNow(song, index, setSongQueue)}
                >
                  ⏩
                </button>
                <button
                  className="transparentButton"
                  id="skipBtn"
                  onClick={() => skipSong(index, setSongQueue)}
                >
                  ⛔
                </button>

                <button
                  className="transparentButton"
                  onClick={() =>
                    blackListUser(song, setSongQueue, setBlackList, index)
                  }
                >
                  🔕
                </button>
              </div>
            </li>
          ))}
        </ul>
        <ul className={activeList == 1 ? "hidden" : ""} id="blacklistedUsers">
          {blacklist.map((user, index) => (
            <li key={index}>
              <div className="stringDiv">
                <p className="index">{index + 1}</p>
                <p className="username">{user}</p>
              </div>
              <div className="buttonDiv">
                <button
                  className="transparentButton"
                  onClick={() => unblacklistUser(user, setBlackList)}
                >
                  ✅
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
