import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "axios";
import { useSnackbar } from "notistack";
import { Button } from "@mui/material";
import { fetcher } from "./lib/swrConfig";
import { soundManager } from "./utils/soundManager";

export const NOTIFICATIONS_KEY = "/notifications";
export const UNREAD_NOTIFICATIONS_KEY = "/notifications?unread_only=true";

const SEEN_STORAGE_KEY = "bion-announced-notifications";
const DESKTOP_STORAGE_KEY = "bion-notifications-desktop";
const SEEN_LIMIT = 200;
const POLL_INTERVAL = 60000;
const SOUND_THROTTLE = 5000;

const NotificationsContext = createContext(null);

// Announced ids live in sessionStorage: every Inertia visit remounts the layout, and
// without this the same notifications would be announced again after each navigation.
const readSeen = () => {
    try {
        const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);

        return { seeded: raw !== null, ids: new Set(raw ? JSON.parse(raw) : []) };
    } catch {
        return { seeded: false, ids: new Set() };
    }
};

const writeSeen = (ids) => {
    try {
        sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...ids].slice(-SEEN_LIMIT)));
    } catch {
        // Private browsing / storage full — announcements just fall back to per-mount memory.
    }
};

const desktopPreference = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;

    return (
        localStorage.getItem(DESKTOP_STORAGE_KEY) === "true" &&
        Notification.permission === "granted"
    );
};

let lastSoundAt = 0;

const playNewNotificationSound = () => {
    const now = Date.now();
    if (now - lastSoundAt < SOUND_THROTTLE) return;

    lastSoundAt = now;
    soundManager.playNewNotification();
};

