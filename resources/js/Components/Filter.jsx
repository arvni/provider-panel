import React, { useState } from "react";
import {
    Stack,
    TableCell,
    TableRow,
    Tooltip,
    IconButton,
    Button,
    Collapse,
    Box,
    Chip,
    Typography,
    alpha,
    useTheme,
    Fade,
    Divider,
    Badge
} from "@mui/material";
import RenderFormField from "./RenderFormField";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import { motion } from "framer-motion";

/**
 * Enhanced Filter component with improved layout and visual feedback
 *
 * @param {Array} columns - Array of column definitions with filter configurations
 * @param {Function} onChange - Callback when filter values change
 * @param {Function} onClear - Optional callback to clear all filters
 * @param {Object} filter - Current filter state
 * @returns {JSX.Element}
 */
const Filter = ({
                    columns,
                    onChange,
                    onClear,
                    filter
                }) => {
    const theme = useTheme();

    // Count active filters
    const countActiveFilters = () => {
        let count = 0;
        if (filter) {
            Object.keys(filter).forEach(key => {
                if (filter[key] && filter[key] !== '') {
                    count++;
                }
            });
        }
        return count;
    };

    // Get active filter count
    const filterCount = countActiveFilters();

    // Check if a column has active filters
    const hasActiveFilter = (col) => {
        if (!col.filter || !filter) return false;

        if (Array.isArray(col.filter)) {
            return col.filter.some(f => {
                const fieldName = f.name.includes('.') ? f.name.split('.')[0] : f.name;
                return filter[fieldName] &&
                    (typeof filter[fieldName] === 'object' ?
                        Object.values(filter[fieldName]).some(v => v && v !== '') :
                        filter[fieldName] !== '');
            });
        } else {
            const fieldName = col.filter.name.includes('.') ? col.filter.name.split('.')[0] : col.filter.name;
            return filter[fieldName] && filter[fieldName] !== '';
        }
    };

    // Handle clear filters for a specific column
    const handleClearColumnFilter = (col) => (e) => {
        e.stopPropagation();

        if (onClear && col.filter) {
            const fieldsToReset = {};

            if (Array.isArray(col.filter)) {
                col.filter.forEach(f => {
                    fieldsToReset[f.name] = '';
                });
            } else {
                fieldsToReset[col.filter.name] = '';
            }

            // Create a synthetic event with target.name and target.value for each field
            Object.keys(fieldsToReset).forEach(name => {
                const syntheticEvent = {
                    target: {
                        name: name,
                        value: ''
                    }
                };
                onChange(syntheticEvent);
            });
        }
    };

    // Clear all filters
    const handleClearAllFilters = (e) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else {
            // Create synthetic events to clear all filter fields
            columns.forEach(col => {
                if (col.filter) {
                    if (Array.isArray(col.filter)) {
                        col.filter.forEach(f => {
                            const syntheticEvent = {
                                target: {
                                    name: f.name,
                                    value: ''
                                }
                            };
                            onChange(syntheticEvent);
                        });
                    } else {
                        const syntheticEvent = {
                            target: {
                                name: col.filter.name,
                                value: ''
                            }
                        };
                        onChange(syntheticEvent);
                    }
                }
            });
        }
    };

    // Render the filter badge if needed
    const renderFilterBadge = (col, index) => {
        if (hasActiveFilter(col)) {
            return (
                <Badge
                    color="primary"
                    variant="dot"
                    overlap="circular"
                    sx={{
                        '& .MuiBadge-badge': {
                            right: 6,
                            top: 6,
                            height: 8,
                            minWidth: 8,
                            borderRadius: '50%'
                        }
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                                borderRadius: '0 4px 4px 0',
                                zIndex: -1
                            }
                        }}
                    >
                        {Array.isArray(col.filter) ? (
                            <Stack
                                spacing={1.5}
                                direction="column"
                                sx={{
                                    p: 1.5,
                                    position: 'relative',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -12,
                                        right: -12,
                                        zIndex: 2
                                    }}
                                >
                                    <Tooltip title="Clear filters">
                                        <IconButton
                                            size="small"
                                            onClick={handleClearColumnFilter(col)}
                                            sx={{
                                                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.error.light, 0.1),
                                                }
                                            }}
                                        >
                                            <ClearAllIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {col.filter.map((column, i) => (
                                    <RenderFormField
                                        key={`filter-${index}-${i}`}
                                        size="small"
                                        field={column}
                                        onchange={onChange}
                                    />
                                ))}
                            </Stack>
                        ) : (
                            <Box
                                sx={{
                                    p: 1.5,
                                    position: 'relative'
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: -12,
                                        right: -12,
                                        zIndex: 2
                                    }}
                                >
                                    <Tooltip title="Clear filter">
                                        <IconButton
                                            size="small"
                                            onClick={handleClearColumnFilter(col)}
                                            sx={{
                                                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.error.light, 0.1),
                                                }
                                            }}
                                        >
                                            <ClearAllIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <RenderFormField
                                    key={`filter-${index}`}
                                    field={col.filter}
                                    onchange={onChange}
                                    size="small"
                                />
                            </Box>
                        )}
                    </Box>
                </Badge>
            );
        }

        // Regular filter without active state
        return (
            <Box sx={{ p: 1.5 }}>
                {Array.isArray(col.filter) ? (
                    <Stack spacing={1.5} direction="column">
                        {col.filter.map((column, i) => (
                            <RenderFormField
                                key={`filter-${index}-${i}`}
                                size="small"
                                field={column}
                                onchange={onChange}
                            />
                        ))}
                    </Stack>
                ) : (
                    <RenderFormField
                        key={`filter-${index}`}
                        field={col.filter}
                        onchange={onChange}
                        size="small"
                    />
                )}
            </Box>
        );
    };

    return (
        <TableRow
            component={motion.tr}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header cell with clear filters button */}
            {filterCount > 0 && (
                <TableCell
                    colSpan={columns.length}
                    sx={{
                        p: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: '1px solid',
                        borderBottomColor: theme.palette.divider
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterListIcon color="primary" fontSize="small" />

                            <Typography variant="body2" fontWeight={500}>
                                Active Filters:
                            </Typography>

                            <Chip
                                label={filterCount}
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 600, height: 20, minWidth: 20 }}
                            />
                        </Box>

                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ClearAllIcon />}
                            onClick={handleClearAllFilters}
                            color="inherit"
                            sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Clear All Filters
                        </Button>
                    </Box>
                </TableCell>
            )}

            {/* Filter cells */}
            {columns.map((col, index) => (
                <TableCell
                    key={index}
                    sx={{
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        borderBottom: '1px solid',
                        borderBottomColor: theme.palette.divider,
                        p: 0,
                        verticalAlign: 'top'
                    }}
                >
                    {col.filter && renderFilterBadge(col, index)}
                </TableCell>
            ))}
        </TableRow>
    );
};

export default Filter;
