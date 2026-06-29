import Form from "./Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";

const Add = (props) => {
    const { data, setData, post } = useForm({ ...props.orderForm, _method: "put" });
    const handleSubmit = () => post(route("admin.orderForms.update", props.orderForm.id));
    const handleCancel = () => router.visit(route("admin.orderForms.index"));
    return (
        <Form
            values={data}
            errors={props.errors}
            setValues={setData}
            submit={handleSubmit}
            cancel={handleCancel}
        />
    );
};

const breadCrumbs = [
    {
        title: "Order Forms",
        link: "/admin/orderForms",
        icon: null,
    },
    {
        title: "Edit Order Form",
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
