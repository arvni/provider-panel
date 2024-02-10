import RoleForm from "@/Pages/Role/Components/Form";
import {useEffect, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = (props) => {
    const {data, setData, post, processing} = useForm({
        name: "",
       permissions:[]
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.roles.store'));
    const handleCancel = () => router.visit(route('admin.roles.index'));
    return <RoleForm data={data}
                     errors={errors}
                     setData={setData}
                     loading={processing}
                     submit={handleSubmit}
                     permissions={props.permissions}
                     cancel={handleCancel}/>;
}

const breadCrumbs = [
    {
        title: "Roles",
        link: "/admin/roles",
        icon: null
    },
    {
        title: "Add New Role",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
