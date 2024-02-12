import React, {useEffect} from 'react';
import {Head} from '@inertiajs/react';
import {Box, FormHelperText, Grid, TextField} from "@mui/material";
import GuestLayout from "@/Layouts/GuestLayout";
import {useSubmitForm} from "@/Services/api";
import {resetPasswordValidator} from "@/Services/validate";
import PasswordField from "@/Components/PasswordField";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingButton from "@/Components/LoadingButton.jsx";

export default function ResetPassword({token, email,siteKey}) {
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
        handleChange
    } = useSubmitForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
        captcha: "",
        __method: "put"
    }, route("password.store"));

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation', 'captcha');
        };
    }, []);
    const recaptchaRef = React.createRef();
    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        recaptchaRef.current?.reset();
        if (resetPasswordValidator(data, setError)) {
            submit();
        }
    }
    const formChange = (key, value) => setData(previousData => ({
        ...previousData,
        [key]: value
    }));
    const handleCaptchaChanged = (token) => formChange("captcha", token ?? "");
    const resetCaptcha = () => formChange("captcha", "");

    return (
        <GuestLayout>
            <Head title="Reset Password"/>
            <Box component="form" onSubmit={handleSubmit} action={route("password.store")} method="post">
                <Grid container spacing={2}>
                    <Grid item xs={12} sx={{width: "100%"}}>
                        <TextField
                            disabled
                            name="email"
                            value={data.email}
                            helperText={errors.email ?? ""}
                            error={errors.hasOwnProperty("email")}
                            type="email"
                            label="Email"
                            autoComplete="username"
                            required
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} sx={{width: "100%"}}>
                        <PasswordField
                            name="password"
                            value={data.password}
                            helperText={errors.password ?? ""}
                            error={errors.hasOwnProperty("password")}
                            type="password"
                            label="Password"
                            autoComplete="new-password"
                            required
                            onChange={handleChange}
                            fullwidth
                        />
                    </Grid>

                    <Grid item xs={12} sx={{width: "100%"}}>
                        <PasswordField
                            name="password_confirmation"
                            value={data.password_confirmation}
                            helperText={errors.password_confirmation ?? ""}
                            error={errors.hasOwnProperty("password_confirmation")}
                            type="password"
                            label="Confirm Password"
                            autoComplete="new-password"
                            required
                            onChange={handleChange}
                            fullwidth
                        />
                    </Grid>

                    <Grid item xs={12} sx={{width: "100%"}}>
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={siteKey}
                            onChange={handleCaptchaChanged}
                            onExpired={resetCaptcha}/>
                        {errors.captcha && <FormHelperText error={!!errors.captcha}>{errors.captcha}</FormHelperText>}
                    </Grid>
                    <Grid item display={"flex"} flexDirection="row" justifyContent="center"
                          alignItems={"center"} sx={{width: "100%"}}>
                        <LoadingButton loading={processing} type="submit" variant="contained">Update</LoadingButton>
                    </Grid>
                </Grid>
            </Box>
        </GuestLayout>
    );
}
