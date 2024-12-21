'use client'
import { useWebSocket } from "@/contexts/wsContext";
import { useEffect, useRef } from "react";

export default function Home() {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const { socket, isConnected, connect } = useWebSocket();

    function ensureSocket() {
        if (!isConnected || !socket) {
            connect("ws://localhost:6969");
        }
        if (!socket) {
            throw new Error("Socket initialization failed");
        }
        return socket;
    }

    function handleJoin() {
        const safeSocket = ensureSocket();
        safeSocket.send(JSON.stringify({
            type: "join",
            roomId: "123",
        }));
    }

    function handleLeave() {
        console.log("leave");
    }

    function sendMessage() {
        console.log("send message");
    }

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.onmessage = (event) => {
            console.log("message", event.data);
            const message = JSON.parse(event.data.toString());
            console.log("message", message);
            if (message.type === "user-connected") {
                console.log("user connected");
            }
        };
    }, [socket]);
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "grid" }}>
                    <input type="text" placeholder="room id" />
                    <button onClick={handleJoin}>join</button>
                    <button onClick={handleLeave}>leave</button>
                </div>
                <div style={{ display: "grid" }}>
                    <textarea placeholder="send message" />
                    <textarea placeholder="receive message" />
                    <button onClick={sendMessage}>send</button>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", justifyItems: "center", gap: "10px" }}>
                <video
                    ref={localVideoRef}
                    autoPlay
                    style={{ width: 400, aspectRatio: 16 / 9, border: "1px solid black" }}
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    style={{ width: 400, aspectRatio: 16 / 9, border: "1px solid black" }}
                />
            </div>
        </div>
    );
}
