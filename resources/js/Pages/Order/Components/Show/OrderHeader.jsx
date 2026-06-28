import React from "react";
import {
    Box,
    Button,
    IconButton,
    Stack,
    Tooltip,
    Typography,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Download as DownloadIcon,
    Print as PrintIcon,
    Assignment as AssignmentIcon,
    ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";
import { formatShortDate } from "@/Pages/Order/Components/orderDisplay";

/**
 * Order Show header: title + copy/print/download actions.
 */
const OrderHeader = ({ order }) => {
    const theme = useTheme();

    const handlePrint = () => {
        window.print();
    };

    const copyOrderId = () => {
        navigator.clipboard.writeText(order.id.toString());
    };

    return (
        <Box
            component={motion.div}
            variants={itemVariants}
            sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                mb: 3,
                pb: 2,
                borderBottom: "1px solid",
                borderColor: theme.palette.divider,
                "@media print": {
                    display: "block !important",
                    marginBottom: "3mm !important",
                    paddingBottom: "2mm !important",
                    borderBottom: "1px solid #000 !important",
                    pageBreakInside: "avoid",
                },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "@media print": {
                        gap: "1mm",
                    },
                }}
            >
                <Box
                    sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        "@media print": {
                            display: "none !important",
                        },
                    }}
                >
                    <AssignmentIcon />
                </Box>
                <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                            component="h1"
                            variant="h5"
                            fontWeight={700}
                            sx={{
                                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                                "@media print": {
                                    fontSize: "12px !important",
                                    fontWeight: "bold !important",
                                    margin: "0 !important",
                                    color: "#000 !important",
                                },
                            }}
                        >
                            Order #{order.id}
                        </Typography>
                        <Tooltip title="Copy Order ID">
                            <IconButton
                                size="small"
                                onClick={copyOrderId}
                                sx={{
                                    "@media print": {
                                        display: "none !important",
                                    },
                                }}
                            >
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            "@media print": {
                                fontSize: "8px !important",
                                color: "#666 !important",
                                margin: "0 !important",
                            },
                        }}
                    >
                        Created: {formatShortDate(order.created_at || order.createdAt)}
                    </Typography>
                </Box>
            </Box>

            <Stack
                direction="row"
                spacing={1}
                sx={{
                    "@media print": {
                        display: "none !important",
                    },
                }}
            >
                <Tooltip title="Print Order">
                    <IconButton
                        onClick={handlePrint}
                        sx={{
                            border: "1px solid",
                            borderColor: theme.palette.divider,
                            borderRadius: 1,
                        }}
                    >
                        <PrintIcon />
                    </IconButton>
                </Tooltip>

                <Button
                    href={route("order-summary", order.id)}
                    target="_blank"
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    sx={{
                        borderRadius: 1,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": {
                            boxShadow: theme.shadows[2],
                        },
                    }}
                >
                    Download Summary
                </Button>
            </Stack>
        </Box>
    );
};

export default OrderHeader;
