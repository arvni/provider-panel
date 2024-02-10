import React, {useState} from "react";
import {IconButton, Paper, Stack} from "@mui/material";
import {RemoveRedEye} from "@mui/icons-material";
import PageHeader from "@/Components/PageHeader";
import TableLayout from "@/Layouts/TableLayout";
import {usePageReload} from "@/services/api";
import DeleteForm from "@/Components/DeleteForm";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";

const breadcrumbs = [
    {
        title: "Collect Requests",
        link: "",
        icon: null
    },
];

function Index({collectRequests: {data: collectRequestsData, ...pagination}, request}) {
    const {
        data,
        processing,
        reload,
        onPageSizeChange,
        onOrderByChange,
        onFilterChange,
        onPageChange
    } = usePageReload(request, ["collectRequests"]);
    const [collectRequest, setCollectRequest] = useState();
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const handleAdd = e => e.preventDefault() || router.visit(route("admin.collectRequests.create"));
    const handleOpenDeleteForm = (collectRequest) => () => setCollectRequest(collectRequest) || setOpenDeleteForm(true);
    const handleCloseDeleteForm = () => resetCollectRequest() || setOpenDeleteForm(false);

    const resetCollectRequest = () => setCollectRequest(null);

    const handleDelete = () => router.post(
        route("admin.collectRequests.destroy", collectRequest.id),
        {_method: "delete"},
        {onSuccess: handleCloseDeleteForm}
    );

    const columns = [
        {
            field: "user_name",
            title: "User",
            type: "text",
            filter: {
                name: "user_name",
                label: "User",
                type: "text",
                value: data?.filters?.user_name
            },
            sortable: true,
        },
        {
            field: "orders_count",
            title: "No. Orders",
            type: "number",
            sortable: false,
            width: "70px"
        },
        {
            field: "created_at",
            title: "Created At",
            type: "text",
            sortable: true,
        },
        {
            field: "id",
            title: "#",
            type: "actions",
            width: "100px",
            render: (row) => <Stack direction="row" spacing={1}>
                <IconButton onClick={handleShow(row.id)}
                            href={route("admin.collectRequests.show", row.id)}><RemoveRedEye/></IconButton>
            </Stack>
        }
    ];

    const handleShow = (id) => e => e.preventDefault() || router.visit(route("admin.collectRequests.show", id))


    const handlePage = (e) => e.preventDefault() || reload();

    return (<>
            <PageHeader
                title="Collect Requests"
            />
            <Paper sx={{mt: "3em", p: "1rem"}}>
                <TableLayout
                    columns={columns}
                    data={collectRequestsData}
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
            <DeleteForm title={collectRequest?.name}
                        agreeCB={handleDelete}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}/>
        </>
    );
}

Index.layout = (page) => <AdminLayout auth={page.props.auth} breadcrumbs={breadcrumbs} children={page}/>;

export default Index;
