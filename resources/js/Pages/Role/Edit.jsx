import RoleForm from "@/Pages/Role/Components/Form";
import {useEffect, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Edit = (props) => {
    const {data, setData, post, processing} = useForm({...props.role, _method: "put"});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.roles.update', props.role.id));
    const handleCancel = () => router.visit(route('admin.roles.index'));
    return <RoleForm data={data}
                     errors={errors}
                     setData={setData}
                     loading={processing}
                     submit={handleSubmit}
                     cancel={handleCancel}
                     edit
                     permissions={props.permissions} />;
}

const breadCrumbs = [
    {
        title: "Roles",
        link: "/admin/roles",
        icon: null
    },
    {
        title: "Edit Role",
        link: null,
        icon: null
    }
]
Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Edit;
