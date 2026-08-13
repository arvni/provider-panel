import React, { useEffect, useRef, useState } from "react";
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
    Box,
} from "@mui/material";
import {
    NotificationsNone,
    VolumeUp,
    VolumeOff,
    DesktopWindows,
    Settings as SettingsIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "./NotificationsProvider";
import { soundManager } from "./utils/soundManager";

const NotificationButton = () => {
    const theme = useTheme();
    const buttonRef = useRef(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
    const { unreadCount, refresh, openRequest, desktopEnabled, toggleDesktopNotifications } =
        useNotifications();
    const [soundEnabled, setSoundEnabled] = useState(soundManager.isSoundEnabled());
    const [volume, setVolume] = useState(soundManager.getVolume());

    // "View" on a new-notification snackbar opens the panel on the bell.
    useEffect(() => {
        if (openRequest > 0) {
            setAnchorEl(buttonRef.current);
        }
    }, [openRequest]);

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
            <Box sx={{ position: "relative", display: "inline-flex" }}>
                <Tooltip title="Notifications">
                    <IconButton
                        ref={buttonRef}
                        size="medium"
                        color="inherit"
                        onClick={handleClick}
                        aria-label="Notifications"
                        sx={{
                            borderRadius: 1.5,
                            transition: "all 0.2s",
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                        }}
                    >
                        <Badge
                            badgeContent={unreadCount}
                            color="error"
                            max={99}
                            sx={{
                                "& .MuiBadge-badge": {
                                    top: 5,
                                    right: 5,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                },
                            }}
                        >
                            <NotificationsNone />
                        </Badge>
                    </IconButton>
                </Tooltip>

                {/* Settings button — sibling, not nested inside the notification button */}
                <IconButton
                    size="small"
                    onClick={handleSettingsClick}
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: 16,
                        height: 16,
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        boxShadow: theme.shadows[2],
                        "&:hover": {
                            backgroundColor: theme.palette.background.paper,
                        },
                    }}
                >
                    <SettingsIcon sx={{ fontSize: 10 }} />
                </IconButton>
            </Box>

            {/* Settings Menu */}
            <Menu
                anchorEl={settingsAnchorEl}
                open={settingsOpen}
                onClose={handleSettingsClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                    sx: {
                        minWidth: 250,
                        p: 1,
                    },
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

                <MenuItem onClick={toggleDesktopNotifications}>
                    <ListItemIcon>
                        <DesktopWindows color={desktopEnabled ? "primary" : "inherit"} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Desktop Notifications"
                        secondary="Only while this tab is in the background"
                        slotProps={{ secondary: { variant: "caption" } }}
                    />
                    <Switch
                        checked={desktopEnabled}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        onChange={toggleDesktopNotifications}
                    />
                </MenuItem>

                <Divider sx={{ my: 1 }} />

                <MenuItem onClick={handleRefresh}>
                    <ListItemIcon>
                        <RefreshIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText>Refresh Now</ListItemText>
                </MenuItem>
            </Menu>

            <NotificationDropdown anchorEl={anchorEl} open={open} onClose={handleClose} />
        </>
    );
};

export default NotificationButton;
