import React from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import { Send, Warning as WarningIcon } from "@mui/icons-material";

/**
 * Confirmation dialog shown before an order is finalized + submitted.
 */
const ConfirmSubmitDialog = ({ open, onClose, onConfirm, processing, orderId }) => {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: theme.shadows[10]
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
            }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <WarningIcon color="warning" sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Confirm Order Submission
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Order ID: {orderId}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <DialogContentText>
                    <Typography variant="body1" paragraph>
                        Are you sure you want to finalize and submit this order?
                    </Typography>

                    <Box
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: alpha(theme.palette.warning.main, 0.05),
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: alpha(theme.palette.warning.main, 0.2)
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography variant="body2" fontWeight={600} color="warning.dark">
                                Important Notice:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • After submission, certain details cannot be modified
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • You will receive a confirmation email with order details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                • Please ensure all information is accurate before proceeding
                            </Typography>
                        </Stack>
                    </Box>
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, pt: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    startIcon={<Send />}
                    disabled={processing}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        px: 3,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: theme.shadows[2]
                        }
                    }}
                >
                    {processing ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmSubmitDialog;
