import React from "react";
import {useSubmitForm} from "@/Services/api";
import EditLayout from "../EditLayout";
import SampleDetailsForm from "../Components/SampleDetailsForm";

const SampleDetails = ({auth, order, step, sampleTypes}) => {
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        reset,
        clearErrors,
    } = useSubmitForm({
        ...order,
        samples: order.samples.length ? order.samples : [{}],
        _method: "put"
    }, route("orders.update",{order: order.id, step}));

    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}))
    };
    const handleSubmit = () => submit();


    return (<EditLayout step={step} auth={auth} id={order.id}>
        <SampleDetailsForm samples={data.samples ?? [{}]} onChange={handleChange} onSubmit={handleSubmit}
                           sampleTypes={sampleTypes} errors={errors} user={auth.user.id} setError={setError} clearErrors={clearErrors}/>
    </EditLayout>);

}
export default SampleDetails;
