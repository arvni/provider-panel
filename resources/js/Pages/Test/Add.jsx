import {useEffect, useState} from "react";
import {router, useForm} from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";

const Add = (props) => {
    const {data, setData, post, processing} = useForm({
        name: "",
        shortName: "",
        code: "",
        turnaroundTime: 1,
        gender:["0","1","-1"],
        description: "",
        is_active:true,
        consent: null,
        order_form: null,
        sample_types: [],
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.tests.store'));
    const handleCancel = () => router.visit(route('admin.tests.index'));
    return <Form values={data}
                 errors={errors}
                 setValues={setData}
                 submit={handleSubmit}
                 cancel={handleCancel}/>;
}

const breadCrumbs = [
    {
        title: "Tests",
        link: "/admin/tests",
        icon: null
    },
    {
        title: "Add New Test",
        link: null,
        icon: null
    }
]
Add.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Add;
