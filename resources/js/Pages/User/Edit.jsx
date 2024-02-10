import UserForm from "@/Pages/User/Components/Form";
import {useEffect, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router, useForm} from "@inertiajs/react";

const Add = (props) => {
    const {data, setData, post, processing} = useForm({...props.user, _method: "put"});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.users.update', props.user.id));
    const handleCancel = () => router.visit(route('admin.users.index'));
    return <UserForm values={data}
                     errors={errors}
                     setValues={setData}
                     loading={processing}
                     submit={handleSubmit}
                     cancel={handleCancel}
                     edit/>;
}

const breadCrumbs = [
    {
        title: "Users",
        link: "/admin/users",
        icon: null
    },
    {
        title: "Edit User",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
