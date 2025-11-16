import { useEffect, useRef, useState, useCallback } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook for real-time chat updates using Server-Sent Events
 * Falls back to polling if SSE fails
 */
export const useChatRealtime = (onMessage, onTyping, onUserStatus) => {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionType, setConnectionType] = useState("none"); // "sse" | "polling" | "none"

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

  // Get token from cookie or localStorage
  const getToken = useCallback(() => {
    // Try localStorage first (most accessible)
    const localToken = localStorage.getItem("token");
    if (localToken) return localToken;
    
    // Try to get from cookies (may not work if httpOnly)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        const tokenValue = decodeURIComponent(value);
        if (tokenValue) return tokenValue;
      }
    }
    
    // If user is authenticated but no token found, cookies are likely httpOnly
    // In this case, we can't send token via EventSource, so we'll use polling
    return null;
  }, []);

  // Connect to SSE
  const connectSSE = useCallback(() => {
    if (!currentWorkspace?._id || !user) return;

    try {
      const token = getToken();
      if (!token) {
        // No token available - fall back to polling
        startPolling();
        return;
      }
      
      // Build URL with token in query parameter
      // EventSource doesn't support custom headers or withCredentials
      const url = `${API_URL}/chat/workspaces/${currentWorkspace._id}/events?token=${encodeURIComponent(token)}`;
      
      const eventSource = new EventSource(url);

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

      eventSource.onerror = (error) => {
        setIsConnected(false);
        eventSource.close();

        // Check if we're offline
        if (!navigator.onLine) {
          console.log("Device is offline, using polling fallback");
          if (connectionType !== "polling") {
            startPolling();
          }
          return;
        }

        // Fallback to polling if SSE fails
        if (connectionType !== "polling") {
          console.log("SSE connection failed, falling back to polling");
          startPolling();
        }

        // Reconnect with exponential backoff (only if not already polling)
        if (reconnectAttempts < 3 && connectionType !== "polling") {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectSSE();
          }, delay);
        } else if (reconnectAttempts >= 3 && connectionType !== "polling") {
          // After 3 failed attempts, switch to polling permanently
          console.log("SSE reconnection failed multiple times, switching to polling");
          startPolling();
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
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setConnectionType("polling");
    setIsConnected(true);

    // Poll every 5 seconds for new messages
    const pollForMessages = async () => {
      if (!currentWorkspace?._id || !user?._id) return;
      
      try {
        const chatService = (await import("../services/chatService")).default;
        const response = await chatService.getWorkspaceChannels(currentWorkspace._id);
        const channels = response.data?.data || response.data || [];
        
        // Check for new messages by comparing lastMessageAt
        // This is a simple approach - in production, you might want to track last checked timestamp
        if (onMessage) {
          // The parent component should handle checking for new messages
          // We just signal that polling is active
        }
      } catch (error) {
        console.error("Error polling for messages:", error);
      }
    };

    // Initial poll
    pollForMessages();
    
    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollForMessages, 5000);
  }, [currentWorkspace?._id, user?._id, onMessage]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log("Device came online, attempting SSE connection");
      if (connectionType === "polling") {
        setReconnectAttempts(0);
        connectSSE();
      }
    };

    const handleOffline = () => {
      console.log("Device went offline, switching to polling");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (connectionType !== "polling") {
        startPolling();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [connectionType, connectSSE, startPolling]);

  useEffect(() => {
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [connectSSE]);

  return { isConnected, connectionType };
};

