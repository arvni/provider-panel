import React from "react";
import {useSubmitForm} from "@/services/api";
import PatientDetailsForm from "@/Pages/Order/Components/PatientDetailsForm";
import EditLayout from "@/Pages/Order/EditLayout";
import {patientDetailsValidate} from "@/services/validate";

const PatientDetails = ({auth, order,step}) => {
    const {
        data,
        setData,
        submit,
        errors,
        setError,
        clearErrors,
    } = useSubmitForm({...order.patient,_method:"put"}, route("orders.update", {order:order.id, step}));
    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}))
    };
    const handleSubmit = () => {
        clearErrors();
        if (patientDetailsValidate(data,setError))
        submit();
    };

    return (
       <EditLayout step={step} auth={auth} id={order.id} >
           <PatientDetailsForm patient={data} onChange={handleChange} onSubmit={handleSubmit} errors={errors}/>
       </EditLayout>

    );
}
export default PatientDetails;
