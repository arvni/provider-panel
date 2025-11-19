import React, { useEffect, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Avatar, Tooltip, alpha, useMediaQuery } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { router } from "@inertiajs/react";
import ListMenuItem from "@/Layouts/Components/MenuItem.jsx";
import routes from "@/routes";
import logo from "@/../images/logo.png";
import logoIcon from "@/../images/logo-icon.png";

const drawerWidth = 260;

// Enhanced styled drawer with improved animations and responsiveness
const StyledDrawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => !['open', 'colorMode'].includes(prop)
})(({ theme, open, colorMode }) => ({
    width: open ? drawerWidth : theme.spacing(9),
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '@media print': {
        display: 'none !important',
    },

    '& .MuiDrawer-paper': {
        position: 'relative',
        width: drawerWidth,
        transition: theme.transitions.create(['width', 'background-color', 'box-shadow'], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
        }),
        boxSizing: 'border-box',
        backgroundColor: colorMode === 'dark' ? '#1a1a1a' : '#ffffff',
        backgroundImage: colorMode === 'dark'
            ? 'linear-gradient(rgba(26, 26, 26, 0.8), rgba(26, 26, 26, 0.9)), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232a3990\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
            : 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9)), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232a3990\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '30px 30px',
        boxShadow: colorMode === 'dark'
            ? '1px 0 8px rgba(0, 0, 0, 0.5)'
            : '1px 0 10px rgba(0, 0, 0, 0.05)',
        borderRight: colorMode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.05)',
        overflowX: 'hidden',

        // Collapse animation
        ...(!open && {
            overflowX: 'hidden',
            transition: theme.transitions.create(['width', 'box-shadow'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
            }),
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
            },
            boxShadow: 'none',
        }),

        // Mobile behavior
        [theme.breakpoints.down('sm')]: {
            position: 'fixed',
            height: '100%',
            zIndex: theme.zIndex.drawer,
            width: drawerWidth,
            left: open ? 0 : -drawerWidth,
            boxShadow: open ? '4px 0 25px rgba(0, 0, 0, 0.3)' : 'none',
        },
    },
}));

// Animation variants for menu items
const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.2
        }
    }
};

// Animation for drawer content
const drawerContentVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05
        }
    }
};

// Render menu items with permissions check
const renderMenu = (item, index, permissions, handleVisit, currentPath, open) => {
    const isVisible = !item?.permission || permissions.includes(item.permission);
    if (!isVisible) return null;

    // Check if current route matches this menu item
    const isActive = currentPath === item.route;

    return (
        <motion.div
            key={index}
            variants={menuItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <ListMenuItem
                permissions={permissions}
                onClick={handleVisit}
                active={isActive}
                expanded={open}
                {...item}
            />
        </motion.div>
    );
};

const Drawer = ({ toggleDrawer, auth, open, colorMode = 'light' }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeSection, setActiveSection] = useState('');
    const [currentPath, setCurrentPath] = useState('');

    // Group routes by section
    const routeSections = {};
    routes.forEach(route => {
        const section = route.section || 'Main';
        if (!routeSections[section]) {
            routeSections[section] = [];
        }
        routeSections[section].push(route);
    });

    // Get current path from window location
    useEffect(() => {
        // Extract path from the current URL
        const path = window.location.pathname;
        setCurrentPath(path);

        // Find matching route to set active section
        const currentRoute = routes.find(route => route.route === path);
        if (currentRoute) {
            setActiveSection(currentRoute.section || 'Main');
        }
    }, []);

    // Update current path when navigation occurs
    useEffect(() => {
        // Listen for Inertia navigation events to update the current path
        const handleNavigate = () => {
            const path = window.location.pathname;
            setCurrentPath(path);

            // Find matching route to set active section
            const currentRoute = routes.find(route => route.route === path);
            if (currentRoute) {
                setActiveSection(currentRoute.section || 'Main');
            }
        };

        document.addEventListener('inertia:success', handleNavigate);

        return () => {
            document.removeEventListener('inertia:success', handleNavigate);
        };
    }, []);

    // Handle navigation
    const handleVisit = (addr) => e => {
        if (isMobile) {
            toggleDrawer();
        }
        router.visit(addr, {
            preserveState: true
        });
    };

    return (
        <StyledDrawer
            variant={isMobile ? "temporary" : "permanent"}
            open={open}
            colorMode={colorMode}
            onClose={isMobile ? toggleDrawer : undefined}
        >
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1,
                    py: 1,
                    minHeight: 64,
                    borderBottom: '1px solid',
                    borderColor: colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                }}
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                overflow: 'hidden',
                                width: '100%',
                            }}
                        >
                            <Avatar
                                src={logoIcon}
                                alt="Bion"
                                variant="circular"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: '#f5f5f5',
                                    p: 0,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Typography
                                variant="h6"
                                component="h1"
                                noWrap
                                sx={{
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    color: theme.palette.primary.main
                                }}
                            >
                                Providers Panel
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                            }}
                        >
                            <Avatar
                                src={logo}
                                alt="Bion"
                                variant="rounded"
                                sx={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: '#f5f5f5',
                                    p: 0.5,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                        </Box>
                    )}
                </AnimatePresence>

                <Tooltip title={open ? "Collapse menu" : "Expand menu"}>
                    <IconButton
                        onClick={toggleDrawer}
                        sx={{
                            transition: 'all 0.2s',
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuOpenIcon />}
                    </IconButton>
                </Tooltip>
            </Toolbar>

            <Divider />

            <Box
                component={motion.div}
                variants={drawerContentVariants}
                initial="hidden"
                animate="visible"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100% - 64px)',
                    overflowX: "hidden",
                    overflowY: "auto",
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: colorMode === 'dark'
                            ? 'rgba(255, 255, 255, 0.2)'
                            : 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: colorMode === 'dark'
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(0, 0, 0, 0.2)',
                    },
                    scrollbarWidth: 'thin',
                    scrollbarColor: colorMode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2) transparent'
                        : 'rgba(0, 0, 0, 0.1) transparent',
                }}
            >
                {Object.entries(routeSections).map(([section, sectionRoutes]) => (
                    <Box key={section} sx={{ mb: 1 }}>
                        {/* Section title - only show when drawer is open */}
                        {open && (
                            <Typography
                                variant="overline"
                                component="h2"
                                sx={{
                                    px: 3,
                                    pt: 2,
                                    pb: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: colorMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {section}
                            </Typography>
                        )}

                        {/* Section menu items */}
                        <List component="nav" disablePadding>
                            {sectionRoutes.map((item, index) =>
                                renderMenu(item, `${section}-${index}`, auth.permissions, handleVisit, currentPath, open)
                            )}
                        </List>

                        {open && <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />}
                    </Box>
                ))}

                {/* User profile at bottom when drawer is open */}
                {open && (
                    <Box
                        sx={{
                            mt: 'auto',
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            borderTop: '1px solid',
                            borderColor: colorMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            backgroundColor: colorMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        }}
                    >
                        <Avatar
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                width: 40,
                                height: 40,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            {auth?.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography
                                variant="subtitle2"
                                noWrap
                                sx={{
                                    fontWeight: 600,
                                    lineHeight: 1.2
                                }}
                            >
                                {auth?.user?.name || 'User'}
                            </Typography>
                            <Typography
                                variant="caption"
                                noWrap
                                sx={{
                                    opacity: 0.7,
                                    display: 'block',
                                    lineHeight: 1.2
                                }}
                            >
                                {auth?.user?.email || ''}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </StyledDrawer>
    );
};

export default Drawer;
