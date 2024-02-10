import React, {useState} from "react";
import {IconButton, Paper} from "@mui/material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {RemoveRedEye} from "@mui/icons-material";
import {Download} from "@mui/icons-material";
import TestDetails from "@/Pages/Order/Components/TestDetails.jsx";

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
    } = usePageReload(request, ["tests","request"]);
    const [test, setTest] = useState();
    const [openShowForm, setOpenShowForm] = useState(false);

    const handleShow=(id)=>()=>{
        let testIndex=testsData.findIndex(item=>item.id===id)
        if (testIndex>=0) {
            setTest(testsData[testIndex])
            setOpenShowForm(true);
        }
    }
    const handleCloseShowForm=()=>{
        setOpenShowForm(false);
        resetTest();
    }
    const resetTest = () => setTest(null);

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
            title: "TAT",
            type: "text",
            sortable: true,
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
            render: (row) => <IconButton target="_blank"
                                         href={route("file", {
                                             type: "orderForm",
                                             id: row.order_form_id
                                         })}><Download/></IconButton>
        },
        {
            field: "consent_id",
            title: "Consent Form",
            type: "text",
            render: (row) => <IconButton target="_blank"
                                         href={route("file", {
                                             type: "orderForm",
                                             id: row.consent_id
                                         })}><Download/></IconButton>
        },
        {
            field: "id",
            title: "#",
            type: "text",
            render: (row) => <IconButton onClick={handleShow(row.id)}><RemoveRedEye/></IconButton>
        },
    ];


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Tests List"
            />
            <Paper sx={{mt: "3em", p: "1rem",overflowX:"auto"}}>
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
                        orderBy: data.orderBy ?? {
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
            {test &&<TestDetails test={test} open={openShowForm} onClose={handleCloseShowForm}/>}
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
