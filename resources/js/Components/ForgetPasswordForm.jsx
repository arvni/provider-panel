import React, {useEffect, useRef} from "react";
import {Box, Grid, TextField} from "@mui/material";

import {useSubmitForm} from "@/Services/api";
import {forgetPasswordValidator} from "@/Services/validate";
import TurnstileWidget from "@/Components/TurnstileWidget.jsx";
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
        "cf-turnstile-response": ""
    }, route("password.email"));
    const resetTurnstileRef = useRef(null);

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
        if (forgetPasswordValidator(data, setError))
            submit({
                onError: () => resetTurnstileRef.current?.()
            });
        else
            resetTurnstileRef.current?.();
    }

    return<Box component="form" onSubmit={handleSubmit} method="post" action={route("password.email")}>
        <Grid container direction="column" spacing={2} alignItems="center" justifyContent="center">
            <Grid size={12} sx={{width: "100%"}}>
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
            {siteKey&&<Grid size={12} sx={{width: "100%"}}>
                <TurnstileWidget
                    siteKey={siteKey}
                    error={errors["cf-turnstile-response"]}
                    onToken={(token) => formChange("cf-turnstile-response", token)}
                    widgetRef={resetTurnstileRef}
                />
            </Grid>}
        <Grid>
            <LoadingButton type="submit" loading={processing} variant="contained">Email Password Reset
                Link</LoadingButton>
        </Grid>
        </Grid>
    </Box>;
}

export default ForgetPasswordForm;
