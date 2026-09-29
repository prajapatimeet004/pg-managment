import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  IndianRupee, 
  AlertCircle, 
  Clock,
  Megaphone, 
  Sparkles,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./utils";
import { Button } from "./button";
import { API_BASE_URL } from "../../lib/apiConfig";

export function NotificationPanel() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [swipingId, setSwipingId] = useState(null);
  const dropdownRef = useRef(null);

  // Identify current user and role
  const isTenant = localStorage.getItem("isTenantAuthenticated") === "true";
  const userRole = isTenant ? "tenant" : (localStorage.getItem("userRole") || "Owner");
  const tenantId = isTenant ? parseInt(localStorage.getItem("tenantId"), 10) : null;
  const storageKey = `pg_notifications_${userRole}_${tenantId || 'admin'}`;

  // Re-validate stored notifications against current property scope
  const revalidateNotifications = useCallback((notifs) => {
    // Strip old fake seed IDs
    const cleanNotifs = (notifs || []).filter(n => !String(n.id).startsWith("seed-"));
    if (isTenant) return cleanNotifs;
    const userOwnerId = parseInt(localStorage.getItem("ownerId"), 10);
    const userPropertyIds = (localStorage.getItem("propertyIds") || "").split(",").filter(Boolean).map(Number);
    const isOwner = localStorage.getItem("userRole") === "Owner";

    return cleanNotifs.filter(n => {
      const isScoped = n.category === "rent_paid" || n.category === "rent_due" || n.category === "rent_overdue" ||
                       n.category === "complaint_created" || n.category === "complaint_updated";
      if (!isScoped) return true;

      const notifOwnerId = n.owner_id ? parseInt(n.owner_id, 10) : null;
      const notifPropertyId = n.property_id ? parseInt(n.property_id, 10) : null;

      if (!notifOwnerId) return true;

      if (notifOwnerId === userOwnerId) {
        if (isOwner) return true;
        if (!notifPropertyId) return true;
        if (userPropertyIds.includes(notifPropertyId)) return true;
        return false;
      }
      return false;
    });
  }, [isTenant]);

  // Sync real tenant notices from backend
  const syncTenantNotices = useCallback(async () => {
    if (!isTenant || !tenantId) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/tenant/dashboard/${tenantId}`);
      if (!resp.ok) return;
      const data = await resp.json();

      if (data.tenant?.property_id) {
        localStorage.setItem("tenantPropertyId", String(data.tenant.property_id));
      }

      const backendNotices = data.notices || [];
      setNotifications((prev) => {
        const stored = revalidateNotifications(prev);
        const existingMap = new Map(stored.map(item => [item.id, item]));

        backendNotices.forEach((notice) => {
          const notifId = `notice-${notice.id}`;
          if (!existingMap.has(notifId)) {
            existingMap.set(notifId, {
              id: notifId,
              category: "notice_created",
              title: notice.urgent ? "🚨 Urgent Announcement" : "📢 New Notice Posted",
              message: `${notice.title}: ${notice.content}`,
              time: notice.created_at || new Date().toISOString(),
              unread: true,
              property_id: notice.property_id,
              notice_id: notice.id,
              urgent: notice.urgent
            });
          }
        });

        const merged = Array.from(existingMap.values()).sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        localStorage.setItem(storageKey, JSON.stringify(merged));
        return merged;
      });
    } catch (e) {
      console.error("Failed to sync tenant notices:", e);
    }
  }, [isTenant, tenantId, storageKey, revalidateNotifications]);

  // Initial load, seed, and re-validate
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    let notifs = stored ? JSON.parse(stored) : [];
    const valid = revalidateNotifications(notifs);
    setNotifications(valid);
    localStorage.setItem(storageKey, JSON.stringify(valid));

    if (isTenant) {
      syncTenantNotices();
    }
  }, [storageKey, isTenant, revalidateNotifications, syncTenantNotices]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Re-validate or re-sync when dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    if (isTenant) {
      syncTenantNotices();
    } else {
      setNotifications((prev) => {
        const valid = revalidateNotifications(prev);
        if (valid.length !== prev.length) {
          localStorage.setItem(storageKey, JSON.stringify(valid));
        }
        return valid;
      });
    }
  }, [isOpen, isTenant, storageKey, revalidateNotifications, syncTenantNotices]);

  // Listen for real-time WebSocket notifications & data updates
  useEffect(() => {
    const handleNotification = (e) => {
      const n = e.detail;
      if (!n) return;

      // Filter relevance
      let isRelevant = false;
      if (isTenant) {
        const notifTenantId = n.tenant_id ? parseInt(n.tenant_id, 10) : null;
        if (n.category === "notice_created") {
          const tenantPropertyId = parseInt(localStorage.getItem("tenantPropertyId"), 10);
          const notifPropertyId = n.property_id !== undefined && n.property_id !== null ? parseInt(n.property_id, 10) : 0;
          if (notifPropertyId === 0 || !notifPropertyId || !tenantPropertyId || notifPropertyId === tenantPropertyId) {
            isRelevant = true;
          }
        } else if (n.category === "complaint_updated" && notifTenantId === tenantId) {
          isRelevant = true;
        } else if (n.category === "rent_paid" && notifTenantId === tenantId) {
          isRelevant = true;
        } else if ((n.category === "rent_due" || n.category === "rent_overdue") && notifTenantId === tenantId) {
          isRelevant = true;
        }
      } else {
        const userOwnerId = parseInt(localStorage.getItem("ownerId"), 10);
        const userPropertyIds = (localStorage.getItem("propertyIds") || "").split(",").filter(Boolean).map(Number);
        const isOwner = localStorage.getItem("userRole") === "Owner";

        const notifOwnerId = n.owner_id ? parseInt(n.owner_id, 10) : null;
        const notifPropertyId = n.property_id ? parseInt(n.property_id, 10) : null;

        if (n.category === "rent_paid" || n.category === "rent_due" || n.category === "rent_overdue") {
          if (notifOwnerId && notifOwnerId === userOwnerId) {
            if (isOwner) {
              isRelevant = true;
            } else if (notifPropertyId && userPropertyIds.includes(notifPropertyId)) {
              isRelevant = true;
            } else if (!notifPropertyId) {
              isRelevant = true;
            }
          } else if (!notifOwnerId && isOwner) {
            isRelevant = true;
          }
        } else if (n.category === "complaint_created" || n.category === "complaint_updated") {
          if (notifOwnerId && notifOwnerId === userOwnerId) {
            if (isOwner) {
              isRelevant = true;
            } else if (notifPropertyId && userPropertyIds.includes(notifPropertyId)) {
              isRelevant = true;
            } else if (!notifPropertyId) {
              isRelevant = true;
            }
          } else if (!notifOwnerId && isOwner) {
            isRelevant = true;
          }
        } else if (n.category === "notice_created") {
          if (notifOwnerId && notifOwnerId === userOwnerId) {
            if (isOwner) {
              isRelevant = true;
            } else if (notifPropertyId === 0 || !notifPropertyId) {
              isRelevant = true;
            } else if (userPropertyIds.includes(notifPropertyId)) {
              isRelevant = true;
            }
          }
        }
      }

      if (isRelevant) {
        const newNotif = {
          id: n.id || `notif-${Date.now()}-${Math.random()}`,
          category: n.category,
          title: n.title,
          message: n.message,
          time: new Date().toISOString(),
          unread: true,
          owner_id: n.owner_id,
          property_id: n.property_id,
          tenant_id: n.tenant_id
        };

        setNotifications((prev) => {
          const updated = [newNotif, ...prev.filter(x => x.id !== newNotif.id)];
          localStorage.setItem(storageKey, JSON.stringify(updated));
          return updated;
        });
      }
    };

    const handleDataUpdated = (e) => {
      const entity = e.detail?.entity;
      if (isTenant && (entity === "notices" || entity === "all")) {
        syncTenantNotices();
      }
    };

    window.addEventListener("pg-notification", handleNotification);
    window.addEventListener("pg-data-updated", handleDataUpdated);
    return () => {
      window.removeEventListener("pg-notification", handleNotification);
      window.removeEventListener("pg-data-updated", handleDataUpdated);
    };
  }, [isTenant, tenantId, storageKey, syncTenantNotices]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem(storageKey, JSON.stringify([]));
  };

  const removeNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleNotificationClick = (n) => {
    removeNotification(n.id);
    setIsOpen(false);
    if (isTenant) {
      if (n.category === "notice_created") {
        navigate("/tenant/notices");
      } else if (n.category === "complaint_updated" || n.category === "complaint_created") {
        navigate("/tenant/complaints");
      } else if (n.category?.startsWith("rent_")) {
        navigate("/tenant/rent");
      }
    } else {
      if (n.category === "notice_created") {
        navigate("/notices");
      } else if (n.category === "complaint_created" || n.category === "complaint_updated") {
        navigate("/complaints");
      } else if (n.category?.startsWith("rent_")) {
        navigate("/rent-collection");
      }
    }
  };

  const getIcon = (category) => {
    switch (category) {
      case "rent_paid":
        return <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "rent_due":
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "rent_overdue":
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "complaint_created":
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "complaint_updated":
        return <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "notice_created":
        return <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "system":
        return <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const formatTime = (isoString) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-500 hover:text-indigo-600 dark:text-gray-400 transition-all flex items-center justify-center shadow-sm"
      >
        <Bell className="w-5 h-5 stroke-[2.2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white dark:ring-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15, type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllRead}
                      title="Mark all as read"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearAll}
                      title="Clear all"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-900">
              {notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 mb-3">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">All caught up!</h4>
                  <p className="text-xs text-gray-400 mt-1">No notifications at the moment.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -200, transition: { duration: 0.2 } }}
                      drag="x"
                      dragDirectionLock
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={{ left: 0.4, right: 0 }}
                      onDragStart={() => setSwipingId(n.id)}
                      onDragEnd={(_, info) => {
                        setSwipingId(null);
                        if (info.offset.x < -100) {
                          removeNotification(n.id);
                        }
                      }}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "relative overflow-hidden cursor-pointer group",
                        n.unread && "bg-indigo-50/20 dark:bg-indigo-950/10"
                      )}
                    >
                      {/* Swipe delete background */}
                      <div className={cn(
                        "absolute inset-0 bg-rose-500 flex items-center justify-end pr-5 transition-opacity duration-150",
                        swipingId === n.id ? "opacity-100" : "opacity-0"
                      )}>
                        <Trash2 className="w-5 h-5 text-white" />
                      </div>

                      <div className={cn(
                        "p-4 flex gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 relative bg-white dark:bg-gray-950 transition-all duration-200",
                        swipingId === n.id && "pointer-events-none"
                      )}>
                        {/* Unread indicator dot */}
                        {n.unread && (
                          <span className="absolute top-5 left-2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        )}

                        <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100/50 dark:border-gray-800 flex items-center justify-center shrink-0">
                          {getIcon(n.category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn("text-xs leading-tight text-gray-950 dark:text-white truncate", n.unread ? "font-black" : "font-bold")}>
                              {n.title}
                            </h4>
                            <span className="text-[9px] text-gray-400 font-bold shrink-0 uppercase tracking-wider">
                              {formatTime(n.time)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-snug break-words">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* View Activity Log (Footer) */}
            <div className="p-4 bg-gray-50/30 dark:bg-gray-900/10 border-t border-gray-100 dark:border-gray-900 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                PG Operational updates
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
