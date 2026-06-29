import RoleForm from "@/Pages/Role/Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";

const Edit = (props) => {
    const { data, setData, post, processing } = useForm({ ...props.role, _method: "put" });
    const handleSubmit = () => post(route("admin.roles.update", props.role.id));
    const handleCancel = () => router.visit(route("admin.roles.index"));
    return (
        <RoleForm
            data={data}
            errors={props.errors}
            setData={setData}
            loading={processing}
            submit={handleSubmit}
            cancel={handleCancel}
            edit
            permissions={props.permissions}
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
        title: "Edit Role",
        link: null,
        icon: null,
    },
];
Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Edit;
