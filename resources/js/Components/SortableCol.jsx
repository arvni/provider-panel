import React from "react";
import {
    Typography,
    Box,
    Tooltip,
    useTheme,
    alpha,
    ButtonBase
} from "@mui/material";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import { motion } from "framer-motion";

/**
 * Enhanced SortableCol component with better styling and animations
 *
 * @param {string} title - Column title
 * @param {string} field - Field name for sorting
 * @param {function} onClick - Callback function when sorting is changed
 * @param {object} currentOrder - Current sort order object with field and type
 * @param {string} color - Optional color override for active state
 * @param {object} sx - Additional styles
 * @returns {JSX.Element}
 */
const SortableCol = ({
                         title,
                         field,
                         onClick,
                         currentOrder,
                         color,
                         sx = {}
                     }) => {
    const theme = useTheme();
    const isActive = field === currentOrder?.field;
    const direction = isActive ? currentOrder?.type ?? "asc" : "asc";

    // Generate appropriate tooltip text
    const getTooltipText = () => {
        if (!isActive) return `Sort by ${title}`;
        return direction === "asc"
            ? `Sorted by ${title} (ascending). Click to sort descending.`
            : `Sorted by ${title} (descending). Click to sort ascending.`;
    };

    // Handle click event
    const handleClick = (e) => {
        e.preventDefault();
        onClick(field, field !== currentOrder?.field
            ? "asc"
            : (currentOrder?.type === "asc" ? "desc" : "asc")
        );
    };

    // Get appropriate active color
    const getActiveColor = () => {
        if (color) return color;
        return theme.palette.primary.main;
    };

    // Custom sort icon that animates between states
    const SortIcon = () => {
        const variants = {
            asc: { rotate: 0, transition: { duration: 0.2 } },
            desc: { rotate: 180, transition: { duration: 0.2 } }
        };

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    ml: 0.5,
                    visibility: isActive ? 'visible' : 'hidden',
                    opacity: isActive ? 1 : 0.3,
                    transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
                }}
            >
                <motion.div
                    animate={direction}
                    variants={variants}
                    initial={false}
                >
                    {direction === "asc" ? (
                        <ArrowDropUp
                            sx={{
                                color: isActive ? getActiveColor() : 'inherit',
                                fontSize: '1.2rem',
                            }}
                        />
                    ) : (
                        <ArrowDropDown
                            sx={{
                                color: isActive ? getActiveColor() : 'inherit',
                                fontSize: '1.2rem',
                            }}
                        />
                    )}
                </motion.div>
            </Box>
        );
    };

    return (
        <Tooltip title={getTooltipText()} arrow>
            <ButtonBase
                onClick={handleClick}
                component="div"
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    borderRadius: 1,
                    py: 0.5,
                    px: 1,
                    width: 'auto',
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: isActive ? alpha(getActiveColor(), 0.08) : 'transparent',
                    color: isActive ? getActiveColor() : 'inherit',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'left',
                    '&:hover': {
                        backgroundColor: isActive
                            ? alpha(getActiveColor(), 0.12)
                            : alpha(theme.palette.action.hover, 0.2),
                    },
                    ...sx
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: isActive ? 700 : 600,
                        fontSize: '0.875rem',
                        transition: 'color 0.2s ease-in-out',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        color: 'inherit',
                    }}
                >
                    {title}
                </Typography>

                <SortIcon />
            </ButtonBase>
        </Tooltip>
    );
};

export default SortableCol;
