import React from "react";
import {useSubmitForm} from "@/Services/api";
import PatientDetailsForm from "../Components/PatientDetailsForm";
import EditLayout from "../EditLayout";
import {patientDetailsValidate} from "@/Services/validate";

const PatientDetails = ({auth, order,step,genders}) => {
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
           <PatientDetailsForm patient={data} genders={genders} onChange={handleChange} onSubmit={handleSubmit} errors={errors}/>
       </EditLayout>

    );
}
export default PatientDetails;
