import React, {useMemo, useCallback} from "react";
import {
    Stack,
    Tooltip,
    IconButton,
    Button,
    Box,
    Chip,
    Typography,
    alpha,
    useTheme,
    Badge,
    Grid
} from "@mui/material";
import RenderFormField from "./RenderFormField";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import {motion} from "framer-motion";

// Extracted styles for better performance and reuse
const useStyles = (theme) => ({
    filterContainer: {
        opacity: 1,
        transition: 'opacity 0.3s ease'
    },
    headerCell: {
        p: 1,
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        borderBottom: '1px solid',
        borderBottomColor: theme.palette.divider
    },
    filterCell: {
        backgroundColor: alpha(theme.palette.background.default, 0.5),
        borderBottom: '1px solid',
        borderBottomColor: theme.palette.divider,
        verticalAlign: 'top'
    },
    activeFilterBox: {
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
    },
    badgeStyles: {
        '& .MuiBadge-badge': {
            right: 6,
            top: 6,
            height: 8,
            minWidth: 8,
            borderRadius: '50%'
        }
    },
    clearButton: {
        position: 'absolute',
        top: -12,
        right: -12,
        zIndex: 2
    },
    clearIconButton: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        border: '1px solid',
        borderColor: theme.palette.divider,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        '&:hover': {
            backgroundColor: alpha(theme.palette.error.light, 0.1),
        }
    },
    filterContentBox: {
        p: 1.5,
        position: 'relative'
    },
    headerBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    filterIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: 1
    },
    filterCountChip: {
        fontWeight: 600,
        height: 20,
        minWidth: 20
    },
    clearAllButton: {
        borderRadius: 1.5,
        textTransform: 'none',
        fontWeight: 500
    }
});

/**
 * Enhanced Filter component with improved layout, performance, and visual feedback
 *
 * @param {Array} columns - Array of column definitions with filter configurations
 * @param {Function} onChange - Callback when filter values change
 * @param {Object} filter - Current filter state
 * @returns {JSX.Element}
 */
