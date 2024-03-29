import React from "react";
import TestMethodForm from "../Components/TestMethodForm";
import {useSubmitForm} from "@/Services/api";
import EditLayout from "../EditLayout";

const TestMethod = ({auth, order, step}) => {
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        reset,
        clearErrors,
    } = useSubmitForm({...order, _method: "put"}, route("orders.update", {order: order.id, step}));

    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}))
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        submit();
    }

    return (
        <EditLayout step={step} auth={auth} id={order.id}>
            <TestMethodForm tests={data.tests} onChange={handleChange} onSubmit={handleSubmit}/>
        </EditLayout>
    );
}
export default TestMethod;
