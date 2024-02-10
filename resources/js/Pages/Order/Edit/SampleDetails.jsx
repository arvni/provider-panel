import React from "react";
import {useSubmitForm} from "@/services/api";
import routes from "@/routes";
import EditLayout from "@/Pages/Order/EditLayout";
import SampleDetailsForm from "@/Pages/Order/Components/SampleDetailsForm";

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
                           sampleTypes={sampleTypes} errors={errors}/>
    </EditLayout>);

}
export default SampleDetails;
