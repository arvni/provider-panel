import React from 'react';
import {
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    IconButton,
    Box,
    Chip,
    Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Circle as CircleIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({
                              notification,
                              onMarkAsRead,
                              onDelete
                          }) => {
    const isUnread = !notification.read_at;

    // Get notification icon based on type or priority
    const getNotificationIcon = () => {
        const data = notification.data || {};
        const priority = data.priority || 'low';

        switch (priority) {
            case 'high':
                return <ErrorIcon color="error" />;
            case 'medium':
                return <WarningIcon color="warning" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    // Get notification color based on type
    const getNotificationColor = () => {
        const data = notification.data || {};
        const priority = data.priority || 'low';

        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            default:
                return 'info';
        }
    };

    // Handle click to mark as read and potentially navigate
    const handleClick = () => {
        if (isUnread) {
            onMarkAsRead(notification.id);
        }

        // Navigate to relevant page if URL provided
        const data = notification.data || {};
        if (data.admin_url || data.url) {
            window.open(data.admin_url || data.url, '_blank');
        }
    };

    const data = notification.data || {};
    const message = data.message || 'New notification';
    const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

    return (
        <ListItem
            sx={{
                backgroundColor: isUnread ? 'action.hover' : 'transparent',
                borderLeft: isUnread ? `4px solid` : 'none',
                borderLeftColor: isUnread ? `${getNotificationColor()}.main` : 'transparent',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.selected',
                },
                position: 'relative',
            }}
            onClick={handleClick}
        >
            <ListItemAvatar>
                <Avatar sx={{ bgcolor: `${getNotificationColor()}.light` }}>
                    {getNotificationIcon()}
                </Avatar>
            </ListItemAvatar>

            <ListItemText
                primary={
                    <Box display="flex" alignItems="center" gap={1}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: isUnread ? 600 : 400,
                                flex: 1
                            }}
                        >
                            {message}
                        </Typography>
                        {isUnread && (
                            <CircleIcon
                                sx={{
                                    fontSize: 12,
                                    color: `${getNotificationColor()}.main`
                                }}
                            />
                        )}
                    </Box>
                }
                secondary={
                    <Box mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                            {timeAgo}
                        </Typography>
                        {data.status_label && (
                            <Chip
                                label={data.status_label}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1, height: 20 }}
                            />
                        )}
                    </Box>
                }
            />

            <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <Tooltip title="Delete notification">
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                        }}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </ListItem>
    );
};

export default NotificationItem;
