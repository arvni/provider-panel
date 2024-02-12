import GuestLayout from '@/Layouts/GuestLayout';
import {Head} from '@inertiajs/react';
import {Alert} from "@mui/material";
import ForgetPasswordForm from "@/Components/ForgetPasswordForm";

export default function ForgotPassword({status, siteKey}) {
    return (
        <GuestLayout>
            <Head title="Forgot Password"/>
            {status && <Alert severity={"success"}>{status}</Alert>}
            <ForgetPasswordForm siteKey={siteKey}/>
        </GuestLayout>
    );
}
