import React, { useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import { Box, Grid, TextField } from "@mui/material";
import GuestLayout from "@/Layouts/GuestLayout";
import { useSubmitForm } from "@/Services/api";
import { resetPasswordValidator } from "@/Services/validate";
import PasswordField from "@/Components/PasswordField";
import TurnstileWidget from "@/Components/TurnstileWidget.jsx";
import LoadingButton from "@/Components/LoadingButton.jsx";

export default function ResetPassword({ token, email, siteKey }) {
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        reset,
        setError,
        clearErrors,
        handleChange,
    } = useSubmitForm(
        {
            token: token,
            email: email,
            password: "",
            password_confirmation: "",
            "cf-turnstile-response": "",
            __method: "put",
        },
        route("password.store")
    );

    useEffect(() => {
        return () => {
            reset("password", "password_confirmation", "cf-turnstile-response");
        };
    }, []);
    const resetTurnstileRef = useRef(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        if (resetPasswordValidator(data, setError)) {
            submit({
                onError: () => resetTurnstileRef.current?.(),
            });
        } else {
            resetTurnstileRef.current?.();
        }
    };
    const formChange = (key, value) =>
        setData((previousData) => ({
            ...previousData,
            [key]: value,
        }));

    return (
        <GuestLayout>
            <Head title="Reset Password" />
            <Box
                component="form"
                onSubmit={handleSubmit}
                action={route("password.store")}
                method="post"
            >
                <Grid container spacing={2}>
                    <Grid size={12} sx={{ width: "100%" }}>
                        <TextField
                            disabled
                            name="email"
                            value={data.email}
                            helperText={errors.email ?? ""}
                            error={Object.prototype.hasOwnProperty.call(errors, "email")}
                            type="email"
                            label="Email"
                            autoComplete="username"
                            required
                            fullWidth
                        />
                    </Grid>

                    <Grid size={12} sx={{ width: "100%" }}>
                        <PasswordField
                            name="password"
                            value={data.password}
                            helperText={errors.password ?? ""}
                            error={Object.prototype.hasOwnProperty.call(errors, "password")}
                            type="password"
                            label="Password"
                            autoComplete="new-password"
                            required
                            onChange={handleChange}
                            fullwidth
                        />
                    </Grid>

                    <Grid size={12} sx={{ width: "100%" }}>
                        <PasswordField
                            name="password_confirmation"
                            value={data.password_confirmation}
                            helperText={errors.password_confirmation ?? ""}
                            error={Object.prototype.hasOwnProperty.call(
                                errors,
                                "password_confirmation"
                            )}
                            type="password"
                            label="Confirm Password"
                            autoComplete="new-password"
                            required
                            onChange={handleChange}
                            fullwidth
                        />
                    </Grid>

                    {siteKey && (
                        <Grid size={12} sx={{ width: "100%" }}>
                            <TurnstileWidget
                                siteKey={siteKey}
                                error={errors["cf-turnstile-response"]}
                                onToken={(token) => formChange("cf-turnstile-response", token)}
                                widgetRef={resetTurnstileRef}
                            />
                        </Grid>
                    )}
                    <Grid
                        display={"flex"}
                        flexDirection="row"
                        justifyContent="center"
                        alignItems={"center"}
                        sx={{ width: "100%" }}
                    >
                        <LoadingButton loading={processing} type="submit" variant="contained">
                            Update
                        </LoadingButton>
                    </Grid>
                </Grid>
            </Box>
        </GuestLayout>
    );
}
