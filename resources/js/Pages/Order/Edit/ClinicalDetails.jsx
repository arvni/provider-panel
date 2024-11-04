import React from "react";
import {useSubmitForm} from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import ClinicalDetailsForm from "../Components/ClinicalDetailsForm";


const ClinicalDetails = ({auth, order, step, forms = []}) => {
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

    const handleFileChange = (name, files) => {
        setData(name, files);
    };

    return (
        <EditLayout auth={auth} step={step} id={order.id}>
            <ClinicalDetailsForm orderForms={data.orderForms} files={data.files} onChange={handleChange}
                                 onSubmit={handleSubmit} id={order.id ?? ""} errors={errors} onFileChanged={handleFileChange}/>
        </EditLayout>
    );
}
export default ClinicalDetails;
