import { useEffect, useRef, useState } from "react";
import { createWebSocket } from "@/lib/api";

interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

export function useWebSocket(sessionId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!sessionId) return;

    // Create WebSocket connection
    const ws = createWebSocket(sessionId);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (event) => {
      setError("WebSocket connection error");
      console.error("WebSocket error:", event);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handler = messageHandlersRef.current.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]);

  const send = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open");
    }
  };

  const on = (messageType: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(messageType, handler);
  };

  const off = (messageType: string) => {
    messageHandlersRef.current.delete(messageType);
  };

  const close = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return {
    isConnected,
    error,
    send,
    on,
    off,
    close,
  };
}
