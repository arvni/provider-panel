import React, {useState} from "react";
import {Button, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Delete, Edit, RemoveRedEye} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/services/api";
import DeleteForm from "@/Components/DeleteForm";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Order Forms",
        link: "",
        icon: null
    },
];

function Index({orderForms: {data: orderFormsData, ...pagination}, request}) {
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["orderForms"]);
    const [orderForm, setOrderForm] = useState();
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const handleAdd = e => e.preventDefault() || router.visit(route("admin.orderForms.create"));
    const handleOpenDeleteForm = (orderForm) => () => setOrderForm(orderForm) || setOpenDeleteForm(true);
    const handleCloseDeleteForm = () => resetOrderForm() || setOpenDeleteForm(false);

    const resetOrderForm = () => setOrderForm(null);

    const handleDelete = () => router.post(
        route("admin.orderForms.destroy", orderForm.id),
        {_method: "delete"},
        {onSuccess: handleCloseDeleteForm}
    );

    const columns = [
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
            field: "file",
            title: "File",
            type: "text",
            sortable: false,
            render: (row) => <IconButton href={route("file", {id: row.id, type: "order-form"})}
                                         target="_blank"><RemoveRedEye/></IconButton>,
            width: "70px"
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            width: "100px",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={handleEdit(row.id)}
                            href={route("admin.orderForms.edit", row.id)}><Edit/></IconButton>
                <IconButton onClick={handleOpenDeleteForm(row)}><Delete/></IconButton>
            </Stack>
        }
    ];

    const handleEdit = (id) => e => e.preventDefault() || router.visit(route("admin.orderForms.edit", id))


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Order Forms"
                actions={[
                    <Button variant="contained"
                            href={route("admin.orderForms.create")}
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
                    data={orderFormsData}
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
            <DeleteForm title={orderForm?.name}
                        agreeCB={handleDelete}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}/>
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
