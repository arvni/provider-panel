import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Typography,
    Paper,
    Stack,
    Badge,
    Chip,
    Alert,
    Snackbar,
    Fade,
    useTheme,
    alpha,
    useMediaQuery, Tooltip
} from "@mui/material";
import {
    ShoppingCart as ShoppingCartIcon,
    Science as ScienceIcon,
    FilterList as FilterIcon,
    Sort as SortIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Search as SearchIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon
} from "@mui/icons-material";

import { useGetData } from "@/Services/api";
import TestCard from "./TestCard";
import TestSearchForm from "./TestSearchForm";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Enhanced TestMethodForm integrating all improved components
 */
const TestMethodForm = (props) => {
    const theme = useTheme();
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

    // State management
    const [tests, setTests] = useState([]);
    const [searchParams, setSearchParams] = useState({});
    const [sortOrder, setSortOrder] = useState("name_asc");
    const [showFilters, setShowFilters] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
    const [recentSearches, setRecentSearches] = useState([]);
    const { getData, loading } = useGetData();

    // Load initial tests
    useEffect(() => {
        handleTestSearch({});

        // Load recent searches from localStorage
        const storedSearches = localStorage.getItem('recentTestSearches');
        if (storedSearches) {
            try {
                setRecentSearches(JSON.parse(storedSearches));
            } catch (e) {
                console.error("Failed to parse stored searches", e);
            }
        }
    }, []);

    // Handle test search with sorting and filters
    const handleTestSearch = (values) => {
        // Save search parameters
        setSearchParams(values);

        // Add sort order to search params
        const searchData = {
            ...values,
            sort: sortOrder
        };

        // Show loading notification for better UX
        if (Object.keys(values).length > 0 && values.search) {
            showNotification(`Searching for "${values.search}"...`, 'info');
        }

        // Fetch data from API
        return getData(route("api.user.tests.list"), searchData)
            .then(res => {
                setTests(res.data);

                // Show results notification
                if (values.search) {
                    if (res.data.length === 0) {
                        showNotification(`No tests found for "${values.search}"`, 'warning');
                    } else {
                        showNotification(`Found ${res.data.length} tests for "${values.search}"`, 'success');
                    }
                }

                return res.data;
            })
            .catch(error => {
                console.error("Search error:", error);
                showNotification("An error occurred while searching. Please try again.", 'error');
                return [];
            });
    };

    // Toggle test selection
    const toggleSelect = (id) => {
        let tmp = [...props.tests];
        let orderIndex = props.tests.findIndex((item) => item.id === id);

        if (orderIndex !== -1) {
            // Remove test
            tmp.splice(orderIndex, 1);
            showNotification("Test removed from selection", 'info');
        } else {
            // Add test
            let testIndex = tests.findIndex((item) => item.id === id);
            if (testIndex !== -1 && tests[testIndex]) {
                tmp.push(tests[testIndex]);
                showNotification("Test added to selection", 'success');
            }
        }

        props.onChange("tests", tmp);
        return handleTestSearch(searchParams);
    };

    // Handle test deletion
    const handleDeleteTest = (id) => () => {
        if (id !== undefined) {
            toggleSelect(id);
        }
    };

    // Toggle sort order
    const toggleSortOrder = () => {
        const newSortOrder = sortOrder === "name_asc" ? "name_desc" : "name_asc";
        setSortOrder(newSortOrder);
        handleTestSearch({
            ...searchParams,
            sort: newSortOrder
        });
    };

    // Toggle filters visibility
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Handle recent search saving
    const handleSaveSearch = (searches) => {
        setRecentSearches(searches);
    };

    // Show notification
    const showNotification = (message, type = 'info') => {
        setNotification({
            open: true,
            message,
            type
        });
    };

    // Close notification
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    // Animations
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

    return (
        <Box
            component={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            sx={{ width: "100%" }}
        >
            {/* Search section */}
            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
            >
                <TestSearchForm
                    onSearch={handleTestSearch}
                    recentSearches={recentSearches}
                    onSaveSearch={handleSaveSearch}
                    showFilters={showFilters}
                    onToggleFilters={toggleFilters}
                    defaultValues={searchParams}
                />
            </Box>

            {/* Controls and stats */}
            <Box
                component={motion.div}
                variants={itemVariants}
                sx={{
                    mb: 3,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <ScienceIcon color="primary" />
                        Available Tests
                        {!loading && (
                            <Chip
                                label={tests.length}
                                color="primary"
                                size="small"
                                variant="outlined"
                                sx={{
                                    fontWeight: 600,
                                    borderRadius: 1
                                }}
                            />
                        )}
                    </Typography>

                    {/* Additional filters and sorts */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={`Sort by name (${sortOrder === "name_asc" ? "A-Z" : "Z-A"})`}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={toggleSortOrder}
                                startIcon={<SortIcon />}
                                endIcon={sortOrder === "name_asc" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    textTransform: 'none',
                                    '& .MuiButton-endIcon': {
                                        ml: 0.5,
                                    }
                                }}
                            >
                                {sortOrder === "name_asc" ? "A-Z" : "Z-A"}
                            </Button>
                        </Tooltip>

                        <Tooltip title="Toggle advanced filters">
                            <Button
                                size="small"
                                variant={showFilters ? "contained" : "outlined"}
                                color={showFilters ? "primary" : "inherit"}
                                onClick={toggleFilters}
                                startIcon={<FilterIcon />}
                                sx={{
                                    borderRadius: 1.5,
                                    textTransform: 'none'
                                }}
                            >
                                Filters
                            </Button>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Selected tests badge */}
                <Badge
                    badgeContent={props.tests.length}
                    color="primary"
                    showZero
                    sx={{
                        '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            minWidth: 20,
                            height: 20,
                        }
                    }}
                >
                    <Chip
                        icon={<ShoppingCartIcon />}
                        label="Selected Tests"
                        color={props.tests.length > 0 ? "primary" : "default"}
                        variant={props.tests.length > 0 ? "filled" : "outlined"}
                        sx={{
                            fontWeight: 500,
                            borderRadius: 1.5,
                            px: 1
                        }}
                    />
                </Badge>
            </Box>

            {/* Main content area */}
            <Grid
                container
                spacing={3}
                component={motion.div}
                variants={itemVariants}
            >
                {/* Tests catalog */}
                <Grid
                    item
                    xs={12}
                    md={7}
                    lg={8}
                    order={{ xs: 2, md: 1 }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            height: '100%',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            p: 2,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {loading ? (
                            // Loading state
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    py: 8
                                }}
                            >
                                <CircularProgress size={50} sx={{ mb: 3 }} />
                                <Typography variant="body1" color="text.secondary">
                                    Loading tests...
                                </Typography>
                            </Box>
                        ) : tests.length > 0 ? (
                            // Tests list
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                    maxHeight: { xs: '500px', lg: '60vh' },
                                    overflowY: 'auto',
                                    pr: 1,
                                    flex: 1,
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'transparent',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: alpha(theme.palette.primary.main, 0.2),
                                        borderRadius: '3px',
                                    },
                                }}
                            >
                                <AnimatePresence>
                                    {tests.map((test) => (
                                        <motion.div
                                            key={test.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <TestCard
                                                selected={props.tests?.findIndex((item) => item.id === test.id) !== -1}
                                                test={test}
                                                onSelect={toggleSelect}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </Box>
                        ) : (
                            // Empty state
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 6,
                                    textAlign: 'center',
                                    flex: 1
                                }}
                            >
                                <SearchIcon
                                    sx={{
                                        fontSize: 60,
                                        color: alpha(theme.palette.text.secondary, 0.5),
                                        mb: 2
                                    }}
                                />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No tests found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                                    {Object.keys(searchParams).length > 0 && searchParams.search
                                        ? `No tests match your search for "${searchParams.search}". Try adjusting your search or filters.`
                                        : "Use the search bar above to find tests by name, category, or method."}
                                </Typography>
                                {Object.keys(searchParams).length > 0 && searchParams.search && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<SearchIcon />}
                                        onClick={() => handleTestSearch({})}
                                        sx={{
                                            borderRadius: 1.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Show All Tests
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Selected tests sidebar */}
                <Grid
                    item
                    xs={12}
                    md={5}
                    lg={4}
                    order={{ xs: 1, md: 2 }}
                >
                    <Box component="form" onSubmit={props.onSubmit} sx={{ height: '100%' }}>
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: theme.palette.divider,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%'
                            }}
                        >
                            {/* Order header */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    borderBottom: '1px solid',
                                    borderColor: theme.palette.divider,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ShoppingCartIcon color="primary" />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Selected Tests
                                    </Typography>
                                    <Chip
                                        label={props.tests.length}
                                        color="primary"
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            minWidth: 28,
                                            height: 24
                                        }}
                                    />
                                </Box>

                                <Button
                                    disabled={!props.tests.length}
                                    variant="contained"
                                    type="submit"
                                    color="primary"
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                        borderRadius: 1.5,
                                        textTransform: 'none',
                                        px: { xs: 2, md: 3 },
                                        boxShadow: 'none',
                                        '&:hover': {
                                            boxShadow: theme.shadows[2]
                                        }
                                    }}
                                >
                                    {isTablet ? 'Continue' : 'Continue with Selection'}
                                </Button>
                            </Box>

                            {/* Selected tests list */}
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: props.tests.length === 0 ? 'center' : 'flex-start',
                                    overflowY: 'auto',
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: 'transparent',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: alpha(theme.palette.primary.main, 0.2),
                                        borderRadius: '3px',
                                    },
                                }}
                            >
                                {props.tests.length === 0 ? (
                                    // Empty state
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: 3,
                                            textAlign: 'center'
                                        }}
                                    >
                                        <ShoppingCartIcon
                                            sx={{
                                                fontSize: 50,
                                                color: alpha(theme.palette.text.secondary, 0.5),
                                                mb: 2
                                            }}
                                        />
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No tests selected
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Add tests from the catalog to continue with your order.
                                        </Typography>
                                    </Box>
                                ) : (
                                    // List of selected tests
                                    <AnimatePresence>
                                        {props.tests.map((test) => (
                                            <motion.div
                                                key={`selected-${test.id}`}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha(theme.palette.divider, 0.5),
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        gap: 2
                                                    }}
                                                >
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            {test.name}
                                                        </Typography>

                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                mt: 0.5,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 0.5
                                                            }}
                                                        >
                                                            <ScienceIcon fontSize="small" color="action" />
                                                            Turnaround: {test.turnaroundTime} {parseInt(test.turnaroundTime, 10) === 1 ? 'day' : 'days'}
                                                        </Typography>
                                                    </Box>

                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        color="error"
                                                        onClick={handleDeleteTest(test.id)}
                                                        sx={{
                                                            minWidth: 0,
                                                            borderRadius: 1.5,
                                                            px: 1.5,
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </Box>

                            {/* Order summary */}
                            {props.tests.length > 0 && (
                                <Box
                                    sx={{
                                        p: 2,
                                        borderTop: '1px solid',
                                        borderColor: theme.palette.divider,
                                        bgcolor: theme.palette.background.paper
                                    }}
                                >
                                    <Alert
                                        severity="info"
                                        variant="outlined"
                                        icon={<InfoIcon />}
                                        sx={{
                                            borderRadius: 1.5,
                                            '& .MuiAlert-icon': {
                                                alignItems: 'center'
                                            }
                                        }}
                                    >
                                        You've selected {props.tests.length} {props.tests.length === 1 ? 'test' : 'tests'} for this order.
                                        {props.tests.length > 0 && (
                                            <Button
                                                color="info"
                                                size="small"
                                                type="submit"
                                                sx={{ ml: 1, textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Continue
                                            </Button>
                                        )}
                                    </Alert>
                                </Box>
                            )}
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                TransitionComponent={Fade}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.type}
                    variant="filled"
                    sx={{
                        width: '100%',
                        boxShadow: theme.shadows[3],
                        '& .MuiAlert-icon': {
                            alignItems: 'center'
                        }
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TestMethodForm;
