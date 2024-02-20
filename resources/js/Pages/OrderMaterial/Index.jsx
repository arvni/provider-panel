import TableLayout from "@/Layouts/TableLayout";

import React, {useState} from "react";
import AddForm from "@/Pages/OrderMaterial/Components/AddForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {useForm, usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api";
import {Button, Paper} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "@/Components/PageHeader";

const Index = () => {
    const {orderMaterials: {data: orderMaterialsData, ...pagination}, request, sampleTypes} = usePage().props;
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
    ];
    const [openAddForm, setOpenAddForm] = useState(false);

    const handleSubmitForm = () => post(route('orderMaterials.store'), {
        onSuccess: (e) => {
            setOpenAddForm(false);
            reset();
        },
    });
    const addNew = () => {

        setOpenAddForm(true);
    }
    const handlePage = (e) => e.preventDefault() || reload();
    return (
        <>
            <PageHeader
                title="OrderMaterials"
                actions={[
                    <Button variant="contained"
                            onClick={addNew}
                            color="success"
                            startIcon={<AddIcon/>}>
                        Add
                    </Button>
                ]}
            />
            <Paper sx={{mt: "1em", p: "1rem",overflowX:"auto"}}>
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
                    defaultValue: data.pageSize ?? 10,
                    onChange: onPageSizeChange
                }}
            />
            <AddForm title={`Add New Order Material`} loading={processing} open={openAddForm}
                     values={data} reset={reset}
                     setValues={setData} setOpen={setOpenAddForm} submit={handleSubmitForm} sampleTypes={sampleTypes}/>
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
