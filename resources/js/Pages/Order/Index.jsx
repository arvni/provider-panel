import React, {useState} from "react";

import {Button, Checkbox, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Edit as EditIcon, RemoveRedEye} from "@mui/icons-material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import {usePageReload} from "@/Services/api";
import TableLayout from "../../Layouts/TableLayout";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {router} from "@inertiajs/react";
import DeleteButton from "@/Components/DeleteButton.jsx";


const Index = ({orders: {data: ordersData, ...pagination}, status, request}) => {
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

    const handleAdd = (e) => {
        e.preventDefault();
        get(route("orders.create"))
    };

    const gotoPage = (url) => (e) => {
        e.preventDefault();
        get(url);
    }

    const handleToggleSelection = (e, v) => {
        e.stopPropagation();
        let index = selectedOrders.findIndex(item => item === e.target.value);
        if (index >= 0) {
            let newSelected = [...selectedOrders];
            newSelected.splice(index, 1);
            setSelectedOrders(newSelected);
        } else if (v)
            setSelectedOrders(prevState => ([...prevState, e.target.value]));
    }

    const columns = [
        {
            field: "id",
            title: "#",
            type: "text",
            render: (row) => row.status === "requested" ? <Checkbox value={row.id}
                                                                    onChange={handleToggleSelection}
                                                                    disabled={row.status !== "requested"}
                                                                    defaultChecked={selectedOrders.includes(row.id)}/> : null
        },
        {
            field: "bion_id",
            title: "Bion ID",
            type: "text",
            sortable: true,
            filter: {
                name: "bion_id",
                label: "Bion ID",
                type: "text",
                value: data?.filter?.bion_id,
            }
        },
        {
            field: "test_method",
            title: "Analysis requested",
            type: "text",
            sortable: true,
            render: (row) => row.tests.map((test) => test.name).join(", ")
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
                value: data?.filter?.status
            },
        },
        {
            field: "created_at",
            title: "Created At",
            type: "text",
            sortable: true,
            render: (row) => new Date(row.created_at).toLocaleString(),
            filter: [
                {
                    name: "created_at.from",
                    label: "From",
                    type: "date",
                    value: data?.filter?.created_at?.from,
                    inputProps: {max: data?.filter?.created_at?.to}
                },
                {
                    name: "created_at.to",
                    label: "To",
                    type: "date",
                    value: data?.filter?.created_at?.to,
                    inputProps: {min: data?.filter?.created_at?.from}
                }
            ],
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
                value: data?.filter?.patient_full_name,
            }
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
                    value: data?.filter?.patient_date_of_birth?.from,
                    inputProps: {max: data?.filter?.patient_date_of_birth?.to}
                },
                {
                    name: "patient_date_of_birth.to",
                    label: "To",
                    type: "date",
                    value: data?.filter?.patient_date_of_birth?.to,
                    inputProps: {min: data?.filter?.patient_date_of_birth?.from}
                }
            ],
        },
        {
            field: "sent_at",
            title: "Sent At",
            type: "text",
            sortable: true,
            filter: [
                {
                    name: "sent_at.from",
                    label: "From",
                    type: "date",
                    value: data?.filter?.sent_at?.from,
                    inputProps: {max: data?.filter?.sent_at?.to}
                },
                {
                    name: "sent_at.to",
                    label: "To",
                    type: "date",
                    value: data?.filter?.sent_at?.to,
                    inputProps: {min: data?.filter?.sent_at?.from}
                }
            ],
        },
        {
            field: "report",
            title: "Report",
            type: "text",
            sortable: false,
            render: (row) => ["reported", "report downloaded"].includes(row.status) ?
                <Button href={route("orders.report", row.id)}>Download</Button> : "Not Yet Ready"
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                {row.status !== "pending" ? <IconButton href={route("orders.show", row.id)}
                                                        color="success"
                                                        onClick={gotoPage(route("orders.show", row.id))}>
                    <RemoveRedEye/>
                </IconButton> : null}
                {row.editable ? <IconButton href={route("orders.edit", {order: row.id, step: row.step})}
                                            color="warning"
                                            onClick={gotoPage(route("orders.edit", {order: row.id, step: row.step}))}>
                    <EditIcon/>
                </IconButton> : null}
                {row.deletable ? <DeleteButton url={route("orders.destroy", row.id)}/> : null}
            </Stack>
        }
    ];

    const handlePage = (e) => {
        e.preventDefault();
        reload();
    };
    const handleSendRequest = () => {
        if (selectedOrders.length) {
            router.post(route("orders.logistic"), {selectedOrders}, {onSuccess: () => setSelectedOrders([])});
        }
    }

    return (
        <>
            <PageHeader
                title="Orders"
                actions={[
                    // <Button variant="contained"
                    //         href={route("orders.create")}
                    //         onClick={handleAdd}
                    //         color="success"
                    //         startIcon={<AddIcon/>}>
                    //     Add
                    // </Button>
                ]}
            />
            <Paper sx={{mt: "3em", p: "1rem", overflowX: "auto"}}>
                {selectedOrders.length ? <Box my={2}>
                    <Stack direction="row" spacing={4} alignItems="center">
                        <Typography>Selected Orders {selectedOrders.length}</Typography>
                        <Button variant="contained"
                                onClick={handleSendRequest}>Send Logistic Request</Button>
                    </Stack>
                </Box> : null}
                <TableLayout
                    columns={columns}
                    data={ordersData}
                    onPageChange={onPageChange}
                    pagination={pagination}
                    onFilterChange={onFilterChange}
                    onFilter={handlePage}
                    filter
                    onOrderByChange={onOrderByChange}
                    loading={processing}
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
                />
            </Paper>
        </>
    );
}
const breadcrumbs = [
    {
        title: "Orders",
        link: "",
        icon: null
    },
];


Index.layout = (page) => <ClientLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
