import React, { useState } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    InputAdornment,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    CalendarMonth as CalendarIcon,
    Close as CloseIcon,
    LocalShipping,
    Person,
    Search as SearchIcon,
    Send as SendIcon,
} from "@mui/icons-material";
import axios from "axios";
import { router, useForm } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader";
import AdminLayout from "@/Layouts/AuthenticatedLayout";

const breadcrumbs = [
    {
        title: "Logistic Requests",
        link: "/admin/collectRequests",
        icon: <LocalShipping fontSize="small" />,
    },
    { title: "New Logistic Request", link: null, icon: null },
];

/**
 * Today in the lab's timezone, used as the earliest selectable pickup date so
 * the client-side minimum matches the server's `after_or_equal:today` rule.
 */
const minDate = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Muscat",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const [month, , day, , year] = parts.map((part) => part.value);
    return `${year}-${month}-${day}`;
};

const Add = () => {
    const { data, setData, post, processing, errors } = useForm({
        user_id: "",
        selectedOrders: [],
        preferred_date: minDate(),
        notes: "",
    });

    const [provider, setProvider] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderSearch, setOrderSearch] = useState("");

    const searchProviders = (search) => {
        setLoadingProviders(true);
        axios
            .get(route("admin.collectRequests.providers"), { params: { search } })
            .then(({ data: result }) => setProviders(result.data))
            .finally(() => setLoadingProviders(false));
    };

    const loadOrders = (userId, search = "") => {
        if (!userId) {
            setOrders([]);
            return;
        }
        setLoadingOrders(true);
        axios
            .get(route("admin.collectRequests.collectableOrders"), {
                params: { user_id: userId, search },
            })
            .then(({ data: result }) => setOrders(result.data))
            .finally(() => setLoadingOrders(false));
    };

    const handleProviderChange = (_, value) => {
        setProvider(value);
        setData((previous) => ({
            ...previous,
            user_id: value?.id ?? "",
            // The previous provider's orders are no longer selectable.
            selectedOrders: [],
        }));
        setOrderSearch("");
        loadOrders(value?.id);
    };

    const handleOrderSearch = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            loadOrders(data.user_id, orderSearch);
        }
    };

    const toggleOrder = (id) => () =>
        setData(
            "selectedOrders",
            data.selectedOrders.includes(id)
                ? data.selectedOrders.filter((item) => item !== id)
                : [...data.selectedOrders, id]
        );

    const toggleAll = () =>
        setData(
            "selectedOrders",
            data.selectedOrders.length === orders.length ? [] : orders.map((order) => order.id)
        );

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.collectRequests.store"));
    };

    const handleCancel = () => router.visit(route("admin.collectRequests.index"));

    const allSelected = orders.length > 0 && data.selectedOrders.length === orders.length;

    return (
        <>
            <PageHeader
                title="New Logistic Request"
                subtitle="Raise a pickup request on behalf of a provider and attach their requested orders"
            />

            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={0}
                variant="outlined"
                sx={{ p: 3, borderRadius: 2 }}
            >
                <Stack spacing={3}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <Autocomplete
                            value={provider}
                            onChange={handleProviderChange}
                            options={providers}
                            loading={loadingProviders}
                            fullWidth
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            getOptionLabel={(option) =>
                                option.name + (option.email ? ` (${option.email})` : "")
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Provider"
                                    required
                                    error={Boolean(errors.user_id)}
                                    helperText={errors.user_id}
                                    onChange={(e) => searchProviders(e.target.value)}
                                    onFocus={() => !providers.length && searchProviders("")}
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <InputAdornment position="start">
                                                        <Person fontSize="small" color="action" />
                                                    </InputAdornment>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        },
                                    }}
                                />
                            )}
                        />

                        <TextField
                            label="Preferred Pickup Date"
                            type="date"
                            name="preferred_date"
                            value={data.preferred_date}
                            onChange={(e) => setData("preferred_date", e.target.value)}
                            required
                            error={Boolean(errors.preferred_date)}
                            helperText={errors.preferred_date}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: minDate() },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            sx={{ minWidth: { md: 280 } }}
                        />
                    </Stack>

                    <Divider />

                    <Box>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Orders to collect
                                {data.selectedOrders.length > 0 && (
                                    <Chip
                                        label={`${data.selectedOrders.length} selected`}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Typography>

                            <TextField
                                placeholder="Search by order id or patient…"
                                size="small"
                                value={orderSearch}
                                disabled={!data.user_id}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                onKeyDown={handleOrderSearch}
                                onBlur={() => loadOrders(data.user_id, orderSearch)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ minWidth: 260 }}
                            />
                        </Stack>

                        {errors.selectedOrders && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {errors.selectedOrders}
                            </Alert>
                        )}

                        {!data.user_id ? (
                            <Alert severity="info" variant="outlined">
                                Choose a provider to see the orders waiting for pickup.
                            </Alert>
                        ) : loadingOrders ? (
                            <Stack alignItems="center" sx={{ py: 4 }}>
                                <CircularProgress size={28} />
                            </Stack>
                        ) : orders.length === 0 ? (
                            <Alert severity="warning" variant="outlined">
                                This provider has no requested orders available for collection.
                            </Alert>
                        ) : (
                            <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{ maxHeight: 420 }}
                            >
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={
                                                        data.selectedOrders.length > 0 &&
                                                        !allSelected
                                                    }
                                                    onChange={toggleAll}
                                                    inputProps={{
                                                        "aria-label": "Select all orders",
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Tests</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow
                                                key={order.id}
                                                hover
                                                onClick={toggleOrder(order.id)}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={data.selectedOrders.includes(
                                                            order.id
                                                        )}
                                                        onChange={toggleOrder(order.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        inputProps={{
                                                            "aria-label": `Select order ${order.orderId ?? order.id}`,
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>{order.orderId ?? order.id}</TableCell>
                                                <TableCell>
                                                    {order.patient?.fullName ?? "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {order.tests?.map((test) => (
                                                        <Chip
                                                            key={test.id}
                                                            label={test.name}
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {order.created_at
                                                        ? new Date(
                                                              order.created_at
                                                          ).toLocaleDateString()
                                                        : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>

                    <TextField
                        label="Notes (optional)"
                        multiline
                        minRows={2}
                        value={data.notes}
                        onChange={(e) => setData("notes", e.target.value)}
                        error={Boolean(errors.notes)}
                        helperText={errors.notes}
                        fullWidth
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button
                            onClick={handleCancel}
                            variant="outlined"
                            color="inherit"
                            startIcon={<CloseIcon />}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={processing ? <CircularProgress size={18} /> : <SendIcon />}
                            disabled={processing || !data.user_id || !data.selectedOrders.length}
                        >
                            {processing ? "Creating…" : "Create Request"}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </>
    );
};

Add.layout = (page) => (
    <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AdminLayout>
);

export default Add;
