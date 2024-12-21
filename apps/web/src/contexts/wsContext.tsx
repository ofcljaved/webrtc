'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

interface IWSContext {
    socket: WebSocket | null;
    isConnected: boolean;
    connect: (url: string) => void;
}
const wsContext = createContext<IWSContext>({
    socket: null,
    isConnected: false,
    connect: () => { },
})

export function useWebSocket() {
    const context = useContext(wsContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WsProvider');
    }
    return context;
}

export default wsContext

export const WsProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = (url: string) => {
        if (socket) {
            console.warn('socket already exists, ignoring connect');
            return;
        }
        const ws = new WebSocket(url);
        ws.onopen = () => {
            setIsConnected(true);
        };
        ws.onclose = () => {
            setIsConnected(false);
        };
        ws.onmessage = (event) => {
            console.log('message', event.data);
        };
        ws.onerror = (event) => {
            console.error('error', event);
        };
        setSocket(ws);
    }
    useEffect(() => {
        connect("ws://localhost:6969");
    }, []);

    return (
        <wsContext.Provider value={{ socket, isConnected, connect }}>
            {children}
        </wsContext.Provider>
    )
}
