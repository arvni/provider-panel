import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Button,
    List,
    TextField,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Backdrop,
    Typography,
    InputAdornment,
    IconButton,
    Alert,
    Paper,
    Tooltip,
    Divider,
    Zoom,
    alpha,
    useMediaQuery,
    useTheme
} from "@mui/material";
import { useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import BarcodeIcon from '@mui/icons-material/QrCodeScanner';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import ScienceIcon from '@mui/icons-material/Science';
import ClearIcon from '@mui/icons-material/Clear';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DescriptionIcon from '@mui/icons-material/Description';

/**
 * Enhanced AddOrderByBarcode component with improved UX and visual design
 */
const AddOrderByBarcode = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [barcode, setBarcode] = useState("");
    const [open, setOpen] = useState(false);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef(null);

    const {
        reset,
        data,
        setData,
        errors,
        post,
        processing,
        clearErrors,
        setError
    } = useForm({ barcode: "", test: null });

    // Focus the input field when component mounts
    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
            }, 500);
        }
    }, []);

    // Handle add order submission
    const handleAddOrder = () => {
        if (!data.test) {
            setError("test", "Please select a test");
            return;
        }

        if (data.barcode) {
            post(route("orders.create-by-barcode"), {
                onSuccess: () => {
                    handleClose();
                }
            });
        } else {
            setError("barcode", "Please enter the barcode");
        }
    };

    // Handle barcode input change
    const handleChange = (e) => {
        const value = e.target.value;
        setData("barcode", value);
        setBarcode(value);
        clearErrors("barcode");
    };

    // Open test list dialog
    const openTestList = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        clearErrors();

        if (barcode) {
            setOpen(true);
            fetchTests();
        } else {
            setError("barcode", "Please enter the barcode");
        }
    };

    // Fetch tests from the server
    const fetchTests = () => {
        setLoading(true);
        setTests([]);

        axios.get(route("tests-by-barcode", { barcode }))
            .then((res) => {
                setTests(res.data.tests);
                // Auto-select if only one test
                if (res.data.tests.length === 1) {
                    setData("test", res.data.tests[0]);
                }
            })
            .catch((res) => {
                setError("barcode", res.response.data.message);
                setOpen(false);
            })
            .finally(() => setLoading(false));
    };

    // Handle test selection
    const handleTestSelect = (test) => () => {
        setData("test", test);
    };

    // Close dialog and reset form
    const handleClose = () => {
        setOpen(false);
        reset();
        setBarcode("");
        setTests([]);
        setSearchTerm("");

        // Re-focus the input field
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 300);
    };

    // Clear the barcode input
    const handleClearBarcode = () => {
        setData("barcode", "");
        setBarcode("");
        clearErrors("barcode");

        // Focus the input field
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Handle search term change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter tests based on search term
    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Paper
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                elevation={0}
                sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontWeight: 500,
                        color: theme.palette.text.secondary
                    }}
                >
                    <BarcodeIcon color="primary" fontSize="small" />
                    Quickly add an order by scanning or entering a barcode
                </Typography>

                <Box
                    component="form"
                    onSubmit={openTestList}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 3 },
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                    }}
                >
                    <TextField
                        error={errors.hasOwnProperty("barcode")}
                        label="Scan Barcode"
                        placeholder="Scan or type barcode..."
                        helperText={errors?.barcode}
                        onChange={handleChange}
                        value={data.barcode}
                        inputRef={inputRef}
                        autoComplete="off"
                        fullWidth
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <BarcodeIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: data.barcode && (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="clear barcode"
                                        onClick={handleClearBarcode}
                                        edge="end"
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 2,
                                height: 56,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                },
                                '&.Mui-focused': {
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                }
                            }
                        }}
                        sx={{
                            flexGrow: 1,
                            maxWidth: { sm: '60%', md: '70%' },
                        }}
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            flexDirection: { xs: 'row', sm: 'row' },
                            justifyContent: { xs: 'center', sm: 'flex-start' },
                            width: { xs: '100%', sm: 'auto' }
                        }}
                    >
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={processing || loading}
                            startIcon={processing || loading ? <CircularProgress size={20} /> : <SearchIcon />}
                            sx={{
                                borderRadius: 2,
                                height: 56,
                                px: 3,
                                boxShadow: 'none',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                flexGrow: { xs: 1, sm: 0 },
                                '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            Find Tests
                        </Button>

                        <Tooltip title="Reset form">
                            <IconButton
                                aria-label="reset form"
                                onClick={handleClearBarcode}
                                sx={{
                                    height: 56,
                                    width: 56,
                                    border: '1px solid',
                                    borderColor: theme.palette.divider,
                                    borderRadius: 2,
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                <SettingsBackupRestoreIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Selected test indicator */}
                <AnimatePresence>
                    {data.test && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderRadius: 2,
                                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.success.main, 0.2),
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScienceIcon color="success" />
                                    <Typography variant="body2" fontWeight={500}>
                                        Selected Test: <strong>{data.test.name}</strong>
                                    </Typography>
                                </Box>

                                <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<DescriptionIcon />}
                                    onClick={handleAddOrder}
                                    sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    Create Order
                                </Button>
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Paper>

            {/* Loading backdrop */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(5px)'
                }}
                open={loading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>

            {/* Test selection dialog */}
            <Dialog
                open={open && !loading}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                TransitionComponent={Zoom}
                PaperProps={{
                    elevation: 5,
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 2
                    }}
                >
                    <ScienceIcon />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Select Test for Barcode {barcode}
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CancelIcon />
                    </IconButton>
                </DialogTitle>

                <Box sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        aria-label="clear search"
                                        onClick={() => setSearchTerm("")}
                                        edge="end"
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 1.5 }
                        }}
                    />
                </Box>

                <DialogContent dividers sx={{ p: 0 }}>
                    {tests.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 4,
                                px: 2,
                                textAlign: 'center'
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={40} sx={{ mb: 2 }} />
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                                        No tests found for this barcode.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Please check the barcode or try again.
                                    </Typography>
                                </>
                            )}
                        </Box>
                    ) : filteredTests.length === 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                py: 4,
                                px: 2,
                                textAlign: 'center'
                            }}
                        >
                            <Typography variant="body1" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                                No matching tests found.
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setSearchTerm("")}
                                startIcon={<ClearIcon />}
                                sx={{ mt: 1 }}
                            >
                                Clear Search
                            </Button>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {filteredTests.map((test, index) => (
                                <React.Fragment key={test.id}>
                                    <ListItemButton
                                        selected={data?.test?.id === test.id}
                                        onClick={handleTestSelect(test)}
                                        sx={{
                                            py: 2,
                                            borderLeft: '5px solid',
                                            borderLeftColor: data?.test?.id === test.id
                                                ? theme.palette.primary.main
                                                : 'transparent',
                                            transition: 'all 0.2s',
                                            '&.Mui-selected': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            },
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            }
                                        }}
                                    >
                                        <ListItemIcon sx={{ color: data?.test?.id === test.id ? theme.palette.primary.main : 'inherit' }}>
                                            {data?.test?.id === test.id ? <CheckIcon /> : <ScienceIcon />}
                                        </ListItemIcon>

                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" fontWeight={data?.test?.id === test.id ? 600 : 400}>
                                                    {test.name}
                                                </Typography>
                                            }
                                            secondary={test.description || `Test ID: ${test.id}`}
                                        />
                                    </ListItemButton>
                                    {index < filteredTests.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        color="inherit"
                        startIcon={<CancelIcon />}
                        sx={{ borderRadius: 1.5 }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleAddOrder}
                        disabled={!data.test}
                        startIcon={<CheckIcon />}
                        sx={{
                            borderRadius: 1.5,
                            px: 3,
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            }
                        }}
                    >
                        Create Order
                    </Button>
                </DialogActions>

                {errors.test && (
                    <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
                        {errors.test}
                    </Alert>
                )}
            </Dialog>
        </>
    );
};

export default AddOrderByBarcode;
