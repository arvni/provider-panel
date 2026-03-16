import React, {useState, useMemo} from "react";
import {
    Box,
    Chip,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/Services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {
    ArticleOutlined,
    Assignment,
    GradingOutlined,
    MedicalInformation,
    RemoveRedEye,
    Science,
    ShoppingCart,
    Timer,
} from "@mui/icons-material";
import TestDetails from "@/Pages/Order/Components/TestDetails.jsx";
import {router} from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Diagnostic Tests",
        link: "",
        icon: <MedicalInformation fontSize="small"/>
    },
];

function Index({tests: {data: testsData, ...pagination}, request}) {

    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["tests", "request"]);

    const [test, setTest] = useState();
    const [openShowForm, setOpenShowForm] = useState(false);

    const handleShow = (id) => () => {
        let testIndex = testsData.findIndex(item => item.id === id);
        if (testIndex >= 0) {
            setTest(testsData[testIndex]);
            setOpenShowForm(true);
        }
    };

    const handleCloseShowForm = () => {
        setOpenShowForm(false);
        setTest(null);
    };

    const createOrder = (id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route("orders.create", {test: id}));
    };

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
                    icon={<Timer fontSize="small"/>}
                />
            );
        }

        return (
            <Chip
                label={`${days} ${days === 1 ? 'day' : 'days'}`}
                size="small"
                color="success"
                variant="outlined"
                icon={<Timer fontSize="small"/>}
            />
        );
    };

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
                <Typography variant="body2" fontWeight="500" fontFamily="monospace" sx={{letterSpacing: '0.5px'}}>
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
                    <MedicalInformation color="primary" fontSize="small"/>
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
                    <Science fontSize="small" color="success"/>
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
                                href={route("file", {type: "orderForm", id: row.order_form_id})}
                                target="_blank"
                            >
                                <Assignment fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}

                    {row?.consent_file && (
                        <Tooltip title="Download Consent Form">
                            <IconButton
                                size="small"
                                color="secondary"
                                href={route("file", {type: "consent", id: row.consent_id})}
                                target="_blank"
                            >
                                <ArticleOutlined fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}

                    {row?.instruction_file && (
                        <Tooltip title="Download Instructions">
                            <IconButton
                                size="small"
                                color="info"
                                href={route("file", {type: 'instruction', id: row.instruction_id})}
                                target="_blank"
                            >
                                <GradingOutlined fontSize="small"/>
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
                            <RemoveRedEye fontSize="small"/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Place an Order">
                        <IconButton
                            href={route("orders.create", {test: row.id})}
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
                            <ShoppingCart fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        },
    ], [data?.filters]);

    return (
        <>
            <PageHeader
                title="Diagnostic Tests"
                subtitle="Browse available tests and place orders"
                icon={<MedicalInformation fontSize="large"/>}
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
                <Box sx={{overflowX: "auto"}}>
                    <TableLayout
                        columns={columns}
                        data={testsData}
                        onPageChange={onPageChange}
                        pagination={pagination}
                        onFilterChange={onFilterChange}
                        filter
                        onOrderByChange={onOrderByChange}
                        loading={processing}
                        onRefresh={reload}
                        tableModel={{
                            sort: data.sort ?? { field: "id", type: "asc" },
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
                                <MedicalInformation fontSize="large" color="disabled" sx={{fontSize: 64}}/>
                                <Typography variant="h6" color="text.secondary">
                                    No Tests Found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{maxWidth: 400, mx: 'auto'}}>
                                    {data.filters && Object.keys(data.filters).length > 0
                                        ? "Try adjusting your filters or search terms to find what you're looking for."
                                        : "There are no diagnostic tests available at the moment."}
                                </Typography>
                            </Box>
                        }
                    />
                </Box>

                {openShowForm && test && <TestDetails test={test} open={openShowForm} onClose={handleCloseShowForm}/>}
            </Paper>
        </>
    );
}

Index.layout = (page) => (
    <AdminLayout
        auth={page.props.auth}
        breadcrumbs={breadcrumbs}
        children={page}
    />
);

export default Index;
