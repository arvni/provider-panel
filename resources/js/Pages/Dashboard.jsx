import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Button,
    Skeleton,
    useTheme,
    Avatar,
    alpha,
} from "@mui/material";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import LightModeIcon from '@mui/icons-material/LightMode';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddOrderByBarcode from "@/Components/AddOrderByBarcode.jsx";
import { motion } from "framer-motion";
import { Link } from "@inertiajs/react";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Enhanced greeting component with animations and time-based content
 */
export const Greeting = () => {
    const theme = useTheme();
    const myDate = new Date();
    const hours = myDate.getHours();
    const userName = route().params.user?.name || "";

    // States for animated content
    const [timeString, setTimeString] = useState("");
    const [dateString, setDateString] = useState("");

    // Update time every minute
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDateString(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
        };

        // Update immediately
        updateTime();

        // Set interval for updates
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    let icon, greeting, color;

    if (hours < 12) {
        icon = <WbTwilightIcon sx={{ fontSize: 40 }} color="warning" />;
        greeting = "Good Morning";
        color = theme.palette.warning.main;
    } else if (hours >= 12 && hours <= 17) {
        icon = <LightModeIcon sx={{ fontSize: 40 }} color="warning" />;
        greeting = "Good Afternoon";
        color = theme.palette.warning.main;
    } else {
        icon = <Brightness3Icon sx={{ fontSize: 40 }} color="primary" />;
        greeting = "Good Evening";
        color = theme.palette.primary.main;
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
            gap: 1.5
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {icon}
            </motion.div>

            <Typography
                variant="h4"
                component={motion.h2}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                sx={{
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${color} 30%, ${theme.palette.primary.main} 90%)`,
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    mb: 0
                }}
            >
                {greeting}{userName ? `, ${userName.split(' ')[0]}` : "!"}
            </Typography>

            <Typography
                variant="h6"
                component={motion.div}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                sx={{
                    fontWeight: 400,
                    fontSize: '1.1rem',
                    color: theme.palette.text.secondary,
                    mb: 2
                }}
            >
                {timeString}
            </Typography>

            <Chip
                label={dateString}
                variant="outlined"
                size="small"
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                sx={{
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    borderColor: alpha(theme.palette.divider, 0.8)
                }}
            />
        </Box>
    );
};

/**
 * Enhanced Dashboard component with improved layout and visualizations
 */
export default function Dashboard({ auth, recentlyOrders = [], notDownloadedReports = 0 }) {
    const theme = useTheme();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Simulate refresh functionality
    const handleRefresh = () => {
        setIsRefreshing(true);

        // Simulate API call
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.4 }
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        const statusMap = {
            'completed': 'success',
            'pending': 'warning',
            'in progress': 'info',
            'cancelled': 'error',
            'processing': 'primary'
        };

        return statusMap[status?.toLowerCase()] || 'default';
    };

    return (
        <AdminLayout auth={auth} breadcrumbs={[]} title="Dashboard">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <Grid container spacing={3}>
                    {/* Information cards row */}
                    <Grid item xs={12} md={4} lg={3}>
                        <Grid container spacing={3} height="100%">
                            {/* Greeting card */}
                            <Grid item xs={12} component={motion.div} variants={itemVariants}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 2,
                                        backgroundColor: theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.primary.dark, 0.2)
                                            : alpha(theme.palette.primary.light, 0.1),
                                        border: '1px solid',
                                        borderColor: theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.primary.dark, 0.4)
                                            : alpha(theme.palette.primary.light, 0.4),
                                        overflow: 'hidden',
                                        position: 'relative',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: theme.palette.mode === 'dark'
                                                ? 'radial-gradient(circle at top right, rgba(66, 165, 245, 0.1), transparent 70%)'
                                                : 'radial-gradient(circle at top right, rgba(66, 165, 245, 0.1), transparent 70%)',
                                            zIndex: 0
                                        }
                                    }}
                                >
                                    <Box sx={{ zIndex: 1 }}>
                                        <Greeting />
                                    </Box>
                                </Paper>
                            </Grid>
                            {/* Reports card */}
                            <Grid item xs={12} component={motion.div} variants={itemVariants}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        height: "100%",
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: "center",
                                        alignItems: "center",
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        backgroundColor: theme.palette.background.paper,
                                        transition: 'transform 0.3s, box-shadow 0.3s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                                        }
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Avatar
                                            sx={{
                                                bgcolor: notDownloadedReports > 0 ? theme.palette.success.light : theme.palette.grey[300],
                                                width: 60,
                                                height: 60,
                                                mb: 2,
                                                mx: 'auto'
                                            }}
                                        >
                                            <DescriptionIcon sx={{ color: 'white', fontSize: 30 }} />
                                        </Avatar>
                                    </motion.div>

                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontWeight: 700,
                                            color: notDownloadedReports > 0 ? theme.palette.success.main : theme.palette.text.primary,
                                            mb: 1
                                        }}
                                    >
                                        {isRefreshing ? <Skeleton width={60} height={60} /> : notDownloadedReports}
                                    </Typography>

                                    <Typography
                                        variant="body1"
                                        align="center"
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            mb: 2
                                        }}
                                    >
                                        Reports Ready To Download
                                    </Typography>

                                    {notDownloadedReports > 0 && (
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            size="small"
                                            component={Link}
                                            href={route('reports.index')}
                                            startIcon={<FileDownloadIcon />}
                                            sx={{
                                                borderRadius: '8px',
                                                textTransform: 'none',
                                            }}
                                        >
                                            View Reports
                                        </Button>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={8} lg={9} component={motion.div} variants={itemVariants}>
                        <Grid container  spacing={3}>
                            {/* Latest orders table */}
                            <Grid item xs={12} component={motion.div} variants={itemVariants}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid',
                                            borderColor: theme.palette.divider
                                        }}
                                    >
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Latest Orders
                                        </Typography>

                                        <Box>
                                            <Tooltip title="Refresh data">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleRefresh}
                                                    sx={{
                                                        transition: 'transform 0.3s',
                                                        ...(isRefreshing && {
                                                            animation: 'spin 1s linear infinite',
                                                        }),
                                                        '@keyframes spin': {
                                                            '0%': { transform: 'rotate(0deg)' },
                                                            '100%': { transform: 'rotate(360deg)' }
                                                        }
                                                    }}
                                                >
                                                    <RefreshIcon />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="View all orders">
                                                <IconButton
                                                    size="small"
                                                    component={Link}
                                                    href={route('orders.index')}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <ArrowForwardIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>

                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                                                    <TableCell>Patient Name</TableCell>
                                                    <TableCell>Tests</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Latest Update</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {isRefreshing ? (
                                                    // Loading state
                                                    Array(5).fill(0).map((_, index) => (
                                                        <TableRow key={`skeleton-${index}`}>
                                                            <TableCell><Skeleton width={150} /></TableCell>
                                                            <TableCell><Skeleton width={100} /></TableCell>
                                                            <TableCell><Skeleton width={80} /></TableCell>
                                                            <TableCell><Skeleton width={90} /></TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : recentlyOrders.length > 0 ? (
                                                    // Orders list
                                                    recentlyOrders.map(order => (
                                                        <TableRow
                                                            key={"order-" + order.id}
                                                            sx={{
                                                                '&:hover': {
                                                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                                                    cursor: 'pointer'
                                                                }
                                                            }}
                                                            onClick={() => window.location.href = route('orders.show', order.id)}
                                                        >
                                                            <TableCell sx={{ fontWeight: 500 }}>
                                                                {order.patient_full_name}
                                                            </TableCell>
                                                            <TableCell>
                                                                {order.tests_name.split(',').map((test, i) => (
                                                                    <Chip
                                                                        key={i}
                                                                        label={test.trim()}
                                                                        size="small"
                                                                        sx={{
                                                                            mr: 0.5,
                                                                            mb: 0.5,
                                                                            fontSize: '0.7rem',
                                                                            height: 20
                                                                        }}
                                                                    />
                                                                ))}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={order.status}
                                                                    size="small"
                                                                    color={getStatusColor(order.status)}
                                                                    sx={{ fontWeight: 500 }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {new Date(order.updated_at).toLocaleDateString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    // Empty state
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                No recent orders found
                                                            </Typography>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ mt: 2, textTransform: 'none' }}
                                                                component={Link}
                                                                href={route('orders.create')}
                                                            >
                                                                Create New Order
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Paper>
                            </Grid>
                            {/* Barcode scanner section */}
                            <Grid item xs={12} component={motion.div} variants={itemVariants}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: theme.palette.divider,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        Quick Order Access
                                    </Typography>
                                    <AddOrderByBarcode />
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </motion.div>
        </AdminLayout>
    );
}
