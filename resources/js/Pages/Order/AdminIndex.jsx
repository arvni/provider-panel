import React, { useState } from "react";
import {
    Button,
    IconButton,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Tooltip,
    useTheme,
    alpha,
} from "@mui/material";
import {
    RemoveRedEye,
    Download as DownloadIcon,
    Schedule as ScheduleIcon,
    ForwardToInbox as ForwardToInboxIcon,
    CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";
import { router, usePage } from "@inertiajs/react";
import { useSnackbar } from "notistack";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { usePageReload } from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";

/**
 * Admin Orders Index — lists every order across all providers (read-only).
 */
const AdminIndex = ({ orders: { data: ordersData, ...pagination }, request }) => {
    const theme = useTheme();
    const { auth } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();

    // Both row actions are gated on the same admin permission as their policies.
    const canAdminister = auth?.permissions?.includes("Admin.Order.Update");

    // Mirrors OrderPolicy::resendNotification — a pending order is a draft the
    // provider has not submitted yet, so it has no state worth announcing.
    const isNotifiable = (row) => row.status !== "pending";

    // Mirrors OrderPolicy::fetchStatus — anything the lab has never been handed
    // cannot be looked up there.
    const NEVER_SENT_TO_LAB = ["pending", "requested"];
    const isLookupable = (row) => !NEVER_SENT_TO_LAB.includes(row.status);

    // The row awaiting confirmation, or null when the dialog is closed.
    const [resendTarget, setResendTarget] = useState(null);
    const [resending, setResending] = useState(false);
    // Id of the order currently being looked up at the lab, or null.
    const [fetchingId, setFetchingId] = useState(null);

    // Both actions report through the flash message the controller set, so the
    // page never has to guess at an outcome only the server knows.
    const announce = (page) =>
        enqueueSnackbar(page.props.status, {
            variant: page.props.error ? "warning" : "success",
        });

    const {
        data,
        processing,
        reload,
        onFilterChange,
        onPageChange,
        onPageSizeChange,
        onOrderByChange,
        get,
    } = usePageReload(request, ["orders", "request", "status"]);

    // Handler for navigation
    const gotoPage = (url) => (e) => {
        e.preventDefault();
        get(url);
    };

    // Handle page refresh
    const handlePage = (e) => {
        e.preventDefault();
        reload();
    };

    // Re-send the notification for the status the order is on right now. The
    // list is left untouched -- nothing about the order changes -- so the visit
    // preserves state and only reports back through the snackbar.
    const handleResendNotification = () => {
        if (!resendTarget) return;

        router.post(
            route("admin.orders.resendNotification", resendTarget.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setResending(true),
                onSuccess: (page) => {
                    setResendTarget(null);
                    announce(page);
                },
                onError: () =>
                    enqueueSnackbar("The notification could not be sent.", {
                        variant: "error",
                    }),
                onFinish: () => setResending(false),
            }
        );
    };

    // Ask the lab where this order stands rather than waiting for the
    // five-minute sweep. Read-only at the lab's end and the outcome is reported
    // either way, so this needs no confirmation step.
    const handleFetchStatus = (row) => {
        router.post(
            route("admin.orders.fetchStatus", row.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setFetchingId(row.id),
                onSuccess: announce,
                onError: () =>
                    enqueueSnackbar("The order status could not be fetched.", {
                        variant: "error",
                    }),
                onFinish: () => setFetchingId(null),
            }
        );
    };

    // Get status color
    const getStatusColor = (status) => {
        const statusMap = {
            pending: "error",
            requested: "info",
            "logistic requested": "warning",
            sent: "primary",
            received: "success",
            processing: "secondary",
            "semi reported": "warning",
            "waiting for financial approval": "warning",
            reported: "success",
            "report downloaded": "default",
        };

        return statusMap[status] || "default";
    };

    // Table columns configuration
    const columns = [
        {
            field: "id",
            title: "#",
            width: "50px",
            type: "text",
            sortable: true,
            filter: {
                name: "id",
                label: "Order ID",
                type: "text",
                value: data?.filters?.id,
            },
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                    #{row.id}
                </Typography>
            ),
        },
        {
            field: "user_name",
            title: "Provider",
            type: "text",
            sortable: true,
            filter: {
                name: "user_name",
                label: "Provider",
                type: "text",
                value: data?.filters?.user_name,
            },
            render: (row) =>
                row.user_name ? (
                    <Typography variant="body2" fontWeight={500}>
                        {row.user_name}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                ),
        },
        {
            field: "server_id",
            title: "Bion ID",
            type: "text",
            sortable: true,
            filter: {
                name: "bion_id",
                label: "Bion ID",
                type: "text",
                value: data?.filters?.bion_id,
            },
            render: (row) =>
                row.server_id ? (
                    <Chip
                        label={`Bion.${row.server_id}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                ),
        },
        {
            field: "test_method",
            title: "Test Name",
            type: "text",
            render: (row) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {row.tests.map((test, i) => (
                        <Chip
                            key={i}
                            label={test.name}
                            size="small"
                            sx={{
                                fontSize: "0.75rem",
                                height: 24,
                            }}
                        />
                    ))}
                </Box>
            ),
        },
        {
            field: "status",
            title: "Status",
            type: "text",
            sortable: true,
            filter: {
                name: "status",
                label: "Status",
                type: "select",
                options: [
                    { value: "", label: "All" },
                    { value: "pending", label: "Pending" },
                    { value: "requested", label: "Requested" },
                    { value: "logistic requested", label: "Logistic Requested" },
                    { value: "sent", label: "Sent" },
                    { value: "received", label: "Received" },
                    { value: "processing", label: "Processing" },
                    { value: "semi reported", label: "Semi Reported" },
                    {
                        value: "waiting for financial approval",
                        label: "Waiting for Financial Approval",
                    },
                    { value: "reported", label: "Reported" },
                    { value: "report downloaded", label: "Report Downloaded" },
                ],
                value: data?.filters?.status || "",
            },
            render: (row) => (
                <Chip
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
        {
            field: "step",
            title: "Progress",
            type: "text",
            render: (row) => {
                if (row.status !== "pending") return null;
                const stepLabels = {
                    "test method": { label: "Test Method", step: 1 },
                    "patient details": { label: "Patient Details", step: 2 },
                    "patient test assignment": { label: "Patient Assignment", step: 3 },
                    "clinical details": { label: "Clinical Details", step: 4 },
                    "sample details": { label: "Sample Details", step: 5 },
                    "consent form": { label: "Consent Form", step: 6 },
                    finalize: { label: "Finalize", step: 7 },
                };
                const info = stepLabels[row.step];
                if (!info) return null;
                return (
                    <Tooltip title={`Step ${info.step} of 7`}>
                        <Chip
                            icon={<ScheduleIcon fontSize="small" />}
                            label={info.label}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                        />
                    </Tooltip>
                );
            },
        },
        {
            field: "patient_full_name",
            title: "Patient Name",
            type: "text",
            sortable: true,
            filter: {
                name: "patient_full_name",
                label: "Patient Name",
                type: "text",
                value: data?.filters?.patient_full_name,
            },
            render: (row) =>
                row.patient_full_name ? (
                    <Typography variant="body2" fontWeight={500}>
                        {row.patient_full_name}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                ),
        },
        {
            field: "reported_at",
            title: "Report Date",
            type: "text",
            sortable: true,
            filter: [
                {
                    name: "reported_at.from",
                    label: "From",
                    type: "date",
                    value: data?.filters?.reported_at?.from,
                    inputProps: { max: data?.filters?.reported_at?.to },
                },
                {
                    name: "reported_at.to",
                    label: "To",
                    type: "date",
                    value: data?.filters?.reported_at?.to,
                    inputProps: { min: data?.filters?.reported_at?.from },
                },
            ],
            render: (row) =>
                row.reported_at ? (
                    <Typography variant="body2">
                        {new Date(row.reported_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        })}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        —
                    </Typography>
                ),
        },
        {
            field: "report",
            title: "Report",
            type: "text",
            sortable: false,
            render: (row) =>
                ["reported", "report downloaded"].includes(row.status) ? (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        href={route("orders.report", row.id)}
                        sx={{ borderRadius: 1.5, textTransform: "none" }}
                        target="_blank"
                    >
                        Download
                    </Button>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Not Ready
                    </Typography>
                ),
        },
        {
            field: "id",
            title: "Actions",
            type: "actions",
            width: "160px",
            render: (row) =>
                row.status !== "pending" ? (
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="View Details">
                            <IconButton
                                href={route("orders.show", row.id)}
                                color="info"
                                size="small"
                                onClick={gotoPage(route("orders.show", row.id))}
                                sx={{
                                    border: "1px solid",
                                    borderColor: alpha(theme.palette.info.main, 0.3),
                                    "&:hover": {
                                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                                    },
                                }}
                            >
                                <RemoveRedEye fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {canAdminister && isLookupable(row) && (
                            <Tooltip title="Fetch the lab's current status for this order">
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        disabled={fetchingId === row.id}
                                        onClick={() => handleFetchStatus(row)}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: alpha(theme.palette.primary.main, 0.3),
                                            "&:hover": {
                                                backgroundColor: alpha(
                                                    theme.palette.primary.main,
                                                    0.1
                                                ),
                                            },
                                        }}
                                    >
                                        {fetchingId === row.id ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : (
                                            <CloudDownloadIcon fontSize="small" />
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        {canAdminister && isNotifiable(row) && (
                            <Tooltip title="Resend status notification to provider">
                                <IconButton
                                    color="success"
                                    size="small"
                                    onClick={() => setResendTarget(row)}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: alpha(theme.palette.success.main, 0.3),
                                        "&:hover": {
                                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                                        },
                                    }}
                                >
                                    <ForwardToInboxIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                ) : null,
        },
    ];

    return (
        <>
            <PageHeader title="All Orders" subtitle="View and track orders across every provider" />

            <Box sx={{ my: 3 }}>
                <TableLayout
                    title="Orders List"
                    columns={columns}
                    data={ordersData}
                    onPageChange={onPageChange}
                    pagination={pagination}
                    onFilterChange={onFilterChange}
                    onFilter={handlePage}
                    filter
                    onOrderByChange={onOrderByChange}
                    loading={processing}
                    onRefresh={reload}
                    tableModel={{
                        sort: data.sort ?? {
                            field: "id",
                            type: "desc",
                        },
                        page: data.page,
                        filter: data.filters,
                    }}
                    pageSize={{
                        defaultValue: data.pageSize ?? 10,
                        onChange: onPageSizeChange,
                    }}
                />
            </Box>

            {/* Resend notification confirmation dialog */}
            <Dialog
                open={Boolean(resendTarget)}
                onClose={() => setResendTarget(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ForwardToInboxIcon color="success" />
                    Resend Status Notification
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This emails <strong>{resendTarget?.user_name}</strong> the notification for
                        order <strong>#{resendTarget?.id}</strong>&apos;s current status (
                        <strong>{resendTarget?.status}</strong>) and adds it to their in-app
                        notifications again. The order itself is not changed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button
                        onClick={() => setResendTarget(null)}
                        variant="outlined"
                        size="small"
                        disabled={resending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResendNotification}
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<ForwardToInboxIcon />}
                        disabled={resending}
                        autoFocus
                    >
                        Resend
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Orders",
        link: "",
        icon: null,
    },
];

// Set layout for the page
AdminIndex.layout = (page) => (
    <ClientLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </ClientLayout>
);

export default AdminIndex;
