import React from "react";
import {
    Button,
    IconButton,
    Typography,
    Box,
    Chip,
    Tooltip,
    useTheme,
    alpha,
} from "@mui/material";
import {
    RemoveRedEye,
    Download as DownloadIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { usePageReload } from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";

/**
 * Admin Orders Index — lists every order across all providers (read-only).
 */
const AdminIndex = ({ orders: { data: ordersData, ...pagination }, request }) => {
    const theme = useTheme();

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
            field: "sent_at",
            title: "Pick Up Date",
            type: "text",
            sortable: true,
            filter: [
                {
                    name: "sent_at.from",
                    label: "From",
                    type: "date",
                    value: data?.filters?.sent_at?.from,
                    inputProps: { max: data?.filters?.sent_at?.to },
                },
                {
                    name: "sent_at.to",
                    label: "To",
                    type: "date",
                    value: data?.filters?.sent_at?.to,
                    inputProps: { min: data?.filters?.sent_at?.from },
                },
            ],
            render: (row) =>
                row.sent_at ? (
                    <Typography variant="body2">
                        {new Date(row.sent_at).toLocaleDateString(undefined, {
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
            width: "80px",
            render: (row) =>
                row.status !== "pending" ? (
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
                ) : null,
        },
    ];

    return (
        <>
            <PageHeader
                title="All Orders"
                subtitle="View and track orders across every provider"
            />

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
