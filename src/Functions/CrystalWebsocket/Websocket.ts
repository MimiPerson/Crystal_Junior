import { ws } from "../../background";

export function wsSend(data: any) {
  if (!ws) {
    return console.log("WebSocket connection not initialized");
  }

  if (ws.readyState !== 1) {
    ws.addEventListener("open", () => {
      console.log("Crystal Websocket transfer: ", data);
      ws.send(JSON.stringify(data));
    });
  } else {
    ws.send(JSON.stringify(data));
  }
}
