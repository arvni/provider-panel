import { useCallback, useEffect, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { fetcher } from '../lib/swrConfig';
import { soundManager } from '../utils/soundManager';

export const useNotifications = (options = {}) => {
    const {
        unreadOnly = false,
        refreshInterval = 60000,
        playSound = true,
        showSnackbar = true
    } = options;

    const [lastNotificationCount, setLastNotificationCount] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);
    const previousNotificationsRef = useRef([]);
    const { enqueueSnackbar } = useSnackbar();

    // SWR hook for fetching notifications
    const {
        data,
        error,
        isLoading,
        mutate: refreshNotifications
    } = useSWR(
        `/notifications${unreadOnly ? '?unread_only=true' : ''}`,
        fetcher,
        {
            refreshInterval,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 5000,
            onSuccess: (data) => {
                if (hasInitialized && playSound) {
                    checkForNewNotifications(data);
                }
                if (!hasInitialized) {
                    setLastNotificationCount(data?.unread_count || 0);
                    setHasInitialized(true);
                }
            },
            onError: (error) => {
                if (showSnackbar) {
                    enqueueSnackbar('Failed to load notifications', {
                        variant: 'error',
                        autoHideDuration: 3000
                    });
                }
            }
        }
    );

    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count || 0;
    const hasMore = data?.has_more || false;

    // Check for new notifications and provide feedback
    const checkForNewNotifications = useCallback((newData) => {
        const newNotifications = newData?.notifications || [];
        const newUnreadCount = newData?.unread_count || 0;

        // Compare with previous notifications to detect new ones
        const previousIds = new Set(previousNotificationsRef.current.map(n => n.id));
        const hasNewNotifications = newNotifications.some(n => !previousIds.has(n.id));
        const newOnes = newNotifications.filter(n => !previousIds.has(n.id));

        // Play sound and show notifications for genuinely new items
        if (hasNewNotifications || newUnreadCount > lastNotificationCount) {
            if (playSound) {
                soundManager.playNewNotification();
            }

            // Show snackbar for new notifications
            if (showSnackbar && newOnes.length > 0) {
                const latestNotification = newOnes[0];
                const message = latestNotification.data?.message || 'New notification received';

                enqueueSnackbar(message, {
                    variant: 'info',
                    autoHideDuration: 4000,
                });
            }

            // Browser notification (if permission granted)
            if ('Notification' in window && Notification.permission === 'granted') {
                if (newOnes.length > 0) {
                    const latestNotification = newOnes[0];
                    const message = latestNotification.data?.message || 'New notification';

                    new Notification('Bion Genetic Lab', {
                        body: message,
                        icon: '/favicon.ico',
                        tag: 'bion-notification',
                        badge: '/images/notification-badge.png'
                    });
                }
            }
        }

        setLastNotificationCount(newUnreadCount);
        previousNotificationsRef.current = newNotifications;
    }, [lastNotificationCount, playSound, showSnackbar, enqueueSnackbar]);

    // Mark notification as read with optimistic updates
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await axios.patch(`/notifications/${notificationId}/read`);

            // Optimistic update for better UX
            mutate(`/notifications${unreadOnly ? '?unread_only=true' : ''}`, (currentData) => {
                if (!currentData) return currentData;

                return {
                    ...currentData,
                    notifications: currentData.notifications.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, read_at: new Date().toISOString() }
                            : notification
                    ),
                    unread_count: Math.max(0, currentData.unread_count - 1)
                };
            }, false);

            // Update the other cache key as well
            mutate(`/notifications${!unreadOnly ? '?unread_only=true' : ''}`);

            if (playSound) {
                soundManager.playMarkRead();
            }

        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            if (showSnackbar) {
                enqueueSnackbar('Failed to mark notification as read', {
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
            refreshNotifications();
        }
    }, [unreadOnly, playSound, showSnackbar, enqueueSnackbar, refreshNotifications]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            await axios.patch('/notifications/mark-all-read');

            // Optimistic update for both cache keys
            ['', '?unread_only=true'].forEach(query => {
                mutate(`/notifications${query}`, (currentData) => {
                    if (!currentData) return currentData;

                    return {
                        ...currentData,
                        notifications: currentData.notifications.map(notification => ({
                            ...notification,
                            read_at: new Date().toISOString()
                        })),
                        unread_count: 0
                    };
                }, false);
            });

            if (showSnackbar) {
                enqueueSnackbar('All notifications marked as read', {
                    variant: 'success',
                    autoHideDuration: 2000
                });
            }

        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            if (showSnackbar) {
                enqueueSnackbar('Failed to mark all notifications as read', {
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
            refreshNotifications();
        }
    }, [showSnackbar, enqueueSnackbar, refreshNotifications]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId) => {
        try {
            await axios.delete(`/notifications/${notificationId}`);

            // Optimistic update
            ['', '?unread_only=true'].forEach(query => {
                mutate(`/notifications${query}`, (currentData) => {
                    if (!currentData) return currentData;

                    const deletedNotification = currentData.notifications.find(n => n.id === notificationId);
                    const wasUnread = deletedNotification && !deletedNotification.read_at;

                    return {
                        ...currentData,
                        notifications: currentData.notifications.filter(n => n.id !== notificationId),
                        unread_count: wasUnread ? Math.max(0, currentData.unread_count - 1) : currentData.unread_count
                    };
                }, false);
            });

            if (showSnackbar) {
                enqueueSnackbar('Notification deleted', {
                    variant: 'info',
                    autoHideDuration: 2000
                });
            }

        } catch (error) {
            console.error('Failed to delete notification:', error);
            if (showSnackbar) {
                enqueueSnackbar('Failed to delete notification', {
                    variant: 'error',
                    autoHideDuration: 3000
                });
            }
            refreshNotifications();
        }
    }, [showSnackbar, enqueueSnackbar, refreshNotifications]);

    // Manual refresh
    const refresh = useCallback(() => {
        refreshNotifications();
        if (showSnackbar) {
            enqueueSnackbar('Notifications refreshed', {
                variant: 'info',
                autoHideDuration: 1500
            });
        }
    }, [refreshNotifications, showSnackbar, enqueueSnackbar]);

    // Request notification permission on first use
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return {
        notifications,
        unreadCount,
        hasMore,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
        soundManager,
    };
};
