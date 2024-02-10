import React, {useState} from "react";
import {useForm, usePage} from "@inertiajs/react";
import {Button, IconButton, Paper, Stack} from "@mui/material";
import {Delete, Edit, RemoveRedEye, Add as AddIcon} from "@mui/icons-material";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import AddForm from "@/Pages/Consent/Components/AddForm";
import PageHeader from "@/Components/PageHeader";

import {usePageReload} from "@/Services/api";

const Index = () => {
    const {consents: {data: consentsData, ...pagination}, request} = usePage().props;
    const {post, setData, data, reset} = useForm();
    const {
        data: queryData,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["consents", "request", "status"]);
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
            field: "file",
            title: "File",
            type: "text",
            sortable: false,
            render: (row) => <IconButton href={route("file", {id:row.id,type:"consent"})}
                                         target="_blank"><RemoveRedEye/></IconButton>,
            width:"70px"
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            width: "100px",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={editConsent(row.id)}><Edit/></IconButton>
                <IconButton onClick={deleteConsent(row)}><Delete/></IconButton>
            </Stack>
        },
    ];
    const [consent, setConsent] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [edit, setEdit] = useState(false);

    const editConsent = (id) => async () => {
        setEdit(true);
        const res = await axios.get(route("admin.consents.show", id));
        setData({...res.data.data, _method: 'put'});
        setOpenAddForm(true);
    };
    const deleteConsent = (params) => () => {
        setConsent(params);
        setData({_method: "delete"});
        setOpenDeleteForm(true);
    };
    const handleCloseDeleteForm = () => {
        setConsent(null);
        reset();
        setOpenDeleteForm(false);
    };
    const handleDestroy = async () => {
        post(route('admin.consents.destroy', consent.id), {
            preserveState: true,
            onSuccess: handleCloseDeleteForm
        });
    };
    const handleSubmitForm = () => post(edit ? route('admin.consents.update', data.id) : route('admin.consents.store'), {
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
                title="Consents"
                actions={[
                    <Button variant="contained"
                            onClick={addNew}
                            color="success"
                            startIcon={<AddIcon/>}>
                        Add
                    </Button>
                ]}
            />
            <Paper sx={{mt: "3em", p: "1rem"}}>
                <TableLayout
                    columns={columns}
                    data={consentsData}
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
            </Paper>
            <DeleteForm title={`${consent?.name} Consent`} agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm} openDelete={openDeleteForm}/>
            <AddForm title={`${!edit ? "Add New" : "Edit"} Consent`} loading={processing} open={openAddForm}
                     values={data} reset={reset}
                     setValues={setData} setOpen={setOpenAddForm} submit={handleSubmitForm}/>
        </>);
}
const breadCrumbs = [
    {
        title: "Consents",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
