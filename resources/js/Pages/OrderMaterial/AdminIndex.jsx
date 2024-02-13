import TableLayout from "@/Layouts/TableLayout";

import React, {useState} from "react";
import AddForm from "@/Pages/OrderMaterial/Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useForm, usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api";
import {Button, IconButton, Paper, Stack} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader";
import {Edit as EditIcon, RemoveRedEye} from "@mui/icons-material";
import GenerateForm from "@/Pages/OrderMaterial/Components/GenerateForm.jsx";

const Index = () => {
    const {orderMaterials: {data: orderMaterialsData, ...pagination}, request} = usePage().props;
    const {post, setData, data, reset} = useForm();
    const {
        data: queryData,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["orderMaterials", "request", "status"]);
    const columns = [
        {
            field: "sample_type_name",
            title: "Sample Type",
            type: "text",
            sortable: true,
            render: (row) => row?.sample_type?.name
        },
        {
            field: "user.name",
            title: "User",
            type: "text",
            sortable: true,
            render: (row) => row?.user?.name
        },
        {
            field: "amount",
            title: "Amount",
            type: "text",
            sortable: true,
        },
        {
            field: "status",
            title: "Status",
            type: "text",
            sortable: true,
        },
        {
            field: "created_at",
            title: "Ordered At",
            type: "text",
            sortable: true,
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                {row.materials_count ===row.amount  ? <IconButton href={route("admin.orderMaterials.show", row.id)}
                                                        color="success" target="_blank">
                    <RemoveRedEye/>
                </IconButton> : <IconButton onClick={handleGenerate(row)}>
                    <EditIcon/>
                </IconButton>}
            </Stack>
        }
    ];

    const [openGenerateForm, setOpenGenerateForm] = useState(false);

    const handleSubmitForm = () => post(route('admin.orderMaterials.generate',data.id), {
        onSuccess: (e) => {
            setOpenGenerateForm(false);
            reset();
        },
    });
    const handleGenerate =(row) =>() => {
        setData(row)
        setOpenGenerateForm(true);
    }
    const handlePage = (e) => e.preventDefault() || reload();
    return (
        <>
            <PageHeader title="Order Materials"/>
            <Paper sx={{mt: "1em", p: "1rem"}}>
            <TableLayout
                columns={columns}
                data={orderMaterialsData}
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
                    defaultValue: queryData.pageSize ?? 10,
                    onChange: onPageSizeChange
                }}
            />
            <GenerateForm title={`Order Material Generate`}
                     loading={processing}
                     open={openGenerateForm}
                     values={data}
                     reset={reset}
                     setValues={setData}
                     setOpen={setOpenGenerateForm}
                     submit={handleSubmitForm}/>
            </Paper>
        </>);
}
const breadCrumbs = [
    {
        title: "Order Materials",
        link: null,
        icon: null
    }
]
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Index;
