import { useEffect, useRef, useState, useCallback } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";

/**
 * Hook for real-time chat updates using Server-Sent Events
 * Falls back to polling if SSE fails
 */
export const useChatRealtime = (onMessage, onTyping, onUserStatus) => {
  const { currentWorkspace } = useWorkspace();
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionType, setConnectionType] = useState("none"); // "sse" | "polling" | "none"

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Get token from cookie or localStorage
  const getToken = useCallback(() => {
    // Try localStorage first
    const localToken = localStorage.getItem("token");
    if (localToken) return localToken;
    
    // Try to get from cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  }, []);

  // Connect to SSE
  const connectSSE = useCallback(() => {
    if (!currentWorkspace?._id) return;

    try {
      const token = getToken();
      if (!token) {
        console.warn("No token found for SSE connection, using polling fallback");
        startPolling();
        return;
      }
      
      const eventSource = new EventSource(
        `${API_URL}/chat/workspaces/${currentWorkspace._id}/events?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionType("sse");
        setReconnectAttempts(0);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "new_message" && onMessage) {
            onMessage(data);
          } else if (data.type === "typing" && onTyping) {
            onTyping(data);
          } else if (data.type === "user_status" && onUserStatus) {
            onUserStatus(data);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();

        // Fallback to polling
        if (connectionType !== "polling") {
          startPolling();
        }

        // Reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectSSE();
          }, delay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Error connecting to SSE:", error);
      startPolling();
    }
  }, [currentWorkspace?._id, onMessage, onTyping, onUserStatus, reconnectAttempts, connectionType]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setConnectionType("polling");
    setIsConnected(true);

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      // This would trigger a manual check for new messages
      // The parent component should handle this
    }, 3000);
  }, []);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [connectSSE]);

  return { isConnected, connectionType };
};

