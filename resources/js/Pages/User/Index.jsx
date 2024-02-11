import React, {useState} from "react";
import {Alert, Button, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Edit, PasswordOutlined} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/Services/api";
import ChangePasswordForm from "@/Components/ChangePasswordForm";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Users",
        link: "",
        icon: null
    },
];

function Index({users: {data: usersData, ...pagination}, request}) {
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["users"]);
    const [user, setUser] = useState();
    const [openChangePasswordForm, setOpenChangePasswordForm] = useState(false);

    const handleAdd = e => e.preventDefault() || router.visit(route("admin.users.create"));
    const handleOpenChangePasswordForm = (user) => () => setUser(user) || setOpenChangePasswordForm(true);
    const handleCloseChangePasswordForm = () => resetUser() || setOpenChangePasswordForm(false);

    const resetUser = () => setUser(null);

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
            field: "userName",
            title: "userName",
            type: "text",
            filter: {
                name: "userName",
                label: "userName",
                type: "text",
                value: data?.filters?.userName
            },
            sortable: true,
        },
        {
            field: "email",
            title: "Email",
            type: "email",
            filter: {
                name: "email",
                label: "Email",
                type: "text",
                value: data?.filters?.email
            },
            sortable: true,
        },
        {
            field: "roles",
            title: "Role",
            type: "text",
            filter: {
                name: "role",
                label: "Role",
                type: "selectSearch",
                value: data?.filters?.role,
                url: route("api.roles.list")
            },
            render: (row) => row?.roles?.map(item => item.name).join(", "),
            sortable: false,
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={handleEdit(row.id)} href={route("admin.users.edit", row.id)}><Edit/></IconButton>
                <IconButton onClick={handleOpenChangePasswordForm(row)}><PasswordOutlined/></IconButton>
            </Stack>
        }
    ];

    const handleEdit = (id) => e => e.preventDefault() || router.visit(route("admin.users.edit", id))


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Users"
                actions={[
                    <Button variant="contained"
                            href={route("admin.users.create")}
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
                    data={usersData}
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
            <ChangePasswordForm open={openChangePasswordForm} onClose={handleCloseChangePasswordForm} user={user}/>
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