const Filter = ({
                    columns,
                    onChange,
                    filter
                }) => {
    const theme = useTheme();
    const styles = useStyles(theme);


    // Check if a column has active filters - memoized utility function
    const hasActiveFilter = useCallback((col) => {
        if (!col.filter || !filter) return false;

        if (Array.isArray(col.filter)) {
            return col.filter.some(f => {
                return !!f.value;
            });
        }

        const fieldName = col.filter.name.includes('.') ? col.filter.name.split('.')[0] : col.filter.name;
        return filter[fieldName] && filter[fieldName] !== '';
    }, [filter]);

    // Count active filters - memoized to prevent recalculation on each render
    const filterCount = useMemo(() => {
        if (!filter) return 0;

        return columns.reduce((count, col) => {
            if (hasActiveFilter(col))
                count++;
            return count;
        }, 0);
    }, [filter]);

    // Create synthetic event and trigger onChange
    const triggerFilterChange = useCallback((name, value) => {
        const syntheticEvent = {
            target: {
                name,
                value
            }
        };
        onChange(syntheticEvent);
    }, [onChange]);

    // Handle clear filters for a specific column
    const handleClearColumnFilter = useCallback((col) => (e) => {
        e.stopPropagation();

        if ( !col.filter) return;

        if (Array.isArray(col.filter)) {
            col.filter.forEach(f => {
                triggerFilterChange(f.name, '');
            });
        } else {
            triggerFilterChange(col.filter.name, '');
        }
    }, [triggerFilterChange]);

    // Clear all filters
    const handleClearAllFilters = useCallback((e) => {
        e.stopPropagation();

        // Create synthetic events to clear all filter fields
        columns.forEach(col => {
            if (!col.filter) return;

            if (Array.isArray(col.filter)) {
                col.filter.forEach(f => {
                    triggerFilterChange(f.name, '');
                });
            } else {
                triggerFilterChange(col.filter.name, '');
            }
        });
    }, [columns, triggerFilterChange]);

    // Render multiple filter fields
    const renderFilterFields = useCallback((filterFields, columnIndex) => (
        <Stack spacing={1.5} direction="column">
            {filterFields.map((field, i) => (
                <RenderFormField
                    key={`filter-${columnIndex}-${i}`}
                    size="small"
                    field={field}
                    onchange={onChange}
                    defaultValue={field.value}
                />
            ))}
        </Stack>
    ), [onChange]);

    // Render single filter field
    const renderSingleFilterField = useCallback((field, columnIndex) => (
        <RenderFormField
            key={`filter-${columnIndex}`}
            field={field}
            onchange={onChange}
            size="small"
            defaultValue={field.value}
        />
    ), [onChange]);

    // Render the filter badge if needed
    const renderFilterCell = useCallback((col, index) => {
        const isActive = hasActiveFilter(col);

        if (!col.filter) return null;

        if (isActive) {
            return (
                <Badge
                    color="primary"
                    variant="dot"
                    overlap="circular"
                    sx={styles.badgeStyles}
                >
                    <Box sx={styles.activeFilterBox}>
                        {Array.isArray(col.filter) ? (
                            <Stack
                                spacing={1.5}
                                direction="column"
                                sx={styles.filterContentBox}
                            >
                                <Box sx={styles.clearButton}>
                                    <Tooltip title="Clear filters">
                                        <IconButton
                                            size="small"
                                            onClick={handleClearColumnFilter(col)}
                                            sx={styles.clearIconButton}
                                        >
                                            <ClearAllIcon fontSize="small" color="error"/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                {renderFilterFields(col.filter, index)}
                            </Stack>
                        ) : (
                            <Box sx={styles.filterContentBox}>
                                <Box sx={styles.clearButton}>
                                    <Tooltip title="Clear filter">
                                        <IconButton
                                            size="small"
                                            onClick={handleClearColumnFilter(col)}
                                            sx={styles.clearIconButton}
                                        >
                                            <ClearAllIcon fontSize="small" color="error"/>
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                {renderSingleFilterField(col.filter, index)}
                            </Box>
                        )}
                    </Box>
                </Badge>
            );
        }

        // Regular filter without active state
        return (
            <Box sx={styles.filterContentBox}>
                {Array.isArray(col.filter) ?
                    renderFilterFields(col.filter, index) :
                    renderSingleFilterField(col.filter, index)
                }
            </Box>
        );
    }, [hasActiveFilter, handleClearColumnFilter, renderFilterFields, renderSingleFilterField, styles]);

    // Animation properties
    const animationProps = {
        initial: {opacity: 0},
        animate: {opacity: 1},
        exit: {opacity: 0},
        transition: {duration: 0.3}
    };

    return (
        <Grid
            container
            component={motion.div}
            {...animationProps}
            spacing={1}
            sx={styles.filterContainer}
        >
            {/* Header cell with clear filters button */}
            {filterCount > 0 && (
                <Grid item xs={12} sx={styles.headerCell}>
                    <Box sx={styles.headerBox}>
                        <Box sx={styles.filterIndicator}>
                            <FilterListIcon color="primary" fontSize="small"/>
                            <Typography variant="body2" fontWeight={500}>
                                Active Filters:
                            </Typography>
                            <Chip
                                label={filterCount}
                                color="primary"
                                size="small"
                                sx={styles.filterCountChip}
                            />
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ClearAllIcon/>}
                            onClick={handleClearAllFilters}
                            color="inherit"
                            sx={styles.clearAllButton}
                        >
                            Clear All Filters
                        </Button>
                    </Box>
                </Grid>
            )}
            {/* Filter cells */}
            {columns.map((col, index) => col.filter && <Grid
                    item
                    key={index}
                    sx={styles.filterCell}
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                >
                    {renderFilterCell(col, index)}
                </Grid>
            )}
        </Grid>
    );
};

export default React.memo(Filter);
