import React from "react";
import { Box, Chip, Tooltip, Typography, useTheme } from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

const STATUS_COLORS = {
    pending: "error",
    requested: "info",
    "logistic requested": "warning",
    sent: "primary",
    received: "success",
    processing: "secondary",
    "semi reported": "warning",
    "waiting for financial approval": "warning",
    reported: "success",
    "report downloaded": "default",
};

const STATUS_LABELS = {
    pending: "Pending",
    requested: "Requested",
    "logistic requested": "Logistic Requested",
    sent: "Sent",
    received: "Received",
    processing: "Processing",
    "semi reported": "Semi Reported",
    "waiting for financial approval": "Waiting for Financial Approval",
    reported: "Reported",
    "report downloaded": "Report Downloaded",
};

const formatMoment = (value) =>
    new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

/**
 * "Status Timeline" — the recorded lifecycle of an order on the Show page.
 *
 * Entries flagged `backfilled` were reconstructed from the order's sent_at /
 * received_at / reported_at columns when history recording was introduced,
 * rather than observed as they happened. They are marked as such so a sparse
 * early history does not read as though nothing occurred.
 */
const StatusTimelineCard = ({ histories = [] }) => {
    const theme = useTheme();

    if (!histories.length) return null;

    const hasBackfilled = histories.some((entry) => entry.backfilled);

    return (
        <Box
            component={motion.div}
            variants={itemVariants}
            sx={{
                mb: 4,
                "@media print": {
                    marginBottom: "3mm !important",
                    pageBreakInside: "avoid",
                },
            }}
        >
            <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    "@media print": {
                        fontSize: "10px !important",
                        fontWeight: "bold !important",
                        marginBottom: "2mm !important",
                        color: "#000 !important",
                    },
                }}
            >
                <HistoryIcon
                    color="primary"
                    sx={{ "@media print": { display: "none !important" } }}
                />
                Status Timeline
            </Typography>

            <Box
                sx={{
                    ml: 4,
                    "@media print": { marginLeft: "0 !important" },
                }}
            >
                {histories.map((entry, index) => {
                    const isLast = index === histories.length - 1;

                    return (
                        <Box
                            key={entry.id ?? index}
                            sx={{
                                display: "flex",
                                gap: 2,
                                position: "relative",
                                pb: isLast ? 0 : 2.5,
                                "@media print": { paddingBottom: "2mm !important" },
                            }}
                        >
                            {/* Rail: dot, plus a connector for every entry but the last. */}
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        mt: 0.6,
                                        borderRadius: "50%",
                                        bgcolor: isLast
                                            ? theme.palette.primary.main
                                            : theme.palette.divider,
                                        border: `2px solid ${theme.palette.background.paper}`,
                                        boxShadow: isLast
                                            ? `0 0 0 3px ${theme.palette.primary.main}33`
                                            : "none",
                                        "@media print": {
                                            border: "1px solid #000 !important",
                                            boxShadow: "none !important",
                                        },
                                    }}
                                />
                                {!isLast && (
                                    <Box
                                        sx={{
                                            flexGrow: 1,
                                            width: "2px",
                                            mt: 0.5,
                                            bgcolor: theme.palette.divider,
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ pb: 0.5 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: 1,
                                    }}
                                >
                                    <Chip
                                        label={
                                            STATUS_LABELS[entry.to_status] ??
                                            entry.to_status
                                        }
                                        size="small"
                                        color={
                                            STATUS_COLORS[entry.to_status] ?? "default"
                                        }
                                        sx={{
                                            fontWeight: 500,
                                            "@media print": {
                                                border: "1px solid #000 !important",
                                                backgroundColor: "#f5f5f5 !important",
                                                color: "#000 !important",
                                                fontSize: "7px !important",
                                            },
                                        }}
                                    />
                                    {entry.backfilled && (
                                        <Tooltip title="Reconstructed from the order's stored dates — the exact time may be approximate.">
                                            <Chip
                                                label="estimated"
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "0.65rem",
                                                    color: "text.secondary",
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 0.5,
                                        "@media print": {
                                            fontSize: "7px !important",
                                            color: "#000 !important",
                                        },
                                    }}
                                >
                                    {formatMoment(entry.changed_at)}
                                    {entry.user?.name ? ` · ${entry.user.name}` : ""}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {hasBackfilled && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        display: "block",
                        ml: 4,
                        mt: 1.5,
                        "@media print": { marginLeft: "0 !important" },
                    }}
                >
                    Steps marked “estimated” predate status tracking and were
                    reconstructed from this order’s stored dates.
                </Typography>
            )}
        </Box>
    );
};

export default StatusTimelineCard;
