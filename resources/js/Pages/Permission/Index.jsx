import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import React, {useState} from "react";
import AddForm from "@/Pages/Permission/Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useForm, usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api";
import {Button, IconButton, Stack} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader";
import {Delete, Edit} from "@mui/icons-material";

const Index = () => {
    const {permissions: {data: permissionsData, ...pagination}, request} = usePage().props;
    const {post, setData, data, reset} = useForm();
    const {
        data: queryData,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["permissions","request","status"]);
    const columns = [
        {
            field: "name",
            title: "Name",
            type: "text",
            filter: {
                name: "name",
                label: "Name",
                type: "text",
                value: queryData?.filters?.name
            },
            sortable: true,
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={editPermission(row.id)}><Edit/></IconButton>
                <IconButton onClick={deletePermission(row)}><Delete/></IconButton>
            </Stack>
        },
    ];
    const [permission, setPermission] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [edit, setEdit] = useState(false);

    const editPermission = (id) => async () => {
        setEdit(true);
        const res = await axios.get(route("admin.permissions.show", id));
        setData({...res.data.data, _method: 'put'});
        setOpenAddForm(true);
    };
    const deletePermission = (params) => () => {
        setPermission(params);
        setData({_method: "delete"});
        setOpenDeleteForm(true);
    };
    const handleCloseDeleteForm = () => {
        setPermission(null);
        reset();
        setOpenDeleteForm(false);
    };
    const handleDestroy = async () => {
        post(route('admin.permissions.destroy', permission.id), {
            preserveState: true,
            onSuccess: handleCloseDeleteForm
        });
    };
    const handleSubmitForm = () => post(edit ? route('admin.permissions.update', data.id) : route('admin.permissions.store'), {
        onSuccess: (e) => {
            setOpenAddForm(false);
            reset();
        },
    });
    const addNew = () => {
        setEdit(false);
        setOpenAddForm(true);
    }
    const handlePage = (e) => e.preventDefault() || reload();
    return (
        <>
            <PageHeader
                title="Permissions"
                actions={[
                    <Button variant="contained"
                            onClick={addNew}
                            color="success"
                            startIcon={<AddIcon/>}>
                        Add
                    </Button>
                ]}
            />
            <TableLayout
                columns={columns}
                data={permissionsData}
                onPageChange={onPageChange}
                pagination={pagination}
                onFilterChange={onFilterChange}
                onFilter={handlePage}
                filter
                onOrderByChange={onOrderByChange}
                loading={processing}
                tableModel={{
                    orderBy: queryData.orderBy ?? {
                        field: "id",
                        type: "asc"
                    },
                    page: queryData.page,
                    filter: queryData.filters
                }}
                pageSize={{
                    defaultValue: data.pageSize ?? 10,
                    onChange: onPageSizeChange
                }}
            />
            <DeleteForm title={`${permission?.name} Permission`} agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm} openDelete={openDeleteForm}/>
            <AddForm title={`${!edit ? "Add New" : "Edit"} Permission`} loading={processing} open={openAddForm}
                     values={data} reset={reset}
                     setValues={setData} setOpen={setOpenAddForm} submit={handleSubmitForm}/>
        </>);
}
const breadCrumbs = [
    {
        title: "Permissions",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
