import React, {useState} from "react";
import {IconButton, Paper, Stack} from "@mui/material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/Services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {RemoveRedEye, ShoppingBasket, ShoppingCart} from "@mui/icons-material";
import {Download} from "@mui/icons-material";
import TestDetails from "@/Pages/Order/Components/TestDetails.jsx";
import {router} from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Tests",
        link: "",
        icon: null
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
        let testIndex = testsData.findIndex(item => item.id === id)
        if (testIndex >= 0) {
            setTest(testsData[testIndex])
            setOpenShowForm(true);
        }
    }
    const handleCloseShowForm = () => {
        setOpenShowForm(false);
        resetTest();
    }
    const resetTest = () => setTest(null);

    const creatOrder = (id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route("orders.create", {test: id}));
    }

    const columns = [
        {
            field: "code",
            title: "Code",
            type: "text",
            filter: {
                name: "code",
                label: "Code",
                type: "text",
                value: data?.filters?.cod
            },
            sortable: true,
        },
        {
            field: "name",
            title: "Name",
            type: "text",
            filter: {
                name: "name",
                label: "Name",
                type: "text",
                value: data?.filters?.name
            },
            sortable: true,
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
        },
        {
            field: "turnaroundTime",
            title: "TAT (d(days)-w(weeks))",
            type: "text",
            sortable: true,
            render: (row) => row.turnaroundTime > 30 ? (Math.ceil(row.turnaroundTime / 7) + "w") : (row.turnaroundTime + "d")
        },
        {
            field: "default_sample_type_name",
            title: "Default Sample Type",
            type: "text",
            sortable: true,
        },
        {
            field: "order_form_id",
            title: "Request Form",
            type: "text",
            render: (row) => row?.order_form_file && <IconButton target="_blank"
                                                                 href={route("file", {
                                                                     type: "orderForm",
                                                                     id: row.order_form_id
                                                                 })}><Download/></IconButton>
        },
        {
            field: "consent_id",
            title: "Consent Form",
            type: "text",
            render: (row) => row?.consent_file && <IconButton target="_blank"
                                                              href={route("file", {
                                                                  type: "instruction",
                                                                  id: row.consent_id
                                                              })}><Download/></IconButton>
        },
        {
            field: "instruction_id",
            title: "Instruction",
            type: "text",
            render: (row) => row?.instruction_file && <IconButton target="_blank"
                                                                  href={route("file", {
                                                                      type: "consent",
                                                                      id: row.instruction_id
                                                                  })}><Download/></IconButton>
        },
        {
            field: "id",
            title: "More Information",
            type: "text",
            textAlign: "center",
            render: (row) => <Stack direction="row">
                <IconButton onClick={handleShow(row.id)}><RemoveRedEye/></IconButton>
                <IconButton href={route("orders.create",{test:row.id})}
                            onClick={creatOrder(row.id)}
                            title="Place an Order">
                    <ShoppingCart color="primary"/>
                </IconButton>
            </Stack>
        },
    ];


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Tests List"
            />
            <Paper sx={{mt: "3em", p: "1rem", overflowX: "auto"}}>
                <TableLayout
                    columns={columns}
                    data={testsData}
                    onPageChange={onPageChange}
                    pagination={pagination}
                    onFilterChange={onFilterChange}
                    onFilter={handlePage}
                    filter
                    onOrderByChange={onOrderByChange}
                    loading={processing}
                    tableModel={{
                        orderBy: data.sort ?? {
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
            {test && <TestDetails test={test} open={openShowForm} onClose={handleCloseShowForm}/>}
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
