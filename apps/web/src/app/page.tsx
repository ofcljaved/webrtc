'use client'
import { useWebSocket } from "@/contexts/wsContext";
import { useEffect, useRef } from "react";

const ROOM_ID = "123";

export default function Home() {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStream = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

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

    async function createAndSendOffer() {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection) return;
        const safeSocket = ensureSocket();

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        safeSocket.send(JSON.stringify({
            type: "offer",
            offer,
            roomId: ROOM_ID,
        }));
    }

    function handleJoin() {
        const safeSocket = ensureSocket();
        safeSocket.send(JSON.stringify({ type: "join", roomId: ROOM_ID }));

        const peerConnection = new RTCPeerConnection({
            iceServers: [{
                urls: "stun:stun.l.google.com:19302"
            }]
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                safeSocket.send(
                    JSON.stringify({
                        type: "ice-candidate",
                        candidate: event.candidate,
                        roomId: ROOM_ID,
                    })
                );
            }
        };

        peerConnection.ontrack = (event) => {
            const remoteVideo = remoteVideoRef.current;
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0] || null;
            }
        };

        localStream.current?.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream.current!);
        });

        peerConnectionRef.current = peerConnection;
        createAndSendOffer();
    }

    function handleLeave() {
        console.log("leave");
    }

    function sendMessage() {
        console.log("send message");
    }

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) return;

            if (message.type === "offer") {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(message.offer)
                );
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);

                socket.send(
                    JSON.stringify({
                        type: "answer",
                        answer,
                        roomId: ROOM_ID,
                    })
                );
            }
            else if (message.type === "answer") {
                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(message.answer)
                );
            }
            else if (message.type === "ice-candidate") {
                try {
                    await peerConnection.addIceCandidate(
                        new RTCIceCandidate(message.candidate)
                    );
                } catch (e) {
                    console.error("error adding ice candidate", e);
                }
            }
            else if (message.type === "user-connected") {
                console.log("user connected");
            }
        };
    }, [socket]);

    function addStreamToVideo(video: HTMLVideoElement, stream: MediaStream) {
        localStream.current = stream;
        video.srcObject = stream;
    }

    useEffect(() => {
        if (!localVideoRef.current) {
            return;
        }
        window.navigator.mediaDevices
            .getUserMedia({ video: true, audio: true, })
            .then((stream) => {
                addStreamToVideo(localVideoRef.current!, stream);
            }).catch((err) => {
                console.error("error", err);
            })
    }, []);

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
                    autoPlay={true}
                    muted={true}
                    style={{
                        width: 400,
                        aspectRatio: 16 / 9,
                        border: "1px solid black",
                        transform: "scaleX(-1)",
                    }}
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
