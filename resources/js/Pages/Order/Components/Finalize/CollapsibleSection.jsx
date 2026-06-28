import React from "react";
import { Box, Chip, Collapse, Paper, Typography, useTheme, alpha } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { motion } from "framer-motion";
import { itemVariants } from "@/Pages/Order/Components/orderMotion";

/**
 * Collapsible review section used by the Finalize page. Encapsulates the shared
 * Paper + clickable coloured header + status chip + Collapse body that every
 * section repeated verbatim.
 *
 * @param {React.ReactNode} icon Leading header icon.
 * @param {string} title Header title.
 * @param {boolean} expanded Whether the body is open.
 * @param {() => void} onToggle Header click handler.
 * @param {boolean} [hasError] Highlights the section in the error palette.
 * @param {string} headerBg Header background when not in an error state.
 * @param {string} headerColor Header text/contrast colour.
 * @param {{color: string, label: string, icon: React.ReactNode}} [status]
 *        Optional completion-status chip (Complete / Incomplete / Errors).
 * @param {React.ReactNode} [chip] Optional extra chip rendered after the title.
 * @param {number} [mb] Bottom margin (defaults to 3).
 */
const CollapsibleSection = ({
    icon,
    title,
    expanded,
    onToggle,
    hasError = false,
    headerBg,
    headerColor,
    status,
    chip,
    mb = 3,
    children,
}) => {
    const theme = useTheme();

    return (
        <Paper
            component={motion.div}
            variants={itemVariants}
            elevation={0}
            sx={{
                mb,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: hasError ? theme.palette.error.main : theme.palette.divider,
                ...(hasError && {
                    boxShadow: `0 0 0 1px ${theme.palette.error.main}`,
                }),
            }}
        >
            <Box
                sx={{
                    p: 2,
                    bgcolor: hasError ? alpha(theme.palette.error.main, 0.1) : headerBg,
                    color: headerColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                }}
                onClick={onToggle}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {icon}
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                    {status && (
                        <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            icon={status.icon}
                            sx={{ ml: 1, fontWeight: 500 }}
                        />
                    )}
                    {chip}
                </Box>

                {expanded ? <ExpandLess /> : <ExpandMore />}
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ p: 3 }}>{children}</Box>
            </Collapse>
        </Paper>
    );
};

export default CollapsibleSection;
