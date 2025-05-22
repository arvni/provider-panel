import {
    Alert, alpha,
    Box, Button, Chip, CircularProgress,
    Dialog, DialogActions, DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
    Typography,
    useMediaQuery,
    useTheme,
    Zoom
} from "@mui/material";

import {
LocalShipping as ShippingIcon,
    Close as CloseIcon,
    CalendarMonth as CalendarIcon,
    Send as SendIcon
} from "@mui/icons-material";
import {useEffect, useRef, useState} from "react";
import {router} from "@inertiajs/react";

/**
 * Helper function to get minimum date
 */
const minDate = () => {
    const timeZone = "Asia/Muscat";

    // Get the current date in the specified time zone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    // Format to YYYY-MM-DD for input value
    const now = new Date();
    const [month, , day, , year] = formatter.formatToParts(now).map(part => part.value);
    return `${year}-${month}-${day}`;
};

/**
 *  Send Request Form component
 */
const SendRequestForm = ({ open, onClose, orders }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const formRef = useRef();
    const [preferredDate, setPreferredDate] = useState(minDate());
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setPreferredDate(minDate());
            setErrors({});
            setIsSubmitting(false);
        }
    }, [open]);

    // Handle form submission
    const send = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (orders.length) {
            setIsSubmitting(true);

            router.post(
                route("orders.logistic"),
                {
                    selectedOrders: orders.map(item => item.id),
                    preferred_date: preferredDate
                },
                {
                    onSuccess: () => {
                        setIsSubmitting(false);
                        onClose();
                    },
                    onError: errs => {
                        setIsSubmitting(false);
                        setErrors(errs);
                    }
                }
            );
        }
    };

    const handleChange = (e) => setPreferredDate(e.target.value);

    return (
        <Dialog
            open={open}
            maxWidth="md"
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
                    px: 3,
                    py: 2,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <ShippingIcon sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Send Pickup Request
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onClose}
                    disabled={isSubmitting}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {isSubmitting && <LinearProgress />}

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                        {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Selected for Pickup
                    </Typography>

                    <Alert
                        severity="info"
                        variant="outlined"
                        sx={{ mb: 3, mt: 1 }}
                    >
                        Please review the selected orders and choose a preferred pickup date.
                    </Alert>
                </Box>

                <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Patient Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>Test Name</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order, index) => (
                                <TableRow
                                    key={order?.id}
                                    sx={{
                                        '&:nth-of-type(odd)': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                        }
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{order?.patient_full_name}</TableCell>
                                    <TableCell>
                                        {order?.tests?.map((test, i) => (
                                            <Chip
                                                key={i}
                                                label={test.name}
                                                size="small"
                                                sx={{
                                                    mr: 0.5,
                                                    mb: 0.5,
                                                    fontSize: '0.75rem',
                                                    height: 20
                                                }}
                                            />
                                        ))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box
                    component="form"
                    onSubmit={send}
                    ref={formRef}
                    sx={{
                        p: 3,
                        mt: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <TextField
                        name="prefered_date"
                        label="Preferred Pickup Date"
                        type="date"
                        onChange={handleChange}
                        value={preferredDate}
                        required
                        error={Boolean(errors?.preferred_date)}
                        helperText={errors?.preferred_date}
                        InputProps={{
                            startAdornment: <CalendarIcon color="action" sx={{ mr: 1 }} />,
                        }}
                        inputProps={{
                            min: minDate(),
                        }}
                        fullWidth
                        sx={{
                            maxWidth: { xs: '100%', sm: '300px' },
                            '& .MuiInputBase-root': {
                                borderRadius: 1.5,
                            }
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: theme.palette.divider }}>
                <Button
                    onClick={onClose}
                    disabled={isSubmitting}
                    color="inherit"
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    sx={{ borderRadius: 1.5 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    type="submit"
                    onClick={send}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{
                        borderRadius: 1.5,
                        boxShadow: 'none',
                        minWidth: 120,
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        }
                    }}
                >
                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SendRequestForm;
