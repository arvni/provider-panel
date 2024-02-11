import React from "react";
import {Alert, Paper} from "@mui/material";
import TestMethodForm from "./Components/TestMethodForm";
import {useSubmitForm} from "@/Services/api";
import {testMethodValidate} from "@/services/validate";
import ClientLayout from "@/Layouts/AuthenticatedLayout";

const Add = ({auth, ...rest}) => {
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors
    } = useSubmitForm({
        patient: undefined,
        status: undefined,
        step: undefined,
        tests: [],
        files: [],
        orderForms: [],
        samples: [{}]
    }, route("orders.store"));

    const handleChange = (key, value) => setData(key, value);

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearErrors();
        if (testMethodValidate(data, setError))
            submit()
    }

    return (
        <ClientLayout auth={auth} breadcrumbs={[]}>
            <Paper sx={{p: "1em", mt: "1em"}}>
                {errors.tests && <Alert severity="error">{errors.test_method}</Alert>}
                <TestMethodForm tests={data.tests} onChange={handleChange} onSubmit={handleSubmit}/>
            </Paper>
        </ClientLayout>
    );
}
export default Add;
