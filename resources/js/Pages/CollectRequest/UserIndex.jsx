import React, { useState } from "react";
import { Button, IconButton, Paper, Typography, Box, Chip, useTheme, alpha } from "@mui/material";
import { Add as AddIcon, RemoveRedEye as ViewIcon } from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { usePageReload } from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";
import StandaloneRequestForm from "./Components/StandaloneRequestForm";
import { kitLabel, requestedKits } from "./kits";

/**
 * User Logistic Requests Index component
 */
const UserIndex = ({
    collectRequests: { data: collectRequestsData, ...pagination },
    sampleTypes = [],
    collectableSampleTypes = [],
    canRequestKit = false,
    request,
}) => {
    const theme = useTheme();
    const [formOpen, setFormOpen] = useState(false);

    const {
        data,
        processing,
        reload,
        onFilterChange,
        onPageChange,
        onPageSizeChange,
        onOrderByChange,
        get,
    } = usePageReload(request, ["collectRequests", "request"]);

    // Handler for navigation
    const gotoPage = (url) => (e) => {
        e.preventDefault();
        get(url);
    };

    // Get status color
    const getStatusColor = (status) => {
        const statusMap = {
            pending: "warning",
            waiting_for_assign: "info",
            sample_collector_on_the_way: "primary",
            picked_up: "secondary",
            received: "success",
            cancelled: "error",
        };
        return statusMap[status?.toLowerCase()] || "default";
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labelMap = {
            pending: "Pending",
            waiting_for_assign: "Waiting for Assignment",
            sample_collector_on_the_way: "Collector On The Way",
            picked_up: "Picked Up",
            received: "Received",
            cancelled: "Cancelled",
        };
        return labelMap[status?.toLowerCase()] || status;
    };

    // Table columns configuration
    const columns = [
        {
            field: "id",
            title: "#",
            width: "50px",
            type: "text",
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                    #{row.id}
                </Typography>
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
                    { value: "waiting_for_assign", label: "Waiting for Assignment" },
                    { value: "sample_collector_on_the_way", label: "Collector On The Way" },
                    { value: "picked_up", label: "Picked Up" },
                    { value: "received", label: "Received" },
                ],
                value: data?.filters?.status || "",
            },
            render: (row) => (
                <Chip
                    label={getStatusLabel(row.status)}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{ fontWeight: 500 }}
                />
            ),
        },
        {
            field: "orders_count",
            title: "Orders",
            type: "text",
            render: (row) => (
                <Chip
                    label={row.orders_count || 0}
                    size="small"
                    color={row.orders_count > 0 ? "primary" : "default"}
                    sx={{ fontWeight: 500, minWidth: 40 }}
                />
            ),
        },
        {
            field: "requested",
            title: "Requested",
            type: "component",
            // Requests raised without an order carry either the ordered kits or
            // the sample types waiting for pickup, never both.
            render: (row) => {
                const kits = requestedKits(row.details);
                const sampleTypes = row.details?.sample_types || [];

                if (kits.length === 0 && sampleTypes.length === 0) {
                    return <Typography variant="body2">—</Typography>;
                }

                return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {kits.map((kit, index) => (
                            <Chip
                                key={kit.order_material_id ?? kit.id ?? index}
                                label={kitLabel(kit)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                        {sampleTypes.map((sampleType, index) => (
                            <Chip
                                key={sampleType.id ?? index}
                                label={sampleType.name}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                );
            },
        },
        {
            field: "preferred_date",
            title: "Preferred Date",
            type: "text",
            sortable: true,
            render: (row) => (
                <Typography variant="body2">
                    {row.preferred_date ? new Date(row.preferred_date).toLocaleDateString() : "—"}
                </Typography>
            ),
        },
        {
            field: "created_at",
            title: "Created At",
            type: "text",
            sortable: true,
            render: (row) => (
                <Typography variant="body2">
                    {new Date(row.created_at).toLocaleDateString()}
                </Typography>
            ),
        },
        {
            field: "actions",
            title: "Actions",
            type: "component",
            render: (row) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={gotoPage(route("collectRequests.show", row.id))}
                        sx={{
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                        }}
                    >
                        <ViewIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <ClientLayout>
            <PageHeader
                title="My Logistic Requests"
                actions={[
                    <Button
                        key="new-request"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setFormOpen(true)}
                    >
                        New Request
                    </Button>,
                ]}
            />
            <StandaloneRequestForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                sampleTypes={sampleTypes}
                collectableSampleTypes={collectableSampleTypes}
                canRequestKit={canRequestKit}
            />
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                }}
            >
                <TableLayout
                    columns={columns}
                    data={collectRequestsData}
                    processing={processing}
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onFilterChange={onFilterChange}
                    onOrderByChange={onOrderByChange}
                    loading={processing}
                    onRefresh={reload}
                    tableModel={{
                        sort: data.sort ?? {
                            field: "created_at",
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
            </Paper>
        </ClientLayout>
    );
};

export default UserIndex;
