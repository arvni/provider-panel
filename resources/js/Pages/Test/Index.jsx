import React, {useState} from "react";
import {Button, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Delete, Edit} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/Services/api";
import DeleteForm from "@/Components/DeleteForm";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
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
    } = usePageReload(request, ["tests"]);
    const [test, setTest] = useState();
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const handleAdd = e => e.preventDefault() || router.visit(route("admin.tests.create"));
    const handleOpenDeleteForm = (test) => () => setTest(test) || setOpenDeleteForm(true);
    const handleCloseDeleteForm = () => resetTest() || setOpenDeleteForm(false);

    const resetTest = () => setTest(null);

    const handleDelete = () => router.post(
        route("admin.tests.destroy", test.id),
        {_method: "delete"},
        {onSuccess: handleCloseDeleteForm}
    );

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
            field: "id",
            title: "#",
            type: "actions",
            width: "100px",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={handleEdit(row.id)}
                            href={route("admin.tests.edit", row.id)}><Edit/></IconButton>
                <IconButton onClick={handleOpenDeleteForm(row)}><Delete/></IconButton>
            </Stack>
        }
    ];

    const handleEdit = (id) => e => e.preventDefault() || router.visit(route("admin.tests.edit", id))


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Tests"
                actions={[
                    <Button variant="contained"
                            href={route("admin.tests.create")}
                            onClick={handleAdd}
                            color="success"
                            startIcon={<AddIcon/>}>
                        Add
                    </Button>
                ]}
            />
            <Paper sx={{mt: "3em", p: "1rem"}}>
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
            <DeleteForm title={test?.name}
                        agreeCB={handleDelete}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}/>
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
