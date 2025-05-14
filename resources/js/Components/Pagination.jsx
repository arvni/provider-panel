import React from "react";
import {
    Pagination as MuiPagination,
    Box,
    Typography,
    Stack,
    useTheme,
    useMediaQuery,
    Tooltip,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    alpha
} from "@mui/material";
import {
    KeyboardDoubleArrowLeft,
    KeyboardDoubleArrowRight,
    Info as InfoIcon
} from "@mui/icons-material";

/**
 * Enhanced pagination component with additional information and features
 *
 * @param {Object} paginate - Pagination data object containing current_page, last_page, total, etc.
 * @param {Function} onChange - Callback function when page changes
 * @param {String} size - Size of pagination component ('small', 'medium', 'large')
 * @param {Boolean} showInfo - Whether to show additional information
 * @param {Boolean} showJump - Whether to show jump to first/last buttons
 * @param {Object} sx - Additional styles
 * @returns {JSX.Element}
 */
const Pagination = ({
                        paginate,
                        onChange,
                        size = "medium",
                        showInfo = true,
                        showJump = true,
                        sx = {}
                    }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Handle direct page jumps
    const handleJump = (page) => (e) => {
        if (onChange) {
            onChange(e, page);
        }
    };

    // Determine page range to display in info text
    const from = ((paginate.current_page - 1) * paginate.per_page) + 1;
    const to = Math.min(from + paginate.per_page - 1, paginate.total);

    // Calculate number of pages to show based on screen size
    const getPageCount = () => {
        if (isMobile) return 3;
        if (isTablet) return 5;
        return 7;
    };

    // Handle direct page selection
    const handlePageSelect = (event) => {
        if (onChange) {
            onChange(event, parseInt(event.target.value, 10));
        }
    };

    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            alignItems="center"
            justifyContent="center"
            sx={{
                width: '100%',
                my: 1,
                ...sx
            }}
        >
            {/* Jump to first page button */}
            {showJump && paginate.current_page > 2 && (
                <Tooltip title="First Page">
                    <IconButton
                        onClick={handleJump(1)}
                        size={size === 'small' ? 'small' : 'medium'}
                        color="primary"
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            }
                        }}
                    >
                        <KeyboardDoubleArrowLeft />
                    </IconButton>
                </Tooltip>
            )}

            {/* Main pagination component */}
            <MuiPagination
                page={paginate.current_page}
                count={paginate.last_page}
                onChange={onChange}
                size={size}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 1}
                showFirstButton={!showJump && !isMobile}
                showLastButton={!showJump && !isMobile}
                color="primary"
                shape="rounded"
                sx={{
                    '& .MuiPaginationItem-root': {
                        borderRadius: 1,
                        fontWeight: 500,
                        mx: 0.2,
                    },
                    '& .Mui-selected': {
                        fontWeight: 600,
                    }
                }}
            />

            {/* Jump to last page button */}
            {showJump && paginate.current_page < paginate.last_page - 1 && (
                <Tooltip title="Last Page">
                    <IconButton
                        onClick={handleJump(paginate.last_page)}
                        size={size === 'small' ? 'small' : 'medium'}
                        color="primary"
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            }
                        }}
                    >
                        <KeyboardDoubleArrowRight />
                    </IconButton>
                </Tooltip>
            )}

            {/* Direct page selection for mobile */}
            {isMobile && paginate.last_page > getPageCount() && (
                <FormControl
                    size="small"
                    sx={{
                        minWidth: 80,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                        }
                    }}
                >
                    <InputLabel id="page-select-label">Page</InputLabel>
                    <Select
                        labelId="page-select-label"
                        id="page-select"
                        value={paginate.current_page}
                        label="Page"
                        onChange={handlePageSelect}
                    >
                        {Array.from({ length: paginate.last_page }, (_, i) => i + 1).map(page => (
                            <MenuItem key={page} value={page}>
                                {page}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {/* Pagination info */}
            {showInfo && paginate.total > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: theme.palette.text.secondary,
                        ml: { sm: 2 }
                    }}
                >
                    <InfoIcon
                        fontSize="small"
                        sx={{
                            color: theme.palette.info.main,
                            opacity: 0.7,
                            fontSize: '1rem'
                        }}
                    />

                    <Typography
                        variant="body2"
                        component="span"
                        sx={{
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {isMobile ? (
                            `${paginate.current_page} / ${paginate.last_page}`
                        ) : (
                            `Showing ${from}-${to} of ${paginate.total} items`
                        )}
                    </Typography>
                </Box>
            )}
        </Stack>
    );
};

export default Pagination;
