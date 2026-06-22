/**
 * Lightweight real-time data synchronization via custom browser events.
 *
 * Usage — publisher:
 *   import { notifyDataUpdated } from "../lib/dataEvents";
 *   notifyDataUpdated("tenants");        // after adding a tenant
 *   notifyDataUpdated("properties");     // after adding a property
 *
 * Usage — subscriber (in a page component):
 *   import { useDataRefresh } from "../lib/dataEvents";
 *   useDataRefresh(["tenants", "rooms"], fetchData);
 *   // fetchData will be called automatically when tenant or room data changes
 */

import { useEffect, useRef } from "react";

const EVENT_NAME = "pg-data-updated";

// ── WebSocket Cross-Browser Sync ───────────────────────────────────
let socket = null;
function connectWS() {
  if (typeof window === "undefined") return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  // Derive wsUrl dynamically from API base URL (converting http/https to ws/wss)
  const apiBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const wsUrl = apiBase.replace(/^http/, "ws") + "/ws";
  
  try {
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "data_updated") {
          // Trigger local event to refresh UI components
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { entity: data.entity } }));
        } else if (data.type === "notification") {
          // Dispatch a separate notification event for toast display
          window.dispatchEvent(new CustomEvent("pg-notification", { detail: data }));
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    };

    socket.onclose = () => {
      console.log("WS Disconnected. Reconnecting in 3s...");
      setTimeout(connectWS, 3000);
    };

    socket.onerror = (err) => {
      console.error("WS Socket Error:", err);
    };
  } catch (err) {
    console.error("WS Connection Error:", err);
    setTimeout(connectWS, 5000);
  }
}

// Initialize connection
if (typeof window !== "undefined") {
  connectWS();
}
// ───────────────────────────────────────────────────────────────────

export function notifyDataUpdated(entity = "all") {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { entity } }));
}

export function useDataRefresh(watch, refetchFn) {
  const callbackRef = useRef(refetchFn);
  
  // Keep the ref updated with the latest function
  useEffect(() => {
    callbackRef.current = refetchFn;
  }, [refetchFn]);

  useEffect(() => {
    const handler = (e) => {
      const { entity } = e.detail || {};
      if (!entity) return;
      
      const watchList = Array.isArray(watch) ? watch : [watch];
      if (entity === "all" || watchList.includes("all") || watchList.includes(entity)) {
        callbackRef.current?.();
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [watch]);
}