export const NotificationsProvider = ({ children }) => {
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const seenRef = useRef(null);
    if (seenRef.current === null) {
        seenRef.current = readSeen();
    }

    const failureCountRef = useRef(0);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [openRequest, setOpenRequest] = useState(0);
    const [desktopEnabled, setDesktopEnabled] = useState(desktopPreference);

    const openPanel = useCallback(() => setOpenRequest((count) => count + 1), []);

    const markSeen = useCallback((ids) => {
        ids.forEach((id) => seenRef.current.ids.add(id));
        seenRef.current.seeded = true;
        writeSeen(seenRef.current.ids);
    }, []);

    // One announcement per batch of genuinely new notifications — never one per item,
    // and never for notifications that were already on screen when the session started.
    const announce = useCallback(
        (incoming) => {
            const ids = incoming.map((notification) => notification.id);

            if (!seenRef.current.seeded) {
                markSeen(ids);

                return;
            }

            const fresh = incoming.filter(
                (notification) => !seenRef.current.ids.has(notification.id)
            );
            markSeen(ids);

            if (fresh.length === 0) return;

            const message =
                fresh.length === 1
                    ? fresh[0].data?.message || "New notification"
                    : `${fresh.length} new notifications`;

            enqueueSnackbar(message, {
                variant: "info",
                key: "new-notifications",
                preventDuplicate: true,
                autoHideDuration: 6000,
                action: (key) => (
                    <Button
                        color="inherit"
                        size="small"
                        onClick={() => {
                            closeSnackbar(key);
                            openPanel();
                        }}
                    >
                        View
                    </Button>
                ),
            });

            playNewNotificationSound();

            // Only reach outside the tab when the user isn't looking at it.
            if (desktopEnabled && document.hidden && Notification.permission === "granted") {
                new Notification("Bion Genetic Lab", {
                    body: message,
                    icon: "/favicon.ico",
                    tag: "bion-notification",
                    renotify: false,
                });
            }
        },
        [closeSnackbar, desktopEnabled, enqueueSnackbar, markSeen, openPanel]
    );

    const {
        data,
        error,
        isLoading,
        mutate: refresh,
    } = useSWR(NOTIFICATIONS_KEY, fetcher, {
        refreshInterval: POLL_INTERVAL,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 10000,
        keepPreviousData: true,
        onSuccess: (payload) => {
            failureCountRef.current = 0;
            setLastUpdatedAt(Date.now());
            announce(payload?.notifications || []);
        },
        onError: () => {
            failureCountRef.current += 1;

            // A single failed poll is usually a blip; only mention a sustained outage, once.
            if (failureCountRef.current === 2) {
                enqueueSnackbar("Can't reach notifications right now", {
                    variant: "warning",
                    key: "notifications-unreachable",
                    preventDuplicate: true,
                    autoHideDuration: 4000,
                });
            }
        },
    });

    const notifyFailure = useCallback(
        (message, key) => {
            enqueueSnackbar(message, {
                variant: "error",
                key,
                preventDuplicate: true,
                autoHideDuration: 4000,
            });
        },
        [enqueueSnackbar]
    );

    const patchCaches = useCallback((updater) => {
        [NOTIFICATIONS_KEY, UNREAD_NOTIFICATIONS_KEY].forEach((key) => {
            globalMutate(key, (current) => (current ? updater(current) : current), false);
        });
    }, []);

    const markAsRead = useCallback(
        async (notificationId) => {
            try {
                await axios.patch(`/notifications/${notificationId}/read`);

                patchCaches((current) => ({
                    ...current,
                    notifications: current.notifications.map((notification) =>
                        notification.id === notificationId
                            ? { ...notification, read_at: new Date().toISOString() }
                            : notification
                    ),
                    unread_count: Math.max(0, current.unread_count - 1),
                }));
            } catch (requestError) {
                console.error("Failed to mark notification as read:", requestError);
                notifyFailure(
                    "Couldn't mark that notification as read",
                    "notification-read-failed"
                );
                refresh();
            }
        },
        [notifyFailure, patchCaches, refresh]
    );

    const markAllAsRead = useCallback(async () => {
        try {
            await axios.patch("/notifications/mark-all-read");

            patchCaches((current) => ({
                ...current,
                notifications: current.notifications.map((notification) => ({
                    ...notification,
                    read_at: notification.read_at || new Date().toISOString(),
                })),
                unread_count: 0,
            }));
        } catch (requestError) {
            console.error("Failed to mark all notifications as read:", requestError);
            notifyFailure("Couldn't mark all as read", "notifications-read-all-failed");
            refresh();
        }
    }, [notifyFailure, patchCaches, refresh]);

    const deleteNotification = useCallback(
        async (notificationId) => {
            try {
                await axios.delete(`/notifications/${notificationId}`);

                patchCaches((current) => {
                    const removed = current.notifications.find((n) => n.id === notificationId);

                    return {
                        ...current,
                        notifications: current.notifications.filter((n) => n.id !== notificationId),
                        unread_count:
                            removed && !removed.read_at
                                ? Math.max(0, current.unread_count - 1)
                                : current.unread_count,
                    };
                });
            } catch (requestError) {
                console.error("Failed to delete notification:", requestError);
                notifyFailure("Couldn't delete that notification", "notification-delete-failed");
                refresh();
            }
        },
        [notifyFailure, patchCaches, refresh]
    );

    // Permission is only ever requested from this click, never on page load.
    const toggleDesktopNotifications = useCallback(async () => {
        if (!("Notification" in window)) {
            notifyFailure(
                "This browser doesn't support desktop notifications",
                "no-desktop-support"
            );

            return false;
        }

        if (desktopEnabled) {
            localStorage.setItem(DESKTOP_STORAGE_KEY, "false");
            setDesktopEnabled(false);

            return false;
        }

        const permission =
            Notification.permission === "default"
                ? await Notification.requestPermission()
                : Notification.permission;

        const granted = permission === "granted";
        localStorage.setItem(DESKTOP_STORAGE_KEY, granted ? "true" : "false");
        setDesktopEnabled(granted);

        if (!granted) {
            enqueueSnackbar("Desktop notifications are blocked in your browser settings", {
                variant: "warning",
                key: "desktop-blocked",
                preventDuplicate: true,
                autoHideDuration: 4000,
            });
        }

        return granted;
    }, [desktopEnabled, enqueueSnackbar, notifyFailure]);

    const value = useMemo(
        () => ({
            notifications: data?.notifications || [],
            unreadCount: data?.unread_count || 0,
            hasMore: data?.has_more || false,
            isLoading,
            error,
            lastUpdatedAt,
            refresh,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            openPanel,
            openRequest,
            desktopEnabled,
            toggleDesktopNotifications,
        }),
        [
            data,
            deleteNotification,
            desktopEnabled,
            error,
            isLoading,
            lastUpdatedAt,
            markAllAsRead,
            markAsRead,
            openPanel,
            openRequest,
            refresh,
            toggleDesktopNotifications,
        ]
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);

    if (!context) {
        throw new Error("useNotifications must be used inside <NotificationsProvider>");
    }

    return context;
};

export default NotificationsProvider;
