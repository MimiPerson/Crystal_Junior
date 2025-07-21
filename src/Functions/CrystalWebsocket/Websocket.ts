export const ws = new WebSocket("ws://localhost:3344");

ws.onopen = () => {
  console.log("Connected to server");
  ws.send(JSON.stringify("Hello from client"));
};

ws.onmessage = (message) => {
  console.log("Received message", JSON.parse(message.data));
};

export function wsSend(data: any) {
  if (!ws) {
    return console.log("WebSocket connection not initialized");
  }

  if (ws.readyState !== WebSocket.OPEN) {
    ws.addEventListener("open", () => {
      console.log("Crystal Websocket transfer: ", data);
      ws.send(data);
    });
  } else {
    ws.send(data);
  }
}
