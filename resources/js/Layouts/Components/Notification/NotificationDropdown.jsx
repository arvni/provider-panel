import React, { useState } from "react";
import useSWR from "swr";
import {
    Popover,
    Paper,
    Typography,
    List,
    Box,
    Divider,
    CircularProgress,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
} from "@mui/material";
import { MarkEmailRead as MarkAllReadIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import NotificationItem from "./NotificationItem";
import { UNREAD_NOTIFICATIONS_KEY, useNotifications } from "./NotificationsProvider";
import { fetcher } from "./lib/swrConfig";

const NotificationDropdown = ({ anchorEl, open, onClose }) => {
    const [tabValue, setTabValue] = useState(0);

    const {
        notifications,
        unreadCount,
        isLoading,
        lastUpdatedAt,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    } = useNotifications();

    // The unread list is only fetched while its tab is actually on screen; the provider
    // stays the single poller for the badge and for announcing new notifications.
    const showUnread = open && tabValue === 1;
    const { data: unreadData, isLoading: unreadLoading } = useSWR(
        showUnread ? UNREAD_NOTIFICATIONS_KEY : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const visibleNotifications = showUnread ? unreadData?.notifications || [] : notifications;
    const listLoading = showUnread
        ? unreadLoading && !unreadData
        : isLoading && !notifications.length;

    const handleRefresh = () => {
        refresh();
    };

    return (
        <Popover
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            PaperProps={{
                sx: {
                    width: 400,
                    maxHeight: 500,
                    mt: 1,
                },
            }}
        >
            <Paper>
                {/* Header */}
                <Box p={2} pb={0}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box>
                            <Typography variant="h6">Notifications</Typography>
                            {lastUpdatedAt && (
                                <Typography variant="caption" color="text.secondary">
                                    Updated{" "}
                                    {formatDistanceToNow(lastUpdatedAt, { addSuffix: true })}
                                </Typography>
                            )}
                        </Box>
                        <Box display="flex" gap={1} alignItems="center">
                            <Tooltip title="Refresh now">
                                <IconButton size="small" onClick={handleRefresh}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            {unreadCount > 0 && (
                                <Tooltip title="Mark all as read">
                                    <IconButton size="small" onClick={markAllAsRead}>
                                        <MarkAllReadIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Tabs
                        value={tabValue}
                        onChange={(event, newValue) => setTabValue(newValue)}
                        variant="fullWidth"
                        sx={{ minHeight: 40 }}
                    >
                        <Tab
                            label={`All (${notifications.length})`}
                            sx={{ minHeight: 40, py: 1 }}
                        />
                        <Tab label={`Unread (${unreadCount})`} sx={{ minHeight: 40, py: 1 }} />
                    </Tabs>
                </Box>

                <Divider />

                {/* Content */}
                <Box sx={{ maxHeight: 350, overflow: "auto" }}>
                    {listLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : visibleNotifications.length > 0 ? (
                        <List disablePadding>
                            {visibleNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={markAsRead}
                                    onDelete={deleteNotification}
                                />
                            ))}
                        </List>
                    ) : (
                        <Box p={3} textAlign="center">
                            <Typography color="text.secondary">
                                {showUnread ? "No unread notifications" : "No notifications"}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Popover>
    );
};

export default NotificationDropdown;
