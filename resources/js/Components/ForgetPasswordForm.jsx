import React, {useEffect} from "react";
import {Box, FormHelperText, Grid, TextField} from "@mui/material";

import {useSubmitForm} from "@/Services/api";
import {forgetPasswordValidator} from "@/Services/validate";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingButton from "@/Components/LoadingButton.jsx";

const ForgetPasswordForm = ({siteKey}) => {

    const {
        data,
        setData,
        processing,
        errors,
        setError,
        wasSuccessful,
        reset,
        clearErrors,
        submit
    } = useSubmitForm({
        email: '',
        captcha:""
    }, route("password.email"));
    const recaptchaRef = React.createRef();

    useEffect(() => {
        if (wasSuccessful)
            reset()
    }, [wasSuccessful]);



    const handleChange = (e) => formChange(e.target.name, e.target.value)
    const formChange = (key, value) => setData(previousData => ({
        ...previousData,
        [key]: value
    }));
    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        recaptchaRef.current?.reset();
        if (forgetPasswordValidator(data, setError))
            submit();
    }


    const handleCaptchaChanged = (token) => formChange("captcha", token ?? "");

    const resetCaptcha = () => formChange("captcha", "");

    return<Box component="form" onSubmit={handleSubmit} method="post" action={route("login")}>
        <Grid container direction="column" spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12} sx={{width: "100%"}}>
                <TextField
                    onChange={handleChange}
                    name="email"
                    value={data.email}
                    helperText={errors.email ?? ""}
                    error={errors.hasOwnProperty("email")}
                    type="email"
                    label="Email"
                    autoComplete="username"
                    required
                    inputProps={{inputMode: "email"}}
                    fullWidth
                />
            </Grid>
            {siteKey&&<Grid item xs={12} sx={{width: "100%"}}>
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={siteKey}
                    onChange={handleCaptchaChanged}
                    onExpired={resetCaptcha}/>
                {errors.captcha && <FormHelperText error={!!errors.captcha}>{errors.captcha}</FormHelperText>}
            </Grid>}
        <Grid item>
            <LoadingButton type="submit" loading={processing} variant="contained">Email Password Reset
                Link</LoadingButton>
        </Grid>
        </Grid>
    </Box>;
}

export default ForgetPasswordForm;
