import {Paper, Step, StepButton, StepLabel, Stepper} from "@mui/material";
import React from "react";
import {router} from "@inertiajs/react";
import ClientLayout from "@/Layouts/AuthenticatedLayout";

const steps = ["test method", "patient details", "clinical details", "sample details", "consent form","finalize"];

const breadcrumbs = [
    {
        title: "Orders",
        link: route("orders.index"),
        icon: null
    },
];
const EditLayout = ({auth, step, children,id}) => {
    let activeStep = steps.findIndex((item) => item == step);
    const handleStep=(s)=>(e)=> {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route("orders.edit", {step: s, order: id}))
    }
    return <ClientLayout auth={auth}
                         breadcrumbs={[
                             ...breadcrumbs,
                             {
                                 title: " Order #"+id,
                                 link: "",
                                 icon: null
                             },
                             {
                                 title: `${step}`,
                                 link: "",
                                 icon: null
                             },
                         ]}>
        <Paper sx={{p: "1em", mt: "1em"}}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((item, index) => (
                    <Step key={index}>
                        <StepButton color="inherit" onClick={handleStep(item)} href={route("orders.edit",{step:item,order:id})}>
                            <StepLabel>{item}</StepLabel>
                        </StepButton>
                    </Step>
                ))}
            </Stepper>
            {children}
        </Paper>
    </ClientLayout>
}
export default EditLayout;
