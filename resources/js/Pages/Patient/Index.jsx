import React from "react";
import {
    IconButton,
    Typography,
    Box,
    Chip,
    useTheme,
    alpha,
    Tooltip,
    Stack,
    Button,
} from "@mui/material";
import {
    Edit as EditIcon,
    RemoveRedEye as ViewIcon,
    PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import { usePageReload } from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";

const getGenderLabel = (gender) => ({ '1': 'Male', '0': 'Female', '-1': 'Unknown' }[String(gender)] ?? 'Unknown');
const getGenderColor = (gender) => ({ '1': 'primary', '0': 'secondary', '-1': 'default' }[String(gender)] ?? 'default');

const Index = ({ patients: { data: patientsData, ...pagination }, request }) => {
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

    const gotoPage = (url) => (e) => { e.preventDefault(); get(url); };

    const columns = [
        {
            field: "id",
            title: "#",
            width: "60px",
            type: "text",
            render: (row) => (
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                    #{row.id}
                </Typography>
            )
        },
        {
            field: "fullName",
            title: "Full Name",
            type: "text",
            sortable: true,
            filter: {
                name: "search",
                label: "Search name / ID / Reference",
                type: "text",
                value: data?.filters?.search ?? '',
            },
            render: (row) => (
                <Box>
                    <Typography variant="body2" fontWeight={600}>{row.fullName}</Typography>
                    {row.reference_id && (
                        <Typography variant="caption" color="text.secondary">Ref: {row.reference_id}</Typography>
                    )}
                </Box>
            )
        },
        {
            field: "id_no",
            title: "ID Number",
            type: "text",
            render: (row) => (
                <Typography variant="body2">{row.id_no || '—'}</Typography>
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
                    { value: "", label: "All" },
                    { value: "1", label: "Male" },
                    { value: "0", label: "Female" },
                    { value: "-1", label: "Unknown" },
                ],
                value: data?.filters?.gender ?? ''
            },
            render: (row) => (
                <Chip
                    label={getGenderLabel(row.gender)}
                    size="small"
                    color={getGenderColor(row.gender)}
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                />
            )
        },
        {
            field: "dateOfBirth",
            title: "Date of Birth",
            type: "text",
            sortable: true,
            filter: [
                {
                    name: "dateOfBirth.from",
                    label: "From",
                    type: "date",
                    value: data?.filters?.dateOfBirth?.from ?? '',
                    inputProps: { max: data?.filters?.dateOfBirth?.to },
                },
                {
                    name: "dateOfBirth.to",
                    label: "To",
                    type: "date",
                    value: data?.filters?.dateOfBirth?.to ?? '',
                    inputProps: { min: data?.filters?.dateOfBirth?.from },
                },
            ],
            render: (row) => row.dateOfBirth ? (
                <Typography variant="body2">
                    {new Date(row.dateOfBirth).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                    })}
                </Typography>
            ) : <Typography variant="body2" color="text.secondary">—</Typography>
        },
        {
            field: "nationality",
            title: "Nationality",
            type: "text",
            filter: {
                name: "nationality",
                label: "Nationality",
                type: "text",
                value: data?.filters?.nationality ?? '',
            },
            render: (row) => (
                <Typography variant="body2">
                    {typeof row.nationality === 'object'
                        ? (row.nationality?.label || row.nationality?.name || '—')
                        : (row.nationality || '—')}
                </Typography>
            )
        },
        {
            field: "orders_count",
            title: "Orders",
            type: "text",
            filter: {
                name: "has_orders",
                label: "Has Orders",
                type: "select",
                options: [
                    { value: "", label: "All" },
                    { value: "1", label: "With orders" },
                    { value: "0", label: "Without orders" },
                ],
                value: data?.filters?.has_orders ?? ''
            },
            render: (row) => (
                <Chip
                    label={row.orders_count ?? 0}
                    size="small"
                    color={row.orders_count > 0 ? "primary" : "default"}
                    variant={row.orders_count > 0 ? "filled" : "outlined"}
                    sx={{ fontWeight: 600, minWidth: 36 }}
                />
            )
        },
        {
            field: "order_items_count",
            title: "Tests",
            type: "text",
            render: (row) => (
                <Chip
                    label={row.order_items_count ?? 0}
                    size="small"
                    color={row.order_items_count > 0 ? "info" : "default"}
                    variant={row.order_items_count > 0 ? "filled" : "outlined"}
                    sx={{ fontWeight: 600, minWidth: 36 }}
                />
            )
        },
        {
            field: "actions",
            title: "Actions",
            type: "actions",
            width: "100px",
            render: (row) => (
                <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="View Patient">
                        <IconButton
                            size="small"
                            color="info"
                            href={route("patients.show", row.id)}
                            onClick={gotoPage(route("patients.show", row.id))}
                            sx={{
                                border: '1px solid',
                                borderColor: alpha(theme.palette.info.main, 0.3),
                                '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) }
                            }}
                        >
                            <ViewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Patient">
                        <IconButton
                            size="small"
                            color="warning"
                            href={route("patients.edit", row.id)}
                            onClick={gotoPage(route("patients.edit", row.id))}
                            sx={{
                                border: '1px solid',
                                borderColor: alpha(theme.palette.warning.main, 0.3),
                                '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.1) }
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        },
    ];

    return (
        <>
            <PageHeader
                title="Patients"
                subtitle="Manage and view patient records"
                actions={[
                    <Button
                        key="new-order"
                        variant="contained"
                        href={route("orders.create")}
                        onClick={gotoPage(route("orders.create"))}
                        color="primary"
                        startIcon={<PersonAddIcon />}
                        sx={{ borderRadius: 1.5, textTransform: 'none', boxShadow: 'none' }}
                    >
                        New Order
                    </Button>
                ]}
            />

            <TableLayout
                title="Patient List"
                columns={columns}
                data={patientsData}
                pagination={pagination}
                onPageChange={onPageChange}
                onFilterChange={onFilterChange}
                onOrderByChange={onOrderByChange}
                loading={processing}
                onRefresh={reload}
                filter
                tableModel={{
                    sort: data.sort ?? { field: "id", type: "desc" },
                    page: data.page,
                    filter: data.filters
                }}
                pageSize={{
                    defaultValue: data.pageSize ?? 10,
                    onChange: onPageSizeChange
                }}
            />
        </>
    );
};

const breadcrumbs = [{ title: "Patients", link: "", icon: null }];
Index.layout = (page) => <ClientLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page} />;

export default Index;
