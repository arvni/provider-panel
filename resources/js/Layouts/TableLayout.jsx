import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableRow,
    Typography,
    Paper,
    Box,
    Chip,
    Skeleton,
    IconButton,
    Tooltip,
    Stack,
    useTheme,
    alpha,
    Collapse,
    Alert,
    Button,
    TableContainer
} from "@mui/material";

import Pagination from "../Components/Pagination";
import Filter from "../Components/Filter";
import PageSize from "../Components/PageSize";
import SortableCol from "../Components/SortableCol";
import SearchOffIcon from '@mui/icons-material/SearchOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { motion } from "framer-motion";

/**
 * Enhanced empty state message with illustration and helpful text
 */
const NoDataMessage = ({ onRefresh }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                py: 6,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
            }}
        >
            <SearchOffIcon
                sx={{
                    fontSize: 60,
                    color: alpha(theme.palette.text.secondary, 0.5),
                    mb: 1
                }}
            />

            <Typography
                variant="h6"
                color="text.secondary"
                textAlign="center"
                sx={{ fontWeight: 500 }}
            >
                No data found
            </Typography>

            <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ maxWidth: 400, mb: 1 }}
            >
                There are no records matching your criteria. Try adjusting your filters or add new data.
            </Typography>

            {onRefresh && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={onRefresh}
                >
                    Refresh
                </Button>
            )}
        </Box>
    );
};

/**
 * Render cell content based on column type
 */
function renderCell(item, col) {
    const value = item[col.field];

    if (value === null || value === undefined) {
        return <Typography variant="body2" color="text.secondary">—</Typography>;
    }

    switch (col.type) {
        case "date":
            try {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return value;
            }

        case "datetime":
            try {
                const date = new Date(value);
                return date.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                return value;
            }

        case "boolean":
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Chip
                        label={value ? "Yes" : "No"}
                        size="small"
                        color={value ? "success" : "error"}
                        variant="outlined"
                        sx={{
                            minWidth: 60,
                            fontWeight: 500,
                            fontSize: '0.75rem'
                        }}
                    />
                </Box>
            );

        case "number":
            return <Typography align={col.align || "right"}>{value.toLocaleString()}</Typography>;

        case "status":
            const statusMap = {
                active: "success",
                pending: "warning",
                inactive: "error",
                completed: "success",
                processing: "info",
                cancelled: "error",
                default: "default"
            };
            const statusColor = statusMap[value?.toLowerCase()] || statusMap.default;

            return (
                <Box sx={{ display: 'flex', justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
                    <Chip
                        label={value}
                        size="small"
                        color={statusColor}
                        sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem'
                        }}
                    />
                </Box>
            );

        default:
            return <Typography variant="body2">{value}</Typography>;
    }
}

/**
 * Enhanced TableLayout component with improved visual design and UX
 */
const TableLayout = ({
                         columns,
                         data,
                         onFilterChange,
                         loading,
                         onPageChange,
                         onOrderByChange,
                         pagination,
                         filter,
                         pageSize,
                         tableModel,
                         title,
                         onRefresh,
                         error
                     }) => {
    const theme = useTheme();
    const [showFilters, setShowFilters] = useState(filter || false);

    // Toggle filter visibility
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            sx={{ width: "100%" }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    mb: 4
                }}
            >
                {/* Table Header with Title and Actions */}
                {(title || filter) && (
                    <Box
                        sx={{
                            px: 3,
                            py: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider,
                            backgroundColor: alpha(theme.palette.background.default, 0.5)
                        }}
                    >
                        {title && (
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {title}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={1}>
                            {filter && (
                                <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
                                    <IconButton
                                        size="small"
                                        onClick={toggleFilters}
                                        color={showFilters ? "primary" : "default"}
                                    >
                                        <FilterListIcon />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {onRefresh && (
                                <Tooltip title="Refresh data">
                                    <IconButton
                                        size="small"
                                        onClick={onRefresh}
                                        disabled={loading}
                                        sx={{
                                            transition: 'transform 0.3s',
                                            ...(loading && {
                                                animation: 'spin 1s linear infinite',
                                            }),
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' }
                                            }
                                        }}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </Box>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            m: 2,
                            borderRadius: 1
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Filter Row */}
                <Collapse in={showFilters} timeout="auto" sx={{p: showFilters ? 2 : 0}}>
                    <form method={"get"} action={"."} onChange={onFilterChange} style={{width: "100%"}}>
                        {filter && <Filter onChange={onFilterChange}
                                           columns={columns}
                                           filter={tableModel.filter}/>}
                    </form>
                </Collapse>

                <TableContainer>
                    <Table size="medium" sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    {columns.map(({ title, render = null, sortable, width, ...rest }, index) => (
                                        <TableCell
                                            {...rest}
                                            key={index}
                                            width={width}
                                            sx={{
                                                textAlign: rest.align || "left",
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                py: 2,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                borderBottom: '2px solid',
                                                borderBottomColor: theme.palette.divider,
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {sortable ? (
                                                <SortableCol
                                                    title={title}
                                                    field={rest.field}
                                                    onClick={onOrderByChange}
                                                    currentOrder={tableModel.orderBy}
                                                />
                                            ) : (
                                                title
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    // Loading state
                                    Array(5).fill(0).map((_, rowIndex) => (
                                        <TableRow key={`skeleton-${rowIndex}`}>
                                            {columns.map((col, colIndex) => (
                                                <TableCell key={`skeleton-cell-${colIndex}`}>
                                                    <Skeleton animation="wave" height={24} width={col.width || "100%"} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : data.length ? (
                                    // Data rows
                                    data.map((item, index) => (
                                        <TableRow
                                            key={item.id ?? index}
                                            sx={{
                                                '&:nth-of-type(odd)': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.01),
                                                },
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                                },
                                                transition: 'background-color 0.2s',
                                            }}
                                        >
                                            {columns.map((col, colIndex) => (
                                                <TableCell
                                                    key={colIndex}
                                                    align={col.align}
                                                    sx={{
                                                        py: 1.5,
                                                        borderBottom: '1px solid',
                                                        borderBottomColor: theme.palette.divider
                                                    }}
                                                >
                                                    {col.render ? col?.render(item) : renderCell(item, col)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    // Empty state
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <NoDataMessage onRefresh={onRefresh} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>

                            {/* Pagination Footer */}
                            {pagination && (
                                <TableFooter>
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length - (pageSize ? 1 : 0)}
                                            align={"center"}
                                            sx={{
                                                py: 2,
                                                borderTop: '2px solid',
                                                borderTopColor: theme.palette.divider
                                            }}
                                        >
                                            <Pagination onChange={onPageChange} paginate={pagination} />
                                        </TableCell>

                                        {pageSize && (
                                            <TableCell
                                                sx={{
                                                    py: 2,
                                                    borderTop: '2px solid',
                                                    borderTopColor: theme.palette.divider
                                                }}
                                            >
                                                <PageSize {...pageSize} />
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableFooter>
                            )}
                        </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default TableLayout;
