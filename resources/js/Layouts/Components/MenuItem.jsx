import React, { useState, useEffect } from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import {
    Avatar,
    Collapse,
    Tooltip,
    Box,
    Typography,
    alpha,
    useTheme
} from "@mui/material";
import {
    ExpandLess,
    ExpandMore,
    KeyboardArrowRight
} from "@mui/icons-material";
import List from "@mui/material/List";
import { motion } from "framer-motion";

/**
 * Enhanced MenuItem component for navigation drawer
 *
 * @param {function} onClick - Click handler function
 * @param {array} permissions - User permissions array
 * @param {boolean} active - Whether this item is active
 * @param {boolean} expanded - Whether the drawer is expanded
 * @param {object} props - Other props
 */
const MenuItem = ({
                      onClick,
                      permissions,
                      active = false,
                      expanded = true,
                      ...props
                  }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [hasActiveChild, setHasActiveChild] = useState(false);

    // Check if this item or any children are active
    useEffect(() => {
        if (props.child) {
            const anyChildActive = checkForActiveChild(props.child);
            setHasActiveChild(anyChildActive);

            // Auto-expand parent if a child is active
            if (anyChildActive && !open) {
                setOpen(true);
            }
        }
    }, [active, props.child]);

    // Helper function to check if any child items are active
    const checkForActiveChild = (children) => {
        if (!children) return false;

        return children.some(child => {
            if (child.route && window.location.pathname === child.route) {
                return true;
            }
            if (child.child) {
                return checkForActiveChild(child.child);
            }
            return false;
        });
    };

    // Handle click for this item
    const handleClick = (route) => (e) => {
        if (e) {
            e.preventDefault();
        }

        if (route) {
            onClick(route)();
        } else if (props.child) {
            setOpen(!open);
        }
    };

    // Define styles based on state
    const isActive = active || hasActiveChild;

    // Custom styles for list items
    const listItemStyles = {
        borderRadius: expanded ? '0 24px 24px 0' : '50%',
        mx: expanded ? 1 : 'auto',
        mb: 0.5,
        pl: expanded ? (props.child ? 2 : 3) : 0,
        justifyContent: expanded ? 'flex-start' : 'center',
        minHeight: '44px',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',

        // Active state
        ...(isActive && {
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            fontWeight: 500,

            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
            },

            '& .MuiListItemIcon-root': {
                color: theme.palette.primary.contrastText,
            },

            '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: '4px',
                backgroundColor: theme.palette.primary.light,
            },
        }),

        // Normal state
        ...(!isActive && {
            '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),

                '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                    transform: 'scale(1.1)',
                }
            }
        }),
    };

    // Animation variants for submenu
    const childVariants = {
        hidden: { opacity: 0, height: 0 },
        visible: {
            opacity: 1,
            height: 'auto',
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        }
    };

    // If drawer is collapsed, render tooltip
    if (!expanded) {
        return (
            <Tooltip
                title={props.title}
                placement="right"
                arrow
            >
                <Box>
                    <ListItemButton
                        sx={{
                            ...listItemStyles,
                            minWidth: 0,
                            width: 40,
                            height: 40,
                            p: 0,
                            mx: 'auto',
                            my: 1,
                        }}
                        onClick={handleClick(props.route)}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                color: isActive ? 'inherit' : theme.palette.text.secondary,
                                transition: 'all 0.2s',
                                mx: 'auto'
                            }}
                        >
                            {props.icon ?? (
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        fontSize: ".75rem",
                                        bgcolor: isActive ? 'inherit' : '#f5f5f5',
                                        color: isActive ? 'inherit' : theme.palette.text.secondary,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {props.title.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </ListItemIcon>
                    </ListItemButton>
                </Box>
            </Tooltip>
        );
    }

    // Full expanded view
    return (
        <>
            <ListItemButton
                sx={listItemStyles}
                onClick={handleClick(props.route)}
                selected={isActive}
            >
                <ListItemIcon
                    sx={{
                        minWidth: props.child ? "36px" : "40px",
                        color: isActive ? 'inherit' : theme.palette.text.secondary,
                        transition: 'all 0.2s',
                    }}
                >
                    {props.icon ?? (
                        <Avatar
                            variant="rounded"
                            sx={{
                                width: 24,
                                height: 24,
                                fontSize: ".75rem",
                                bgcolor: isActive ? 'inherit' : '#f5f5f5',
                                color: isActive ? 'inherit' : theme.palette.text.secondary,
                                transition: 'all 0.2s',
                            }}
                        >
                            {props.title.charAt(0).toUpperCase()}
                        </Avatar>
                    )}
                </ListItemIcon>

                <ListItemText
                    primary={
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: isActive ? 600 : 400,
                                transition: 'font-weight 0.2s',
                                fontSize: '0.875rem',
                            }}
                        >
                            {props.title}
                        </Typography>
                    }
                />

                {props.child && (
                    open ? (
                        <ExpandLess
                            sx={{
                                color: isActive ? 'inherit' : theme.palette.text.secondary,
                                opacity: 0.8,
                                transition: 'transform 0.3s',
                                transform: 'rotate(0deg)'
                            }}
                        />
                    ) : (
                        <ExpandMore
                            sx={{
                                color: isActive ? 'inherit' : theme.palette.text.secondary,
                                opacity: 0.8,
                                transition: 'transform 0.3s',
                                transform: 'rotate(0deg)'
                            }}
                        />
                    )
                )}
            </ListItemButton>

            {props.child && (
                <Collapse
                    component={motion.div}
                    variants={childVariants}
                    initial="hidden"
                    animate={open ? "visible" : "hidden"}
                    in={open}
                    timeout="auto"
                >
                    <List
                        component="div"
                        disablePadding
                        sx={{ pl: 1 }}
                    >
                        {props.child.map((item, index) => {
                            // Check if this child item should be visible based on permissions
                            if (!item.permission || permissions.includes(item.permission)) {
                                // Check if this is the active route
                                const isChildActive = window.location.pathname === item.route;

                                // If item has children, render a nested MenuItem
                                if (item.child && permissions.includes(item.permission)) {
                                    return (
                                        <MenuItem
                                            key={index}
                                            permissions={permissions}
                                            onClick={onClick}
                                            active={isChildActive}
                                            expanded={expanded}
                                            {...item}
                                        />
                                    );
                                }

                                // Otherwise render a regular list item
                                return (
                                    <ListItemButton
                                        key={index}
                                        sx={{
                                            pl: 3,
                                            py: 0.75,
                                            borderRadius: '0 24px 24px 0',
                                            mx: 1,
                                            mb: 0.5,
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            ...(isChildActive && {
                                                color: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                fontWeight: 500,

                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '25%',
                                                    height: '50%',
                                                    width: '3px',
                                                    borderRadius: '0 2px 2px 0',
                                                    backgroundColor: theme.palette.primary.main,
                                                },
                                            }),

                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            }
                                        }}
                                        selected={isChildActive}
                                        onClick={onClick(item.route)}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: '28px',
                                                color: isChildActive ? theme.palette.primary.main : theme.palette.text.secondary,
                                                opacity: isChildActive ? 1 : 0.7,
                                            }}
                                        >
                                            {item.icon ? (
                                                item.icon
                                            ) : (
                                                <KeyboardArrowRight fontSize="small" />
                                            )}
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontSize: '0.815rem',
                                                        fontWeight: isChildActive ? 500 : 400,
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                );
                            }

                            return null;
                        })}
                    </List>
                </Collapse>
            )}
        </>
    );
};

export default MenuItem;
