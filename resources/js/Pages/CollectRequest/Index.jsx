import React, {useState, useMemo} from "react";
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
    Typography
} from "@mui/material";
import {
    RemoveRedEye,
    LocalShipping,
    FilterAlt,
    Search,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    Schedule,
    CheckCircle,
    Receipt,
    Event,
    Person,
    Send
} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/Services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";
import DeleteButton from "@/Components/DeleteButton.jsx";
import {format, isValid} from 'date-fns';
import {formatInTimeZone} from 'date-fns-tz';


/**
 * Breadcrumbs for the layout
 */
const breadcrumbs = [
    {
        title: "Collection Requests",
        link: "",
        icon: <LocalShipping fontSize="small"/>
    },
];

/**
 * CollectRequests Index component
 * Lists all collection requests with filtering and pagination
 *
 * @param {Object} props Component props
 * @param {Object} props.collectRequests Collection requests data with pagination
 * @param {Object} props.request Request parameters
 * @returns {JSX.Element} Rendered component
 */
function Index({collectRequests: {data: collectRequestsData, ...pagination}, request}) {

    // Page reload state
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["collectRequests", "status", "success", "request"]);

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    /**
     * Format date string
     *
     * @param {string} dateString Date string to format
     * @returns {string} Formatted date or original string
     */
    const formatDate = (dateString) => {
        if (!dateString) return "—";

        try {
            const date = new Date(dateString);
            if (isValid(date)) {
                return formatInTimeZone(date, 'Asia/Muscat', 'MMM d, yyyy h:mm a',);
            }
        } catch (e) {
            // Fall back to original string if parsing fails
        }

        return dateString;
    };

    /**
     * Get status chip color based on status
     *
     * @param {string} status Status value
     * @returns {string} Color name
     */
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'requested':
                return 'warning';
            case 'scheduled':
                return 'info';
            case 'picked up':
                return 'secondary';
            case 'received':
                return 'success';
            default:
                return 'default';
        }
    };

    /**
     * Get status icon based on status
     *
     * @param {string} status Status value
     * @returns {JSX.Element} Icon element
     */
    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'requested':
                return <Receipt fontSize="small"/>;
            case 'scheduled':
                return <Schedule fontSize="small"/>;
            case 'picked up':
                return <LocalShipping fontSize="small"/>;
            case 'received':
                return <CheckCircle fontSize="small"/>;
            default:
                return <Receipt fontSize="small"/>;
        }
    };

    /**
     * Navigate to collection request details
     *
     * @param {number} id Collection request ID
     * @returns {Function} Click handler
     */
    const handleShow = (id) => (e) => {
        e.preventDefault();
        router.visit(route("admin.collectRequests.show", id));
    };

    /**
     * Handle send to server action
     *
     * @param {number} id Collection request ID
     * @returns {Function} Click handler
     */
    const handleSendToServer = (id) => (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to send this collection request to the server?')) {
            router.post(route("admin.collectRequests.send", id), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    reload();
                }
            });
        }
    };

    /**
     * Handle page change
     *
     * @param {Event} e Event object
     */
    const handlePage = (e) => {
        e.preventDefault();
        reload();
    };

    /**
     * Handle search input change
     *
     * @param {Event} e Change event
     */
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    /**
     * Apply search filter
     */
    const applySearch = () => {
        const filters = {...data.filters, search: searchTerm};
        onFilterChange(filters);
        handlePage({
            preventDefault: () => {
            }
        });
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
        setSearchTerm("");
        onFilterChange({});
        handlePage({
            preventDefault: () => {
            }
        });
    };

    /**
     * Handle search on Enter key
     *
     * @param {Event} e Keydown event
     */
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            applySearch();
        }
    };

    /**
     * Table columns definition
     */
    const columns = useMemo(() => [
        {
            field: "user_name",
            title: "Customer",
            type: "text",
            filter: {
                name: "user_name",
                label: "Customer Name",
                type: "text",
                value: data?.filters?.user_name
            },
            sortable: true,
            render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Person color="primary"/>
                    <Typography variant="body2">
                        {row.user_name || "—"}
                    </Typography>
                </Stack>
            )
        },
        {
            field: "status",
            title: "Status",
            type: "text",
            sortable: true,
            render: (row) => (
                <Chip
                    icon={getStatusIcon(row.status)}
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{
                        fontWeight: 'medium',
                        textTransform: 'capitalize'
                    }}
                />
            )
        },
        {
            field: "orders_count",
            title: "Orders",
            type: "number",
            sortable: true,
            render: (row) => (
                <Chip
                    label={row.orders_count}
                    size="small"
                    color="primary"
                    variant={row.orders_count > 0 ? "filled" : "outlined"}
                />
            )
        },
        {
            field: "preferred_date",
            title: "Preferred Pickup",
            type: "text",
            sortable: true,
            render: (row) => (
                row.preferred_date ? <Stack direction="row" spacing={1} alignItems="center">
                    <Event color="info" fontSize="small"/>
                    <Typography variant="body2" color="text.secondary">
                        {new Date(row.preferred_date).toDateString()}
                    </Typography>
                </Stack> : null
            )
        },
        {
            field: "created_at",
            title: "Requested At",
            type: "text",
            sortable: true,
            render: (row) => (
                <Typography variant="body2" color="text.secondary">
                    {formatDate(row.created_at)}
                </Typography>
            )
        },
        {
            field: "actions",
            title: "Actions",
            type: "actions",
            width: "150px",
            render: (row) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                        <IconButton
                            onClick={handleShow(row.id)}
                            href={route("admin.collectRequests.show", row.id)}
                            size="small"
                            color="primary"
                        >
                            <RemoveRedEye fontSize="small"/>
                        </IconButton>
                    </Tooltip>

                    {!row.server_id && (
                        <Tooltip title="Send to Server">
                            <IconButton
                                onClick={handleSendToServer(row.id)}
                                size="small"
                                color="success"
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'success.lighter'
                                    }
                                }}
                            >
                                <Send fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}

                    {row.deletable && (
                        <DeleteButton
                            url={route("admin.collectRequests.destroy", row.id)}
                            size="small"
                            IconProps={{fontSize: 'small'}}
                        />
                    )}
                </Stack>
            )
        }
    ], [data?.filters]);

    return (
        <>
            <PageHeader
                title="Collection Requests"
                subtitle="Manage pickup and delivery requests"
                icon={<LocalShipping fontSize="large"/>}
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
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={2}
                        alignItems={{xs: 'stretch', sm: 'center'}}
                        justifyContent="space-between"
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <TextField
                                placeholder="Search requests..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" color="action"/>
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
                                                <ClearIcon fontSize="small"/>
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{minWidth: 250}}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt/>}
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
                                        sx={{ml: 1}}
                                    />
                                )}
                            </Button>

                            {Object.keys(data.filters || {}).length > 0 && (
                                <Button
                                    variant="text"
                                    startIcon={<ClearIcon/>}
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
                                    <RefreshIcon/>
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
                                direction={{xs: 'column', md: 'row'}}
                                spacing={2}
                                sx={{mt: 1}}
                            >
                                <TextField
                                    label="Customer Name"
                                    size="small"
                                    fullWidth
                                    value={data.filters?.user_name || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...data.filters,
                                            user_name: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                />

                                <TextField
                                    select
                                    label="Status"
                                    size="small"
                                    fullWidth
                                    SelectProps={{
                                        native: true,
                                    }}
                                    value={data.filters?.status || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...data.filters,
                                            status: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="requested">Requested</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="picked up">Picked Up</option>
                                    <option value="received">Received</option>
                                </TextField>

                                <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-end'}}>
                                    <Button
                                        variant="contained"
                                        onClick={() => handlePage({
                                            preventDefault: () => {
                                            }
                                        })}
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
                <Box sx={{overflowX: "auto"}}>
                    <TableLayout
                        columns={columns}
                        data={collectRequestsData}
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
                                type: "desc"
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
                                <LocalShipping fontSize="large" color="disabled" sx={{fontSize: 64}}/>
                                <Typography variant="h6" color="text.secondary">
                                    No Collection Requests Found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{maxWidth: 400, mx: 'auto'}}>
                                    {data.filters && Object.keys(data.filters).length > 0
                                        ? "Try adjusting your filters or search terms to find what you're looking for."
                                        : "There are no collection requests in the system yet."}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>
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
