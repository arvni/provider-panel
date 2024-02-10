import {useEffect, useState} from "react";
import {router, useForm} from "@inertiajs/react";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Form from "./Components/Form";

const Edit = (props) => {
    const {data, setData, post} = useForm({...props.test, _method: "put"});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (Object.keys(props.errors).length)
            setErrors(props.errors);
    }, [props.errors]);
    const handleSubmit = () => post(route('admin.tests.update', props.test.id));
    const handleCancel = () => router.visit(route('admin.tests.index'));
    return  <Form values={data}
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
        title: "Edit Test",
        link: null,
        icon: null
    }
]
Edit.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>

export default Edit;
