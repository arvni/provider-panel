import React, { useState, useEffect } from 'react';
import {
    Popover,
    Paper,
    Typography,
    List,
    Box,
    Button,
    Divider,
    CircularProgress,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    MarkEmailRead as MarkAllReadIcon,
    Refresh as RefreshIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import NotificationItem from './NotificationItem';
import { useNotifications } from './hooks/useNotifications';

const NotificationDropdown = ({ anchorEl, open, onClose }) => {
    const [tabValue, setTabValue] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(Date.now());
    const [refreshCountdown, setRefreshCountdown] = useState(60);

    const {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    } = useNotifications({
        unreadOnly: tabValue === 1,
        refreshInterval: 60000, // 1 minute
    });

    // Countdown timer for next refresh
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastRefresh = Math.floor((now - lastRefresh) / 1000);
            const timeUntilRefresh = Math.max(0, 60 - timeSinceLastRefresh);
            setRefreshCountdown(timeUntilRefresh);

            if (timeUntilRefresh === 0) {
                setLastRefresh(now);
                setRefreshCountdown(60);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastRefresh]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleRefresh = () => {
        refresh();
        setLastRefresh(Date.now());
        setRefreshCountdown(60);
    };

    const filteredNotifications = notifications || [];
    const progressValue = ((60 - refreshCountdown) / 60) * 100;

    return (
        <Popover
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    width: 400,
                    maxHeight: 500,
                    mt: 1,
                }
            }}
        >
            <Paper>
                {/* Header */}
                <Box p={2} pb={0}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="h6">
                            Notifications
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                            <Chip
                                icon={<ScheduleIcon />}
                                label={`${refreshCountdown}s`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                            />
                            <Tooltip title="Refresh now">
                                <IconButton size="small" onClick={handleRefresh}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            {unreadCount > 0 && (
                                <Tooltip title="Mark all as read">
                                    <IconButton size="small" onClick={handleMarkAllAsRead}>
                                        <MarkAllReadIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    {/* Progress bar for refresh countdown */}
                    <LinearProgress
                        variant="determinate"
                        value={progressValue}
                        sx={{
                            height: 2,
                            mb: 1,
                            backgroundColor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: 'primary.main',
                            }
                        }}
                    />

                    {/* Tabs */}
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ minHeight: 40 }}
                    >
                        <Tab
                            label={`All (${notifications.length})`}
                            sx={{ minHeight: 40, py: 1 }}
                        />
                        <Tab
                            label={`Unread (${unreadCount})`}
                            sx={{ minHeight: 40, py: 1 }}
                        />
                    </Tabs>
                </Box>

                <Divider />

                {/* Content */}
                <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                    {isLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : filteredNotifications.length > 0 ? (
                        <List disablePadding>
                            {filteredNotifications.map((notification) => (
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
                                {tabValue === 1 ? 'No unread notifications' : 'No notifications'}
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                {filteredNotifications.length > 0 && (
                    <>
                        <Divider />
                        <Box p={2}>
                            {/*<Button*/}
                            {/*    fullWidth*/}
                            {/*    variant="text"*/}
                            {/*    size="small"*/}
                            {/*    onClick={() => {*/}
                            {/*        window.location.href = '/notifications';*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    View All Notifications*/}
                            {/*</Button>*/}
                        </Box>
                    </>
                )}
            </Paper>
        </Popover>
    );
};

export default NotificationDropdown;
