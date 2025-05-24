import React, { useState } from 'react';
import {
    Tooltip,
    IconButton,
    Badge,
    alpha,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Divider,
    Slider,
    Typography,
    Box
} from '@mui/material';
import {
    NotificationsNone,
    VolumeUp,
    VolumeOff,
    Settings as SettingsIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from './hooks/useNotifications';

const NotificationButton = () => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const { unreadCount, refresh, soundManager } = useNotifications();
    const [soundEnabled, setSoundEnabled] = useState(soundManager.isSoundEnabled());
    const [volume, setVolume] = useState(soundManager.getVolume());

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSettingsClick = (event) => {
        event.stopPropagation();
        setSettingsAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null);
    };

    const handleSoundToggle = () => {
        const newState = soundManager.toggleSound();
        setSoundEnabled(newState);
    };

    const handleVolumeChange = (event, newValue) => {
        setVolume(newValue);
        soundManager.setVolume(newValue);
    };

    const handleRefresh = () => {
        refresh();
        handleSettingsClose();
    };

    const open = Boolean(anchorEl);
    const settingsOpen = Boolean(settingsAnchorEl);

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    size="medium"
                    color="inherit"
                    onClick={handleClick}
                    sx={{
                        borderRadius: 1.5,
                        transition: 'all 0.2s',
                        position: 'relative',
                        '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        }
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        sx={{
                            '& .MuiBadge-badge': {
                                top: 5,
                                right: 5,
                                animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }
                        }}
                    >
                        <NotificationsNone />
                    </Badge>

                    {/* Settings button overlay */}
                    <IconButton
                        size="small"
                        onClick={handleSettingsClick}
                        sx={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            width: 16,
                            height: 16,
                            backgroundColor: alpha(theme.palette.background.paper, 0.9),
                            boxShadow: theme.shadows[2],
                            '&:hover': {
                                backgroundColor: theme.palette.background.paper,
                            }
                        }}
                    >
                        <SettingsIcon sx={{ fontSize: 10 }} />
                    </IconButton>
                </IconButton>
            </Tooltip>

            {/* Settings Menu */}
            <Menu
                anchorEl={settingsAnchorEl}
                open={settingsOpen}
                onClose={handleSettingsClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        minWidth: 250,
                        p: 1
                    }
                }}
            >
                <MenuItem onClick={handleSoundToggle}>
                    <ListItemIcon>
                        {soundEnabled ? <VolumeUp color="primary" /> : <VolumeOff />}
                    </ListItemIcon>
                    <ListItemText>Sound Notifications</ListItemText>
                    <Switch
                        checked={soundEnabled}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        onChange={handleSoundToggle}
                    />
                </MenuItem>

                {soundEnabled && (
                    <Box px={2} py={1}>
                        <Typography variant="caption" color="textSecondary" gutterBottom>
                            Volume
                        </Typography>
                        <Slider
                            value={volume}
                            onChange={handleVolumeChange}
                            min={0}
                            max={1}
                            step={0.1}
                            size="small"
                            sx={{ color: theme.palette.primary.main }}
                        />
                    </Box>
                )}

                <Divider sx={{ my: 1 }} />

                <MenuItem onClick={handleRefresh}>
                    <ListItemIcon>
                        <RefreshIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText>Refresh Now</ListItemText>
                </MenuItem>
            </Menu>

            <NotificationDropdown
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            />

            {/* CSS for badge animation */}
            <style jsx global>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </>
    );
};

export default NotificationButton;
