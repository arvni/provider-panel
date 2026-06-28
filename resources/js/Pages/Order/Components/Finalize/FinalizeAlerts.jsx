import React from "react";
import { Alert, Box, Typography } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";

/**
 * The collapsible help guidance + success banners at the top of the Finalize
 * page. Both animate in/out via framer-motion.
 */
const FinalizeAlerts = ({ showHelp, onCloseHelp, showSuccess }) => (
    <>
        {/* Help section */}
        <AnimatePresence>
            {showHelp && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Alert
                        severity="info"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                alignItems: 'center'
                            }
                        }}
                        onClose={onCloseHelp}
                    >
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Order Finalization Guidelines
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Please review all information carefully before submitting your order.
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, mb: 0 }}>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">
                                    <strong>Review all sections:</strong> Ensure all patient and sample
                                    information is correct
                                </Typography>
                            </Box>
                            <Box component="li" sx={{ mb: 0.5 }}>
                                <Typography variant="body2">
                                    <strong>Submission:</strong> Once submitted, certain details cannot be
                                    modified
                                </Typography>
                            </Box>
                            <Box component="li">
                                <Typography variant="body2">
                                    <strong>Confirmation:</strong> You'll receive a confirmation email after
                                    submission
                                </Typography>
                            </Box>
                        </Box>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Alert
                        severity="success"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                alignItems: 'center'
                            }
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight={600}>
                            Order Successfully Submitted!
                        </Typography>
                        <Typography variant="body2">
                            Your order has been successfully submitted. We'll begin processing it right away.
                            You will be redirected to the orders list in a few seconds.
                        </Typography>
                    </Alert>
                </motion.div>
            )}
        </AnimatePresence>
    </>
);

export default FinalizeAlerts;
