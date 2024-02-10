import {Head,} from '@inertiajs/react';
import {Alert} from "@mui/material";

import GuestLayout from "@/Layouts/GuestLayout";
import LoginForm from "@/Components/LoginForm";


const Login = ({status}) => {
    return (
        <GuestLayout>
            <Head title="Login"/>
            {status && <Alert severity={"success"}>{status}</Alert>}
            <LoginForm />
        </GuestLayout>
    );
}
export default Login;
