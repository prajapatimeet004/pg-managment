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

const EVENT_NAME = "pg-data-updated";

/**
 * Fire an event that tells all listening pages to refetch their data.
 * @param {string} entity - e.g. "tenants"|"properties"|"rooms"|"complaints"|"notices"|"rent"|"staff"|"all"
 */
export function notifyDataUpdated(entity = "all") {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { entity } }));
}

/**
 * React hook that listens for data update events and calls a refetch function.
 * @param {string[]} watch - list of entity names to watch (use ["all"] to watch everything)
 * @param {Function} refetchFn - the function to call when a relevant update is detected
 */
import { useEffect } from "react";

export function useDataRefresh(watch, refetchFn) {
  useEffect(() => {
    const handler = (e) => {
      const { entity } = e.detail || {};
      if (!entity) return;
      if (entity === "all" || watch.includes("all") || watch.includes(entity)) {
        refetchFn();
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [watch, refetchFn]);
}
