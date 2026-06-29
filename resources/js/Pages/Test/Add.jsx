import { router, useForm } from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";

const Add = (props) => {
    const { data, setData, post } = useForm({
        name: "",
        shortName: "",
        code: "",
        turnaroundTime: 1,
        gender: ["0", "1", "-1"],
        description: "",
        is_active: true,
        consent: null,
        order_form: null,
        sample_types: [],
    });
    const handleSubmit = () => post(route("admin.tests.store"));
    const handleCancel = () => router.visit(route("admin.tests.index"));
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
        title: "Tests",
        link: "/admin/tests",
        icon: null,
    },
    {
        title: "Add New Test",
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
