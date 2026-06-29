import RoleForm from "@/Pages/Role/Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";

const Add = (props) => {
    const { data, setData, post, processing } = useForm({
        name: "",
        permissions: [],
    });
    const handleSubmit = () => post(route("admin.roles.store"));
    const handleCancel = () => router.visit(route("admin.roles.index"));
    return (
        <RoleForm
            data={data}
            errors={props.errors}
            setData={setData}
            loading={processing}
            submit={handleSubmit}
            permissions={props.permissions}
            cancel={handleCancel}
        />
    );
};

const breadCrumbs = [
    {
        title: "Roles",
        link: "/admin/roles",
        icon: null,
    },
    {
        title: "Add New Role",
        link: null,
        icon: null,
    },
];
Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Add;
