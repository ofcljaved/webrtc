import { WebSocket, WebSocketServer } from "ws";
import express from "express";

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
  [key: string]: any;
};

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    try {
      const parsedData: Message = JSON.parse(data.toString());
      handleMessage(parsedData, ws);
    } catch (e) {
      console.log("error parsing data");
      ws.send(`You send invalid data: ${data} \r\n We expet a JSON object`);
      console.error(e);
      return;
    }
  });
  ws.on("close", () => {
    removeClientfromRoom(ws);
  });
});

const rooms = new Map<string, Set<WebSocket>>();

function handleMessage(data: Message, ws: WebSocket) {
  if (data.type === "join") {
    const roomId = data.roomId;
    if (!rooms.has(roomId)) {
      rooms.set(data.roomId, new Set());
    }

    const room = rooms.get(roomId)!;
    room.add(ws);

    room.forEach((client) => {
      if (client !== ws) {
        const message = JSON.stringify({
          type: "user-connected",
        });
        client.send(message);
      }
    });
  } else if (["offer", "answer", "ice-candidate"].includes(data.type)) {
    const roomId = data.roomId;
    const room = rooms.get(roomId);

    if (room) {
      room.forEach((client) => {
        if (client !== ws) {
          const message = JSON.stringify(data);
          client.send(message);
        }
      });
    }
  } else {
    ws.send("unknown message type");
  }
}

function removeClientfromRoom(ws: WebSocket) {
  for (const [roomId, clients] of rooms.entries()) {
    if (clients.has(ws)) {
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(roomId);
      }
    }
  }
}
