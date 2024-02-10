import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import React, {useState} from "react";
import AddForm from "./Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useForm, usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api.js";
import {Button, IconButton, Stack} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader";
import {Delete, Edit} from "@mui/icons-material";

const Index = () => {
    const {sampleTypes: {data: sampleTypesData, ...pagination}, request} = usePage().props;
    const {post, setData, data, reset} = useForm();
    const {
        data: queryData,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["sampleTypes","request","status"]);
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
            width:"100px",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={editSampleType(row.id)}><Edit/></IconButton>
                <IconButton onClick={deleteSampleType(row)}><Delete/></IconButton>
            </Stack>
        },
    ];
    const [sampleType, setSampleType] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [edit, setEdit] = useState(false);

    const editSampleType = (id) => async () => {
        setEdit(true);
        const res = await axios.get(route("admin.sampleTypes.show", id));
        setData({...res.data.data, _method: 'put'});
        setOpenAddForm(true);
    };
    const deleteSampleType = (params) => () => {
        setSampleType(params);
        setData({_method: "delete"});
        setOpenDeleteForm(true);
    };
    const handleCloseDeleteForm = () => {
        setSampleType(null);
        reset();
        setOpenDeleteForm(false);
    };
    const handleDestroy = async () => {
        post(route('admin.sampleTypes.destroy', sampleType.id), {
            preserveState: true,
            onSuccess: handleCloseDeleteForm
        });
    };
    const handleSubmitForm = () => post(edit ? route('admin.sampleTypes.update', data.id) : route('admin.sampleTypes.store'), {
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
                title="Sample Types"
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
                data={sampleTypesData}
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
            <DeleteForm title={`${sampleType?.name} SampleType`} agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm} openDelete={openDeleteForm}/>
            <AddForm title={`${!edit ? "Add New" : "Edit"} Sample Type`} loading={processing} open={openAddForm}
                     values={data} reset={reset}
                     setValues={setData} setOpen={setOpenAddForm} submit={handleSubmitForm}/>
        </>);
}
const breadCrumbs = [
    {
        title: "Sample Types",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
