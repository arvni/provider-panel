import React, {useState, useEffect} from "react";
import {Link, useForm} from "@inertiajs/react";
import {
    Typography,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Divider,
    Tooltip,
    Badge,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    Fade,
    Button,
    alpha,
    useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import {
    Brightness4,
    Brightness7,
    LockOutlined,
    ExitToApp,
    Person,
    Settings,
    NotificationsNone
} from "@mui/icons-material";
import AppBar from "@/Layouts/Components/AppBar";
import Breadcrumb from "@/Layouts/Components/Breadcrumb";
import ChangePassword from "@/Pages/User/Components/ChangePassword";
import {changePasswordValidator} from "@/Services/validate";
import {useSnackbar} from "notistack";
import {motion, AnimatePresence} from "framer-motion";
import NotificationButton from "@/Layouts/Components/Notification/NotificationButton.jsx";

/**
 * Enhanced Header component with improved user experience and visual design
 */
export default function Header({toggleDrawer, auth, breadcrumbs, open, colorMode, toggleColorMode}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = useState(null);
    const [openChangePassword, setOpenChangePassword] = useState(false);
    const [showProfileCard, setShowProfileCard] = useState(false);
    const {enqueueSnackbar} = useSnackbar();

    const {data, setData, setError, errors, reset, post} = useForm({
        current: "",
        password: "",
        password_confirmation: "",
        _method: "put"
    });

    // Get user's initials for avatar
    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    // Handle password change submission
    const changePassword = () => {
        if (changePasswordValidator(data, true, setError, auth.user)) {
            post(route("password.update"), {
                onSuccess: () => {
                    reset();
                    setOpenChangePassword(false);
                    enqueueSnackbar("Password changed successfully", {
                        variant: "success",
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'right',
                        }
                    });
                }
            });
        }
    };

    // Close modal handlers
    const handleCloseOpenChangePassword = () => {
        setOpenChangePassword(false);
        reset();
    };

    // Open modal handlers
    const handleOpenChangePassword = () => {
        setOpenChangePassword(true);
        handleClose();
    };

    // Menu handlers
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Close menu when window resizes
    useEffect(() => {
        const handleResize = () => {
            if (anchorEl) {
                handleClose();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [anchorEl]);

    return (
        <>
            <AppBar
                position="absolute"
                open={open}
                elevation={3}
                sx={{
                    backdropFilter: 'blur(8px)',
                    backgroundColor: alpha(theme.palette.background.paper, 0.85),
                }}
            >
                <Toolbar
                    sx={{
                        pr: {xs: 1, sm: 2, md: 3},
                        pl: {xs: 1, sm: 2, md: 3},
                        height: 64,
                        transition: 'padding 0.3s ease',
                    }}
                >
                    {/* Menu icon (only shown when drawer is closed) */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer}
                        sx={{
                            mr: {xs: 1, sm: 2, md: 3},
                            ...(open && {display: 'none'}),
                            borderRadius: 1.5,
                            transition: 'all 0.2s',
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        <MenuIcon/>
                    </IconButton>

                    {/* Breadcrumb navigation */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        component={motion.div}
                        layout
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={breadcrumbs?.length}
                                initial={{opacity: 0, y: -10}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: 10}}
                                transition={{duration: 0.3}}
                                style={{width: '100%'}}
                            >
                                <Breadcrumb breadcrumbs={breadcrumbs}/>
                            </motion.div>
                        </AnimatePresence>
                    </Box>

                    {/* Action buttons section */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: {xs: 0.5, sm: 1}}}>
                        {/* Theme toggle button */}
                        {toggleColorMode && (
                            <Tooltip title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                                <IconButton
                                    size="medium"
                                    color="inherit"
                                    onClick={toggleColorMode}
                                    sx={{
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        }
                                    }}
                                >
                                    {colorMode === 'dark' ? <Brightness7/> : <Brightness4/>}
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Notifications button*/}
                        <NotificationButton/>

                        {/* User profile button */}
                        <Box
                            sx={{
                                position: 'relative',
                                ml: {xs: 0.5, sm: 1}
                            }}
                            onMouseEnter={() => !isMobile && setShowProfileCard(true)}
                            onMouseLeave={() => !isMobile && setShowProfileCard(false)}
                        >
                            <Tooltip title={auth.user.name}>
                                <IconButton
                                    size="medium"
                                    aria-label="account menu"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={handleMenu}
                                    color="inherit"
                                    sx={{
                                        p: 0.5,
                                        borderRadius: 1.5,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        }
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: theme.palette.primary.main,
                                            color: theme.palette.primary.contrastText,
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.05)',
                                            }
                                        }}
                                    >
                                        {getInitials(auth.user.name)}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>

                            {/* Quick profile card (desktop only) */}
                            <Fade in={showProfileCard && !isMobile}>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 45,
                                        width: 300,
                                        backgroundColor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        boxShadow: theme.shadows[10],
                                        p: 2,
                                        zIndex: 1300,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.5,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: -8,
                                            right: 16,
                                            width: 16,
                                            height: 16,
                                            backgroundColor: theme.palette.background.paper,
                                            transform: 'rotate(45deg)',
                                            borderTop: '1px solid',
                                            borderLeft: '1px solid',
                                            borderColor: theme.palette.divider,
                                            zIndex: -1,
                                        }
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                        <Avatar
                                            sx={{
                                                width: 50,
                                                height: 50,
                                                bgcolor: theme.palette.primary.main,
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                            }}
                                        >
                                            {getInitials(auth.user.name)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {auth.user.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary"
                                                        sx={{wordBreak: 'break-all'}}>
                                                {auth.user.email}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider/>

                                    <Box sx={{display: 'flex', gap: 1}}>
                                        {/*<Button*/}
                                        {/*    startIcon={<Person/>}*/}
                                        {/*    variant="outlined"*/}
                                        {/*    size="small"*/}
                                        {/*    sx={{flex: 1, textTransform: 'none'}}*/}
                                        {/*>*/}
                                        {/*    Profile*/}
                                        {/*</Button>*/}
                                        <Button
                                            startIcon={<LockOutlined/>}
                                            variant="outlined"
                                            size="small"
                                            onClick={handleOpenChangePassword}
                                            sx={{flex: 1, textTransform: 'none'}}
                                        >
                                            Password
                                        </Button>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        component={Link}
                                        href={route('logout')}
                                        method="post"
                                        startIcon={<ExitToApp/>}
                                        sx={{
                                            textTransform: 'none',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: theme.shadows[2],
                                            }
                                        }}
                                    >
                                        Sign Out
                                    </Button>
                                </Box>
                            </Fade>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Change Password Modal */}
            <ChangePassword
                setData={setData}
                data={data}
                setError={setError}
                errors={errors}
                onSubmit={changePassword}
                currentNeeded={true}
                open={openChangePassword}
                onClose={handleCloseOpenChangePassword}
            />
        </>
    );
}
