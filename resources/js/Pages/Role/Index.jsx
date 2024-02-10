import React, {useState} from "react";
import {Button, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Delete, Edit} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/services/api";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";
import DeleteForm from "@/Components/DeleteForm.jsx";

const breadcrumbs = [
    {
        title: "Roles",
        link: "",
        icon: null
    },
];

function Index({auth, roles: {data: rolesData, ...pagination}, status, request}) {
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["roles"]);
    const [role, setRole] = useState();
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const handleAdd = e => e.preventDefault() || router.visit(route("admin.roles.create"));
    const handleOpenDeleteForm = (role) => () => setRole(role) || setOpenDeleteForm(true);
    const handleCloseDeleteForm = () => resetRole() || setOpenDeleteForm(false);

    const resetRole = () => setRole(null);

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
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={handleEdit(row.id)} href={route("admin.roles.edit", row.id)}><Edit/></IconButton>
                <IconButton onClick={handleOpenDeleteForm(row)}><Delete/></IconButton>
            </Stack>
        }
    ];

    const handleEdit = (id) => e => e.preventDefault() || router.visit(route("admin.roles.edit", id))


    const handlePage = (e) => e.preventDefault() || reload();

    const handleDelete = () => router.post(route("admin.roles.destroy", role.id), {_method: "delete"}, {onSuccess: handleCloseDeleteForm});

    return (<>
            <PageHeader
                title="Roles"
                actions={[
                    <Button variant="contained"
                            href={route("admin.roles.create")}
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
                    data={rolesData}
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
            <DeleteForm agreeCB={handleDelete}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}
                        title={role?.name}/>
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
