import {useEffect, useState} from "react";
import {router, useForm} from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";

const Add = (props) => {
    const {data, setData, post, processing} = useForm({
        name:"",
        formData:[],
        file:null
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.orderForms.store'));
    const handleCancel = () => router.visit(route('admin.orderForms.index'));
    return <Form values={data}
                 errors={errors}
                 setValues={setData}
                 submit={handleSubmit}
                 cancel={handleCancel}/>;
}

const breadCrumbs = [
    {
        title: "Order Forms",
        link: "/admin/orderForms",
        icon: null
    },
    {
        title: "Add New Order Form",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
