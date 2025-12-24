import React, {useState, useMemo} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TableLayout from "@/Layouts/TableLayout";
import AddForm from "@/Pages/OrderMaterial/Components/AddForm";
import PageHeader from "@/Components/PageHeader";
import {useForm, usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api";
import {
    Box,
    Button,
    Chip, Collapse,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    FilterAlt as FilterIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Science as ScienceIcon
} from "@mui/icons-material";
import {format} from 'date-fns';

/**
 * OrderMaterials Index component
 * Lists all order materials with filtering and pagination
 *
 * @returns {JSX.Element} Rendered component
 */
const Index = () => {
    // Page props from Inertia
    const {
        orderMaterials: {data: orderMaterialsData, ...pagination},
        request,
        sampleTypes
    } = usePage().props;

    // State for search term
    const [searchTerm, setSearchTerm] = useState("");

    // Form state for adding new order material
    const {post, setData, data, reset, processing: submitting} = useForm({amount:1});

    // Page reload state
    const {
        data: queryData,
        processing: loadingTable,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["orderMaterials", "request", "status"]);

    // State for form dialog
    const [openAddForm, setOpenAddForm] = useState(false);

    // State for filter panel
    const [showFilters, setShowFilters] = useState(false);

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            return format(new Date(dateString), 'MMM d, yyyy h:mm a');
        } catch (e) {
            return dateString;
        }
    };

    // Status chip component
    const StatusChip = ({status}) => {
        const getStatusProps = () => {
            switch (status?.toLowerCase()) {
                case 'ORDERED':
                    return {color: 'warning', label: 'Ordered'};
                case 'PROCESSED':
                    return {color: 'success', label: 'Processed'};
                default:
                    return {color: 'default', label: status || 'Unknown'};
            }
        };

        const {color, label} = getStatusProps();

        return (
            <Chip
                label={label}
                color={color}
                size="small"
                variant="filled"
                sx={{fontWeight: 500}}
            />
        );
    };

    // Table columns definition
    const columns = useMemo(() => [
        {
            field: "sample_type_name",
            title: "Sample Type",
            type: "text",
            sortable: true,
            render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <ScienceIcon color="primary" fontSize="small"/>
                    <Typography variant="body2">
                        {row?.sample_type_name || "—"}
                    </Typography>
                </Stack>
            )
        },
        {
            field: "amount",
            title: "Amount",
            type: "text",
            sortable: true,
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                    {row?.amount || "—"}
                </Typography>
            )
        },
        {
            field: "status",
            title: "Status",
            type: "text",
            sortable: true,
            render: (row) => <StatusChip status={row.status}/>
        },
        {
            field: "created_at",
            title: "Ordered At",
            type: "datetime",
            sortable: true,
            valueGetter:(value)=>new Date(value),
        }
    ], []);

    /**
     * Handle form submission
     */
    const handleSubmitForm = () => {
        post(route('orderMaterials.store'), {
            onSuccess: () => {
                setOpenAddForm(false);
                reset();
            },
        });
    };

    /**
     * Open the add form dialog
     */
    const addNew = () => {
        setOpenAddForm(true);
    };

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
        const filters = {...queryData.filters, search: searchTerm};
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
     */
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            applySearch();
        }
    };

    return (
        <>
            <PageHeader
                title="Order Materials"
                subtitle="Request sample materials for diagnostic tests"
                actions={[
                    <Button
                        variant="contained"
                        onClick={addNew}
                        color="primary"
                        startIcon={<AddIcon/>}
                        disabled={submitting}
                        key="add-button"
                    >
                        Order New Material
                    </Button>
                ]}
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
                                placeholder="Search orders..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action"/>
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    if (queryData.filters?.search) {
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
                                startIcon={<FilterIcon/>}
                                size="medium"
                                onClick={() => setShowFilters(!showFilters)}
                                color={Object.keys(queryData.filters || {}).length > 0 ? "primary" : "inherit"}
                            >
                                Filters
                                {Object.keys(queryData.filters || {}).length > 0 && (
                                    <Chip
                                        label={Object.keys(queryData.filters || {}).length}
                                        size="small"
                                        color="primary"
                                        sx={{ml: 1}}
                                    />
                                )}
                            </Button>

                            {Object.keys(queryData.filters || {}).length > 0 && (
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
                                    disabled={loadingTable}
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
                                {/* Add your filter components here */}
                                <TextField
                                    select
                                    label="Status"
                                    size="small"
                                    fullWidth
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    SelectProps={{
                                        native: true,
                                    }}
                                    value={queryData.filters?.status || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...queryData.filters,
                                            status: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="ORDERED">Ordered</option>
                                    <option value="PROCESSED">Processed</option>
                                </TextField>

                                <TextField
                                    select
                                    label="Sample Type"
                                    size="small"
                                    fullWidth
                                    SelectProps={{
                                        native: true,
                                    }}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    value={queryData.filters?.sample_type_id || ''}
                                    onChange={(e) => {
                                        const filters = {
                                            ...queryData.filters,
                                            sample_type_id: e.target.value
                                        };
                                        onFilterChange(filters);
                                    }}
                                >
                                    <option value="">All Sample Types</option>
                                    {sampleTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </TextField>

                                <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-end'}}>
                                    <Button
                                        variant="contained"
                                        onClick={() => handlePage({
                                            preventDefault: () => {
                                            }
                                        })}
                                        disabled={loadingTable}
                                    >
                                        Apply Filters
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        onClick={clearFilters}
                                        disabled={loadingTable}
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
                        data={orderMaterialsData}
                        onPageChange={onPageChange}
                        pagination={pagination}
                        onFilterChange={onFilterChange}
                        onFilter={handlePage}
                        filter={false} // We've built custom filter UI above
                        onOrderByChange={onOrderByChange}
                        loading={loadingTable}
                        tableModel={{
                            orderBy: queryData.orderBy ?? {
                                field: "id",
                                type: "desc"
                            },
                            page: queryData.page,
                            filter: queryData.filters
                        }}
                        pageSize={{
                            defaultValue: queryData.pageSize ?? 10,
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
                                <ScienceIcon fontSize="large" color="disabled" sx={{fontSize: 64}}/>
                                <Typography variant="h6" color="text.secondary">
                                    No Order Materials Found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{maxWidth: 400, mx: 'auto'}}>
                                    {queryData.filters && Object.keys(queryData.filters).length > 0
                                        ? "Try adjusting your filters or search terms to find what you're looking for."
                                        : "Get started by ordering new materials for your diagnostic tests."}
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon/>}
                                    onClick={addNew}
                                    sx={{mt: 2}}
                                >
                                    Order New Material
                                </Button>
                            </Box>
                        }
                    />
                </Box>

                {/* Add form dialog */}
                {openAddForm&&<AddForm
                    title="Order New Material"
                    loading={submitting}
                    open={openAddForm}
                    values={data}
                    reset={reset}
                    setValues={setData}
                    setOpen={setOpenAddForm}
                    submit={handleSubmitForm}
                    sampleTypes={sampleTypes}
                />}
            </Paper>
        </>
    );
};

// Breadcrumbs for the layout
const breadCrumbs = [
    {
        title: "Order Materials",
        link: null,
        icon: <ScienceIcon fontSize="small"/>
    }
];

// Set layout wrapper
Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Index;
