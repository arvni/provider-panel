import React, { useState, useMemo } from "react";
import {
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
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
    Send,
    CloudDone,
    CloudOff,
    CloudSync,
} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import { usePageReload } from "@/Services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import { router } from "@inertiajs/react";
import DeleteButton from "@/Components/DeleteButton.jsx";
import { isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const breadcrumbs = [
    { title: "Collection Requests", link: "", icon: <LocalShipping fontSize="small" /> },
];

function Index({ collectRequests: { data: collectRequestsData, ...pagination }, request }) {
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["collectRequests", "status", "success", "request"]);

    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [sendDialog, setSendDialog] = useState({ open: false, id: null });

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            if (isValid(date)) return formatInTimeZone(date, 'Asia/Muscat', 'MMM d, yyyy h:mm a');
        } catch (e) { /* fall through */ }
        return dateString;
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'requested': return 'warning';
            case 'scheduled': return 'info';
            case 'picked up': return 'secondary';
            case 'received': return 'success';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'requested': return <Receipt fontSize="small" />;
            case 'scheduled': return <Schedule fontSize="small" />;
            case 'picked up': return <LocalShipping fontSize="small" />;
            case 'received': return <CheckCircle fontSize="small" />;
            default: return <Receipt fontSize="small" />;
        }
    };

    const handleShow = (id) => (e) => {
        e.preventDefault();
        router.visit(route("admin.collectRequests.show", id));
    };

    const handleSendConfirm = () => {
        const id = sendDialog.id;
        setSendDialog({ open: false, id: null });
        router.post(route("admin.collectRequests.send", id), {}, {
            preserveScroll: true,
            onSuccess: () => reload()
        });
    };

    const applySearch = () => {
        onFilterChange({ ...data.filters, search: searchTerm });
        reload();
    };

    const clearFilters = () => {
        setSearchTerm("");
        onFilterChange({});
        reload();
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') applySearch();
    };

    const columns = useMemo(() => [
        {
            field: "user_name",
            title: "Customer",
            sortable: true,
            filter: { name: "user_name", label: "Customer Name", type: "text", value: data?.filters?.user_name },
            render: (row) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Person color="primary" />
                    <Typography variant="body2">{row.user_name || "—"}</Typography>
                </Stack>
            )
        },
        {
            field: "status",
            title: "Status",
            sortable: true,
            render: (row) => (
                <Chip
                    icon={getStatusIcon(row.status)}
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{ fontWeight: 'medium', textTransform: 'capitalize' }}
                />
            )
        },
        {
            field: "server_id",
            title: "Server Sync",
            render: (row) => row.server_id ? (
                <Tooltip title={`Server ID: ${row.server_id}`}>
                    <Chip
                        icon={<CloudDone fontSize="small" />}
                        label="Synced"
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                    />
                </Tooltip>
            ) : (
                <Chip
                    icon={<CloudOff fontSize="small" />}
                    label="Not Sent"
                    size="small"
                    color="default"
                    variant="outlined"
                    sx={{ color: 'text.secondary' }}
                />
            )
        },
        {
            field: "orders_count",
            title: "Orders",
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
            sortable: true,
            render: (row) => row.preferred_date ? (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Event color="info" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                        {new Date(row.preferred_date).toDateString()}
                    </Typography>
                </Stack>
            ) : <Typography variant="body2" color="text.disabled">—</Typography>
        },
        {
            field: "created_at",
            title: "Requested At",
            sortable: true,
            render: (row) => (
                <Typography variant="body2" color="text.secondary">{formatDate(row.created_at)}</Typography>
            )
        },
        {
            field: "actions",
            title: "Actions",
            width: "160px",
            render: (row) => (
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="View Details">
                        <IconButton
                            onClick={handleShow(row.id)}
                            href={route("admin.collectRequests.show", row.id)}
                            size="small"
                            color="primary"
                        >
                            <RemoveRedEye fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {!row.server_id ? (
                        <Tooltip title="Send to Server">
                            <IconButton
                                onClick={() => setSendDialog({ open: true, id: row.id })}
                                size="small"
                                color="success"
                            >
                                <CloudSync fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title={`Synced — Server ID: ${row.server_id}`}>
                            <span>
                                <IconButton size="small" color="success" disabled>
                                    <CloudDone fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )}

                    {row.deletable && (
                        <DeleteButton
                            url={route("admin.collectRequests.destroy", row.id)}
                            size="small"
                            IconProps={{ fontSize: 'small' }}
                        />
                    )}
                </Stack>
            )
        }
    ], [data?.filters]);

    const activeFilterCount = Object.keys(data.filters || {}).length;

    return (
        <>
            <PageHeader
                title="Collection Requests"
                subtitle="Manage pickup and delivery requests"
            />

            <Paper elevation={0} variant="outlined" sx={{ mt: 2, borderRadius: 2, overflow: 'hidden' }}>
                {/* Controls bar */}
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="space-between"
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Search requests..."
                                variant="outlined"
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchTerm && (
                                            <InputAdornment position="end">
                                                <IconButton edge="end" size="small" onClick={() => {
                                                    setSearchTerm("");
                                                    if (data.filters?.search) clearFilters();
                                                }}>
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                sx={{ minWidth: 240 }}
                            />

                            <Button
                                variant="outlined"
                                startIcon={<FilterAlt />}
                                size="medium"
                                onClick={() => setShowFilters(!showFilters)}
                                color={activeFilterCount > 0 ? "primary" : "inherit"}
                            >
                                Filters
                                {activeFilterCount > 0 && (
                                    <Chip label={activeFilterCount} size="small" color="primary" sx={{ ml: 1 }} />
                                )}
                            </Button>

                            {activeFilterCount > 0 && (
                                <Button variant="text" startIcon={<ClearIcon />} size="medium" onClick={clearFilters}>
                                    Clear
                                </Button>
                            )}
                        </Box>

                        <Tooltip title="Refresh data">
                            <IconButton onClick={() => reload()} disabled={processing} color="inherit">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    {/* Advanced filters panel */}
                    <Collapse in={showFilters}>
                        <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                            <Typography variant="subtitle2" gutterBottom>Advanced Filters</Typography>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Customer Name"
                                    size="small"
                                    fullWidth
                                    value={data.filters?.user_name || ''}
                                    onChange={(e) => onFilterChange({ ...data.filters, user_name: e.target.value })}
                                />

                                <TextField
                                    select
                                    label="Status"
                                    size="small"
                                    fullWidth
                                    slotProps={{ select: { native: true } }}
                                    value={data.filters?.status || ''}
                                    onChange={(e) => onFilterChange({ ...data.filters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="requested">Requested</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="picked up">Picked Up</option>
                                    <option value="received">Received</option>
                                </TextField>

                                <TextField
                                    select
                                    label="Server Sync"
                                    size="small"
                                    fullWidth
                                    slotProps={{ select: { native: true } }}
                                    value={data.filters?.synced ?? ''}
                                    onChange={(e) => onFilterChange({ ...data.filters, synced: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="1">Synced to Server</option>
                                    <option value="0">Not Sent</option>
                                </TextField>

                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                                    <Button variant="contained" onClick={() => reload()} disabled={processing}>
                                        Apply
                                    </Button>
                                    <Button variant="outlined" onClick={clearFilters} disabled={processing}>
                                        Clear
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    </Collapse>
                </Box>

                {/* Table */}
                <Box sx={{ overflowX: "auto" }}>
                    <TableLayout
                        columns={columns}
                        data={collectRequestsData}
                        onPageChange={onPageChange}
                        pagination={pagination}
                        onFilterChange={onFilterChange}
                        filter={false}
                        onOrderByChange={onOrderByChange}
                        loading={processing}
                        tableModel={{
                            orderBy: data.sort ?? { field: "id", type: "desc" },
                            page: data.page,
                            filter: data.filters
                        }}
                        pageSize={{ defaultValue: data.pageSize ?? 10, onChange: onPageSizeChange }}
                    />
                </Box>
            </Paper>

            {/* Send to server confirmation dialog */}
            <Dialog open={sendDialog.open} onClose={() => setSendDialog({ open: false, id: null })} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudSync color="success" />
                    Send to Server
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will queue the collection request to be sent to the main server. Once sent, it will be tracked by a server ID. Do you want to proceed?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => setSendDialog({ open: false, id: null })} variant="outlined" size="small">
                        Cancel
                    </Button>
                    <Button onClick={handleSendConfirm} variant="contained" color="success" size="small" startIcon={<Send />} autoFocus>
                        Send
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

Index.layout = (page) => (
    <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page} />
);

export default Index;
