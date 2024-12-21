import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import { parse } from "path";
const PORT = 6969;
const app = express();
const server = app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Health check",
  });
});

const wss = new WebSocketServer({ server: server });

type Message = {
  type: string;
  roomId: string;
};
wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    try {
      const parsedData: Message = JSON.parse(data.toString());
      console.log("received data", parsedData);
      handleMessage(parsedData, ws);
    } catch (e) {
      console.log("error parsing data");
      ws.send(`You send invalid data: ${data} \r\n We expet a JSON object`);
      console.error(e);
      return;
    }
  });
});

const rooms = new Map<string, WebSocket[]>();

function handleMessage(data: Message, ws: WebSocket) {
  if (data.type === "join") {
    console.log("roomId", data.roomId);
    if (!rooms.has(data.roomId)) {
      rooms.set(data.roomId, []);
    }
    const room = rooms.get(data.roomId);
    if (room) {
      room.push(ws);
      wss.clients.forEach((client) => {
        if (client !== ws) {
          const message = JSON.stringify({
            type: "user-connected"
          });
          client.send(message);
        }
      });
    } else {
      ws.send("room not found");
    }
  } else {
    console.log("unknown message type", data.type);
    ws.send("unknown message type");
  }
}
