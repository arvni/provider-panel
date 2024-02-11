import React, { useEffect} from "react";
import {Link} from "@inertiajs/react";
import {
    Box,
    Checkbox,
    FormControlLabel,
    FormHelperText,
    Grid,
    Stack,
    TextField,
} from "@mui/material";
import {loginFormValidator} from "@/Services/validate";
import {useSubmitForm} from "@/Services/api";
import PasswordField from "@/Components/PasswordField";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingButton from "@/Components/LoadingButton.jsx";

const siteKey=import.meta.env.VITE_GOOGLE_CAPTCHA_SITE_KEY;
const LoginForm = () => {
    console.log(siteKey);
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        clearErrors,
        reset
    } = useSubmitForm({
        email: "",
        password: "",
        remember: false,
        captcha: ""
    }, route("login"));

    useEffect(() => {
        return () => {
            reset("password", "captcha");
        };
    }, [processing]);

    const recaptchaRef = React.createRef();

    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        recaptchaRef.current?.reset();
        if (loginFormValidator(data, setError)) {
            submit();
        }
    }

    const handleChange = (e) => formChange(e.target.name, e.target.value)
    const formChange = (key, value) => setData(previousData => ({
        ...previousData,
        [key]: value
    }));

    const handleCaptchaChanged = (token) => formChange("captcha", token ?? "");

    const resetCaptcha = () => formChange("captcha", "");
    const handleRememberChange = (e, value) => formChange("remember", value);

    return <Box component="form" onSubmit={handleSubmit} method="post" action={route("login")}>
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

            <Grid item xs={12} sx={{width: "100%"}}>
                <PasswordField
                    name="password"
                    value={data.password}
                    helperText={errors.password ?? ""}
                    error={errors.hasOwnProperty("password")}
                    type="password"
                    label="Password"
                    autoComplete="password"
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
            <Grid item xs={12} sx={{width: "100%"}}>
                <FormControlLabel
                    onChange={handleRememberChange}
                    control={<Checkbox defaultChecked={data.remember} name="remember"/>}
                    label="Remember Password"/>
            </Grid>

            <Grid item sx={{width: "100%"}} >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{width: "100%"}}>
                    <Link href={route("password.request")}
                          style={{
                              textDecoration: "none",
                              fontFamily: '"Roboto","Helvetica","Arial",sans-serif'
                          }}>Forget Password?</Link>
                    <LoadingButton loading={processing} type="submit" variant="contained">Login</LoadingButton>
                </Stack>
            </Grid>
        </Grid>
    </Box>
}

export default LoginForm;
