import React, { useState, useMemo } from "react";
import {
    Box,
    Button,
    Chip,
    Collapse,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import { usePageReload } from "@/Services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArticleOutlined,
    Assignment,
    FilterAlt,
    GradingOutlined,
    MedicalInformation,
    RemoveRedEye,
    Science,
    Search,
    ShoppingCart,
    Timer,
    Clear as ClearIcon,
    Refresh as RefreshIcon
} from "@mui/icons-material";
import TestDetails from "@/Pages/Order/Components/TestDetails.jsx";
import { router } from "@inertiajs/react";

/**
 * Breadcrumbs for the layout
 */
const breadcrumbs = [
    {
        title: "Diagnostic Tests",
        link: "",
        icon: <MedicalInformation fontSize="small" />
    },
];

/**
 * Tests Index component
 * Lists available diagnostic tests with filtering and pagination
 *
 * @param {Object} props Component props
 * @param {Object} props.tests Tests data with pagination
 * @param {Object} props.request Request parameters
 * @returns {JSX.Element} Rendered component
 */
function Index({ tests: { data: testsData, ...pagination }, request }) {

    // Page reload state
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["tests", "request"]);

    // State for test details modal
    const [test, setTest] = useState();
    const [openShowForm, setOpenShowForm] = useState(false);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    /**
     * Open test details modal
     *
     * @param {number} id Test ID
     * @returns {Function} Click handler
     */
    const handleShow = (id) => () => {
        let testIndex = testsData.findIndex(item => item.id === id);
        if (testIndex >= 0) {
            setTest(testsData[testIndex]);
            setOpenShowForm(true);
        }
    };

    /**
     * Close test details modal
     */
    const handleCloseShowForm = () => {
        setOpenShowForm(false);
        resetTest();
    };

    /**
     * Reset test state
     */
    const resetTest = () => setTest(null);

    /**
     * Navigate to create order page
     *
     * @param {number} id Test ID
     * @returns {Function} Click handler
     */
    const createOrder = (id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route("orders.create", { test: id }));
    };

    /**
     * Format turnaround time
     *
     * @param {number} days Days
     * @returns {string} Formatted turnaround time
     */
    const formatTurnaroundTime = (days) => {
        if (!days && days !== 0) return "—";

        if (days > 30) {
            const weeks = Math.ceil(days / 7);
            return (
                <Chip
                    label={`${weeks} ${weeks === 1 ? 'week' : 'weeks'}`}
                    size="small"
                    color="info"
                    variant="outlined"
                    icon={<Timer fontSize="small" />}
                />
            );
        }

        return (
            <Chip
                label={`${days} ${days === 1 ? 'day' : 'days'}`}
                size="small"
                color="success"
                variant="outlined"
                icon={<Timer fontSize="small" />}
            />
        );
    };

    /**
     * Table columns definition
     */
    const columns = useMemo(() => [
        {
            field: "code",
            title: "Test Code",
            type: "text",
            filter: {
                name: "code",
                label: "Code",
                type: "text",
                value: data?.filters?.code
            },
            sortable: true,
            render: (row) => (
                <Typography variant="body2" fontWeight="500" fontFamily="monospace" sx={{ letterSpacing: '0.5px' }}>
                    {row.code || "—"}
                </Typography>
            )
        },
        {
            field: "name",
            title: "Test Name",
            type: "text",
            filter: {
                name: "name",
                label: "Name",
                type: "text",
                value: data?.filters?.name
            },
            sortable: true,
            render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <MedicalInformation color="primary" fontSize="small" />
                    <Typography variant="body2" fontWeight="500">
                        {row.name || "—"}
                    </Typography>
                </Stack>
            )
        },
        {
            field: "shortName",
            title: "Short Name",
            type: "text",
            filter: {
                name: "shortName",
                label: "Short Name",
                type: "text",
                value: data?.filters?.shortName
            },
            sortable: true,
            render: (row) => row.shortName || "—"
        },
        {
            field: "turnaroundTime",
            title: "Turnaround Time",
            type: "text",
            sortable: true,
            render: (row) => formatTurnaroundTime(row.turnaroundTime)
        },
        {
            field: "default_sample_type_name",
            title: "Default Sample Type",
            type: "text",
            sortable: true,
            render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Science fontSize="small" color="success" />
                    <Typography variant="body2">
                        {row.default_sample_type_name || "—"}
                    </Typography>
                </Stack>
            )
        },
        {
            field: "documents",
            title: "Documents",
            type: "text",
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    {row?.order_form_file && (
                        <Tooltip title="Download Request Form">
                            <IconButton
                                size="small"
                                color="primary"
                                href={route("file", { type: "orderForm", id: row.order_form_id })}
                                target="_blank"
                            >
                                <Assignment fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {row?.consent_file && (
                        <Tooltip title="Download Consent Form">
                            <IconButton
                                size="small"
                                color="secondary"
                                href={route("file", { type: "instruction", id: row.consent_id })}
                                target="_blank"
                            >
                                <ArticleOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {row?.instruction_file && (
                        <Tooltip title="Download Instructions">
                            <IconButton
                                size="small"
                                color="info"
                                href={route("file", { type: "consent", id: row.instruction_id })}
                                target="_blank"
                            >
                                <GradingOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {!row?.order_form_file && !row?.consent_file && !row?.instruction_file && (
                        <Typography variant="body2" color="text.secondary">
                            No documents
                        </Typography>
                    )}
                </Stack>
            )
        },
        {
            field: "actions",
            title: "Actions",
            type: "text",
            textAlign: "center",
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="View Test Details">
                        <IconButton
                            onClick={handleShow(row.id)}
                            size="small"
                            color="info"
                        >
                            <RemoveRedEye fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Place an Order">
                        <IconButton
                            href={route("orders.create", { test: row.id })}
                            onClick={createOrder(row.id)}
                            size="small"
                            color="primary"
                            sx={{
                                bgcolor: 'primary.lightest',
                                '&:hover': {
                                    bgcolor: 'primary.light',
                                    color: 'white'
                                }
                            }}
                        >
                            <ShoppingCart fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        },
    ], [data?.filters]);

    /**
     * Handle page change
     */
    const handlePage = (e) => {
        e.preventDefault();
        reload();
    };

    /**
     * Handle search input change
     */
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    /**
     * Apply search filter
     */
    const applySearch = () => {
        const filters = { ...data.filters, search: searchTerm };
        onFilterChange(filters);
        handlePage({ preventDefault: () => {} });
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        setSearchTerm("");
        onFilterChange({});
        handlePage({ preventDefault: () => {} });
    };

    /**
     * Handle search on Enter key
     */
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            applySearch();
        }
    };

    return (
        <>
            <PageHeader
                title="Diagnostic Tests"
                subtitle="Browse available tests and place orders"
                icon={<MedicalInformation fontSize="large" />}
            />

            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    mt: 2,
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                {/* Table filters and controls */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.subtle'
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <TextField
                                placeholder="Search tests..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    if (data.filters?.search) {
                                                        clearFilters();
                                                    }
                                                }}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ minWidth: 250 }}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt />}
                                size="medium"
                                onClick={() => setShowFilters(!showFilters)}
                                color={Object.keys(data.filters || {}).length > 0 ? "primary" : "inherit"}
                            >
                                Filters
                                {Object.keys(data.filters || {}).length > 0 && (
                                    <Chip
                                        label={Object.keys(data.filters || {}).length}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Button>

                            {Object.keys(data.filters || {}).length > 0 && (
                                <Button
                                    variant="text"
                                    startIcon={<ClearIcon />}
                                    size="medium"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </Button>
                            )}
                        </Box>

                        <Box>
                            <Tooltip title="Refresh data">
                                <IconButton
                                    onClick={() => reload()}
                                    disabled={processing}
                                    color="inherit"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Stack>

                    {/* Filter panel - expandable */}
                    <Collapse in={showFilters}>
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Typography variant="subtitle2" gutterBottom>
                                Advanced Filters
                            </Typography>

                            <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={2}
                                sx={{ mt: 1 }}
                            >
                                <TextField
                                    label="Test Code"
                                    size="small"
                                    fullWidth
                                    value={data.filters?.code || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...data.filters,
                                            code: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                />

                                <TextField
                                    label="Test Name"
                                    size="small"
                                    fullWidth
                                    value={data.filters?.name || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...data.filters,
                                            name: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                />

                                <TextField
                                    label="Sample Type"
                                    size="small"
                                    fullWidth
                                    value={data.filters?.sample_type || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...data.filters,
                                            sample_type: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                />

                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => handlePage({ preventDefault: () => {} })}
                                        disabled={processing}
                                    >
                                        Apply Filters
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={clearFilters}
                                        disabled={processing}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    </Collapse>
                </Box>

                {/* Table container */}
                <Box sx={{ overflowX: "auto" }}>
                    <TableLayout
                        columns={columns}
                        data={testsData}
                        onPageChange={onPageChange}
                        pagination={pagination}
                        onFilterChange={onFilterChange}
                        onFilter={handlePage}
                        filter={false} // We've built custom filter UI above
                        onOrderByChange={onOrderByChange}
                        loading={processing}
                        tableModel={{
                            orderBy: data.sort ?? {
                                field: "id",
                                type: "asc"
                            },
                            page: data.page,
                            filter: data.filters
                        }}
                        pageSize={{
                            defaultValue: data.pageSize ?? 10,
                            onChange: onPageSizeChange
                        }}
                        emptyStateMessage={
                            <Box
                                sx={{
                                    py: 8,
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2
                                }}
                            >
                                <MedicalInformation fontSize="large" color="disabled" sx={{ fontSize: 64 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No Tests Found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                                    {data.filters && Object.keys(data.filters).length > 0
                                        ? "Try adjusting your filters or search terms to find what you're looking for."
                                        : "There are no diagnostic tests available at the moment."}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {/* Test details dialog */}
                {test && <TestDetails test={test} open={openShowForm} onClose={handleCloseShowForm} />}
            </Paper>
        </>
    );
}

// Set layout wrapper
Index.layout = (page) => (
    <AdminLayout
        auth={page.props.auth}
        breadcrumbs={breadcrumbs}
        children={page}
    />
);

export default Index;
