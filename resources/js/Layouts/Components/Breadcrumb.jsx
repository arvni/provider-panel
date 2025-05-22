import React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Head, Link } from "@inertiajs/react";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box, Chip, Tooltip, alpha, useTheme, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Enhanced Breadcrumb component with animations and improved mobile handling
 *
 * @param {Array} breadcrumbs - Array of breadcrumb items with title, link, and icon properties
 * @returns {JSX.Element} - Rendered Breadcrumb component
 */
export default function Breadcrumb({ breadcrumbs = [] }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isSmall = useMediaQuery(theme.breakpoints.down('md'));

    // Trim breadcrumbs for mobile to show only the last 2 items
    const displayedBreadcrumbs = isMobile && breadcrumbs.length > 2
        ? [{ title: '...', truncated: true }, ...breadcrumbs.slice(-2)]
        : breadcrumbs;

    // Get the current page title for the Head component
    const pageTitle = breadcrumbs.length ? breadcrumbs[breadcrumbs.length - 1].title : "Dashboard";

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                when: "beforeChildren"
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -5 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <>
            <Box
                component={motion.div}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    maxWidth: '100%',
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': { display: 'none' },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                <Breadcrumbs
                    aria-label="breadcrumb"
                    separator={
                        <NavigateNextIcon
                            fontSize="small"
                            sx={{
                                color: theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.common.white, 0.7)
                                    : theme.palette.text.secondary,
                                fontSize: '1rem',
                            }}
                        />
                    }
                    sx={{
                        color: theme.palette.text.primary,
                        '& .MuiBreadcrumbs-ol': {
                            flexWrap: isSmall ? 'nowrap' : 'wrap',
                        }
                    }}
                >
                    {/* Dashboard/Home link */}
                    <motion.div key="dashboard" variants={itemVariants}>
                        {route().current("dashboard") ? (
                            <Chip
                                icon={<HomeIcon fontSize="small" />}
                                label="Dashboard"
                                size="small"
                                variant="filled"
                                color="primary"
                                sx={{
                                    fontWeight: 600,
                                    '& .MuiChip-icon': {
                                        color: 'inherit',
                                    }
                                }}
                            />
                        ) : (
                            <Tooltip title="Go to Dashboard">
                                <Chip
                                    icon={<HomeIcon fontSize="small" />}
                                    label="Dashboard"
                                    size="small"
                                    clickable
                                    component={Link}
                                    href={route("dashboard")}
                                    method="get"
                                    variant="outlined"
                                    sx={{
                                        fontWeight: 500,
                                        color: theme.palette.mode === 'dark'
                                            ? theme.palette.primary.light
                                            : theme.palette.primary.main,
                                        borderColor: theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.primary.light, 0.3)
                                            : alpha(theme.palette.primary.main, 0.3),
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark'
                                                ? alpha(theme.palette.primary.light, 0.1)
                                                : alpha(theme.palette.primary.main, 0.1),
                                            borderColor: theme.palette.mode === 'dark'
                                                ? theme.palette.primary.light
                                                : theme.palette.primary.main,
                                        },
                                        '& .MuiChip-icon': {
                                            color: 'inherit',
                                        }
                                    }}
                                />
                            </Tooltip>
                        )}
                    </motion.div>

                    {/* Breadcrumb items */}
                    {displayedBreadcrumbs.map((item, index) => {
                        const isLast = index === displayedBreadcrumbs.length - 1;

                        // If this is a truncated indicator
                        if (item.truncated) {
                            return (
                                <motion.div key="truncated" variants={itemVariants}>
                                    <Tooltip title="More breadcrumbs">
                                        <Chip
                                            label="..."
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                minWidth: 32,
                                                height: 24,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: theme.palette.text.secondary,
                                            }}
                                        />
                                    </Tooltip>
                                </motion.div>
                            );
                        }

                        // Regular breadcrumb item
                        return (
                            <motion.div key={index} variants={itemVariants}>
                                {item.link && !isLast ? (
                                    <Tooltip title={`Go to ${item.title}`}>
                                        <Chip
                                            icon={item.icon ? React.cloneElement(item.icon, { fontSize: 'small' }) : null}
                                            label={item.title}
                                            size="small"
                                            clickable
                                            component={Link}
                                            href={item.link}
                                            method="get"
                                            variant="outlined"
                                            sx={{
                                                maxWidth: isSmall ? 150 : 'none',
                                                fontWeight: 500,
                                                color: theme.palette.text.primary,
                                                borderColor: alpha(theme.palette.text.primary, 0.2),
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.text.primary, 0.05),
                                                    borderColor: alpha(theme.palette.text.primary, 0.4),
                                                },
                                                '& .MuiChip-label': {
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                },
                                                '& .MuiChip-icon': {
                                                    color: 'inherit',
                                                }
                                            }}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Chip
                                        icon={item.icon ? React.cloneElement(item.icon, { fontSize: 'small' }) : null}
                                        label={item.title}
                                        size="small"
                                        variant={isLast ? "filled" : "outlined"}
                                        color={isLast ? "primary" : "default"}
                                        sx={{
                                            maxWidth: isSmall ? 200 : 'none',
                                            fontWeight: isLast ? 600 : 500,
                                            '& .MuiChip-label': {
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            },
                                            '& .MuiChip-icon': {
                                                color: 'inherit',
                                            }
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </Breadcrumbs>
            </Box>

            {/* Page title for browser tab */}
            <Head title={pageTitle} />
        </>
    );
}
