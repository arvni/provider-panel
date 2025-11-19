import React from "react";
import {
    IconButton,
    Paper,
    Typography,
    Box,
    Chip,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Edit as EditIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import {usePageReload} from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";

/**
 * Patients Index component
 */
const Index = ({patients: {data: patientsData, ...pagination}, request}) => {
    const theme = useTheme();

    const {
        data,
        processing,
        reload,
        onFilterChange,
        onPageChange,
        onPageSizeChange,
        onOrderByChange,
        get
    } = usePageReload(request, ["patients", "request"]);

    // Handler for navigation
    const gotoPage = (url) => (e) => {
        e.preventDefault();
        get(url);
    };

    // Get gender label
    const getGenderLabel = (gender) => {
        const genderMap = {
            '1': 'Male',
            '0': 'Female',
            '-1': 'Unknown'
        };
        return genderMap[gender] || 'Unknown';
    };

    // Get gender color
    const getGenderColor = (gender) => {
        const colorMap = {
            '1': 'primary',
            '0': 'secondary',
            '-1': 'default'
        };
        return colorMap[gender] || 'default';
    };

    // Table columns configuration
    const columns = [
        {
            field: "id",
            title: "#",
            width: "50px",
            type: "text",
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>#{row.id}</Typography>
            )
        },
        {
            field: "fullName",
            title: "Full Name",
            type: "text",
            sortable: true,
            filter: {
                name: "search",
                label: "Search (Name, ID, Reference)",
                type: "text",
                value: data?.filters?.search,
            },
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                    {row.fullName}
                </Typography>
            )
        },
        {
            field: "id_no",
            title: "ID Number",
            type: "text",
            render: (row) => (
                <Typography variant="body2">
                    {row.id_no || '—'}
                </Typography>
            )
        },
        {
            field: "reference_id",
            title: "Reference ID",
            type: "text",
            render: (row) => (
                <Typography variant="body2">
                    {row.reference_id || '—'}
                </Typography>
            )
        },
        {
            field: "gender",
            title: "Gender",
            type: "text",
            sortable: true,
            filter: {
                name: "gender",
                label: "Gender",
                type: "select",
                options: [
                    {value: "", label: "All"},
                    {value: "1", label: "Male"},
                    {value: "0", label: "Female"},
                    {value: "-1", label: "Unknown"},
                ],
                value: data?.filters?.gender || ''
            },
            render: (row) => (
                <Chip
                    label={getGenderLabel(row.gender)}
                    size="small"
                    color={getGenderColor(row.gender)}
                    sx={{fontWeight: 500}}
                />
            )
        },
        {
            field: "dateOfBirth",
            title: "Date of Birth",
            type: "text",
            sortable: true,
            render: (row) => (
                <Typography variant="body2">
                    {new Date(row.dateOfBirth).toLocaleDateString()}
                </Typography>
            )
        },
        {
            field: "nationality",
            title: "Nationality",
            type: "text",
            filter: {
                name: "nationality",
                label: "Nationality",
                type: "text",
                value: data?.filters?.nationality,
            },
            render: (row) => (
                <Typography variant="body2">
                    {typeof row.nationality === 'object' ? (row.nationality?.label || row.nationality?.name || '—') : (row.nationality || '—')}
                </Typography>
            )
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
                    sx={{fontWeight: 500, minWidth: 40}}
                />
            )
        },
        {
            field: "order_items_count",
            title: "Tests",
            type: "text",
            render: (row) => (
                <Chip
                    label={row.order_items_count || 0}
                    size="small"
                    color={row.order_items_count > 0 ? "info" : "default"}
                    sx={{fontWeight: 500, minWidth: 40}}
                />
            )
        },
        {
            field: "actions",
            title: "Actions",
            type: "component",
            render: (row) => (
                <Box sx={{display: 'flex', gap: 1}}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={gotoPage(route("patients.edit", row.id))}
                        sx={{
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            }
                        }}
                    >
                        <EditIcon fontSize="small"/>
                    </IconButton>
                </Box>
            )
        },
    ];

    return (
        <ClientLayout>
            <PageHeader title="Patients"/>
            <Paper
                sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: theme.shadows[2],
                }}
            >
                <TableLayout
                    columns={columns}
                    data={patientsData}
                    processing={processing}
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onFilterChange={onFilterChange}
                    onOrderByChange={onOrderByChange}
                    loading={processing}
                    onRefresh={reload}
                    tableModel={{
                        sort: data.sort ?? {
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
                />
            </Paper>
        </ClientLayout>
    );
};

export default Index;
