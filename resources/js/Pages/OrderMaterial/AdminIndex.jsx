import TableLayout from "@/Layouts/TableLayout";

import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {usePage} from "@inertiajs/react";
import {usePageReload} from "@/Services/api";
import {Avatar, IconButton, Paper, Stack} from "@mui/material";
import PageHeader from "@/Components/PageHeader";
import {RemoveRedEye} from "@mui/icons-material";
import Excel from "@/../images/excel.png";

const Index = () => {
    const {orderMaterials: {data: orderMaterialsData, ...pagination}, request} = usePage().props;
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
            type: "datetime",
            sortable: true,
            valueGetter: (value) => new Date(value),

        },
        {
            field: "id",
            title: "#",
            type: "actions",
            render: (row) => <Stack direction="row" spacing={1}>
                {row.materials_count === row.amount ? <IconButton href={route("admin.orderMaterials.show", row.id)}
                                                                  color="success" target="_blank">
                    <RemoveRedEye/>
                </IconButton> :null}
            </Stack>
        }
    ];

    const handlePage = (e) => e.preventDefault() || reload();
    return (
        <>
            <PageHeader title="Order Materials" actions={<IconButton href={route("admin.materials")}>
                <Avatar src={Excel} variant="square"/>
            </IconButton>}/>
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
