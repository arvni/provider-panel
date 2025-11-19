import React, {useState} from "react";
import {
    Button,
    Checkbox,
    IconButton,
    Paper,
    Stack,
    Typography,
    Box,
    Chip,
    Tooltip,
    Badge,
    useTheme,
    useMediaQuery,
    alpha,
} from "@mui/material";
import {
    Edit as EditIcon,
    RemoveRedEye,
    AddCircleOutline as AddIcon,
    LocalShipping as ShippingIcon,
    Download as DownloadIcon,
    ViewList as ViewListIcon,
} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import {usePageReload} from "@/Services/api";
import TableLayout from "@/Layouts/TableLayout";
import DeleteButton from "@/Components/DeleteButton.jsx";
import {motion, AnimatePresence} from "framer-motion";
import SendRequestForm from "@/Pages/Order/Components/SendRequestForm.jsx";

/**
 * Enhanced Orders Index component
 */
const Index = ({orders: {data: ordersData, ...pagination}, request}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const {
        data,
        processing,
        reload,
        onFilterChange,
        onPageChange,
        onPageSizeChange,
        onOrderByChange,
        get
    } = usePageReload(request, ["orders", "request", "status"]);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [openSendRequest, setOpenSendRequest] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Handler for creating new order
    const handleAdd = (e) => {
        e.preventDefault();
        get(route("orders.create"));
    };

    // Handler for navigation
    const gotoPage = (url) => (e) => {
        e.preventDefault();
        get(url);
    };

    // Toggle selection of orders
    const handleToggleSelection = (e, v) => {
        e.stopPropagation();
        let index = selectedOrders.findIndex(item => item.id === Number(e.target.value));

        if (index >= 0) {
            let newSelected = [...selectedOrders];
            newSelected.splice(index, 1);
            setSelectedOrders(newSelected);
        } else if (v) {
            let newItem = ordersData.find(item => item.id === Number(e.target.value));
            setSelectedOrders(prevState => ([...prevState, newItem]));
        }
    };

    // Select all eligible orders
    const handleSelectAll = () => {
        const eligibleOrders = ordersData.filter(order => order.status === "requested");

        if (selectedOrders.length === eligibleOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(eligibleOrders);
        }
    };

    // Toggle selection mode
    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        if (isSelectMode) {
            setSelectedOrders([]);
        }
    };

    // Handle page refresh
    const handlePage = (e) => {
        e.preventDefault();
        reload();
    };

    // Open send request dialog
    const handleSendRequest = () => setOpenSendRequest(true);

    // Close send request dialog
    const handleCloseSendRequest = () => {
        setOpenSendRequest(false);
        setSelectedOrders([]);
        setIsSelectMode(false);
        reload();
    };

    // Get status color
    const getStatusColor = (status) => {
        const statusMap = {
            'requested': 'info',
            'logistic requested': 'warning',
            'sent': 'primary',
            'received': 'success',
            'processing': 'secondary',
            'reported': 'success',
            'report downloaded': 'default',
            'pending': 'error'
        };

        return statusMap[status] || 'default';
    };

    // Table columns configuration
    const columns = [
        {
            field: "id",
            title: "#",
            width: "50px",
            type: "text",
            render: (row) => (
                isSelectMode && row.status === "requested" ? (
                    <Checkbox
                        value={row.id}
                        onChange={handleToggleSelection}
                        disabled={row.status !== "requested"}
                        checked={selectedOrders.some(item => item.id === row.id)}
                        sx={{
                            '&.Mui-checked': {
                                color: theme.palette.primary.main,
                            }
                        }}
                    />
                ) : (
                    <Typography variant="body2" fontWeight={500}>#{row.id}</Typography>
                )
            )
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
            render: (row) => row.server_id ? (
                <Chip
                    label={`Bion.${row.server_id}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{fontWeight: 500}}
                />
            ) : (
                <Typography variant="body2" color="text.secondary">—</Typography>
            ),
        },
        {
            field: "test_method",
            title: "Test Name",
            type: "text",
            sortable: true,
            render: (row) => (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                    {row.tests.map((test, i) => (
                        <Chip
                            key={i}
                            label={test.name}
                            size="small"
                            sx={{
                                fontSize: '0.75rem',
                                height: 24
                            }}
                        />
                    ))}
                </Box>
            )
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
                    {value: "", label: "All"},
                    {value: "requested", label: "Requested"},
                    {value: "logistic requested", label: "Logistic Requested"},
                    {value: "sent", label: "Sent"},
                    {value: "received", label: "Received"},
                    {value: "processing", label: "Processing"},
                    {value: "reported", label: "Reported"},
                    {value: "report downloaded", label: "Report Downloaded"},
                ],
                value: data?.filters?.status || ''
            },
            render: (row) => (
                <Chip
                    label={row.status}
                    size="small"
                    color={getStatusColor(row.status)}
                    sx={{fontWeight: 500}}
                />
            )
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
            render: (row) => (
                <Typography variant="body2" fontWeight={500}>
                    {row.patient_full_name}
                </Typography>
            )
        },
        {
            field: "patient_date_of_birth",
            title: "Patient DOB",
            type: "string",
            sortable: true,
            filter: [
                {
                    name: "patient_date_of_birth.from",
                    label: "From",
                    type: "date",
                    value: data?.filters?.patient_date_of_birth?.from,
                    inputProps: {max: data?.filters?.patient_date_of_birth?.to}
                },
                {
                    name: "patient_date_of_birth.to",
                    label: "To",
                    type: "date",
                    value: data?.filters?.patient_date_of_birth?.to,
                    inputProps: {min: data?.filters?.patient_date_of_birth?.from}
                }
            ],
            render: (row) => (
                <Typography variant="body2">
                    {new Date(row.patient_date_of_birth).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </Typography>
            )
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
                    inputProps: {max: data?.filters?.sent_at?.to}
                },
                {
                    name: "sent_at.to",
                    label: "To",
                    type: "date",
                    value: data?.filters?.sent_at?.to,
                    inputProps: {min: data?.filters?.sent_at?.from}
                }
            ],
            render: (row) => (
                row.sent_at ? (
                    <Typography variant="body2">
                        {new Date(row.sent_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                )
            )
        },
        {
            field: "report",
            title: "Report",
            type: "text",
            sortable: false,
            render: (row) => (
                ["reported", "report downloaded"].includes(row.status) ? (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon/>}
                        href={route("orders.report", row.id)}
                        sx={{borderRadius: 1.5, textTransform: 'none'}}
                        target="_blank"
                    >
                        Download
                    </Button>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Not Ready
                    </Typography>
                )
            )
        },
        {
            field: "id",
            title: "Actions",
            type: "actions",
            width: "120px",
            render: (row) => (
                <Stack direction="row" spacing={1} justifyContent="center">
                    {row.status !== "pending" && (
                        <Tooltip title="View Details">
                            <IconButton
                                href={route("orders.show", row.id)}
                                color="info"
                                size="small"
                                onClick={gotoPage(route("orders.show", row.id))}
                                sx={{
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.info.main, 0.3),
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                                    }
                                }}
                            >
                                <RemoveRedEye fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}

                    {row.editable && (
                        <Tooltip title="Edit Order">
                            <IconButton
                                href={route("orders.edit", {order: row.id, step: row.step})}
                                color="warning"
                                size="small"
                                onClick={gotoPage(route("orders.edit", {order: row.id, step: row.step}))}
                                sx={{
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.warning.main, 0.3),
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                    }
                                }}
                            >
                                <EditIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}

                    {row.deletable && (
                        <DeleteButton
                            url={route("orders.destroy", row.id)}
                            size="small"
                            iconProps={{fontSize: "small"}}
                            buttonProps={{
                                sx: {
                                    border: '1px solid',
                                    borderColor: alpha(theme.palette.error.main, 0.3),
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    }
                                }
                            }}
                        />
                    )}
                </Stack>
            )
        }
    ];

    const showSelectOrder = ordersData.some(order => order.status === "requested")

    return (
        <>
            <PageHeader
                title="Orders"
                subtitle="Manage and track all patient test orders"
                actions={[
                    showSelectOrder && <Button
                        variant="outlined"
                        color={isSelectMode ? "primary" : "inherit"}
                        onClick={toggleSelectMode}
                        startIcon={<ViewListIcon/>}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            mr: 1
                        }}
                    >
                        {isSelectMode ? 'Exit Selection' : 'Select Orders'}
                    </Button>,
                    <Button
                        variant="contained"
                        href={route("orders.create")}
                        onClick={handleAdd}
                        color="primary"
                        startIcon={<AddIcon/>}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }
                        }}
                    >
                        New Order
                    </Button>
                ]}
            />

            <Box sx={{my: 3}}>
                <AnimatePresence>
                    {selectedOrders.length > 0 && (
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            transition={{duration: 0.3}}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: theme.palette.primary.main,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }}
                            >
                                <Stack
                                    direction={{xs: 'column', sm: 'row'}}
                                    spacing={2}
                                    alignItems={{xs: 'flex-start', sm: 'center'}}
                                    justifyContent="space-between"
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <Badge
                                            badgeContent={selectedOrders.length}
                                            color="primary"
                                            sx={{
                                                '& .MuiBadge-badge': {
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    minWidth: 20,
                                                    height: 20,
                                                }
                                            }}
                                        >
                                            <ShippingIcon color="primary"/>
                                        </Badge>
                                        <Typography variant="subtitle1" sx={{fontWeight: 500}}>
                                            Selected Orders
                                        </Typography>
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        width={{xs: '100%', sm: 'auto'}}
                                    >
                                        <Button
                                            variant="outlined"
                                            color="inherit"
                                            size="small"
                                            onClick={() => setSelectedOrders([])}
                                            sx={{
                                                borderRadius: 1.5,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Clear
                                        </Button>

                                        <Button
                                            variant={isMobile ? "outlined" : "contained"}
                                            size="small"
                                            color="primary"
                                            startIcon={<ShippingIcon/>}
                                            onClick={handleSendRequest}
                                            sx={{
                                                borderRadius: 1.5,
                                                textTransform: 'none',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                },
                                                flexGrow: {xs: 1, sm: 0}
                                            }}
                                        >
                                            {isMobile ? 'Request' : 'Send Pickup Request'}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

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
                        type: "asc"
                    },
                    page: data.page,
                    filter: data.filters
                }}
                pageSize={{
                    defaultValue: data.pageSize ?? 10,
                    onChange: onPageSizeChange
                }}
                headerActions={isSelectMode && (
                    <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={handleSelectAll}
                        sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            ml: 1
                        }}
                    >
                        {selectedOrders.length === ordersData.filter(order => order.status === "requested").length
                            ? 'Deselect All'
                            : 'Select All Eligible'
                        }
                    </Button>
                )}
            />

            <SendRequestForm
                open={openSendRequest}
                onClose={handleCloseSendRequest}
                orders={selectedOrders}
            />
        </>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Orders",
        link: "",
        icon: null
    },
];

// Set layout for the page
Index.layout = (page) => <ClientLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
