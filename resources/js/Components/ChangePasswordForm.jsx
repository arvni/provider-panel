import {useEffect} from "react";
import {Box, Button, Dialog, DialogContent, DialogTitle, Grid} from "@mui/material";
import {useSubmitForm} from "@/Services/api";
import {changePasswordValidator} from "@/Services/validate";
import PasswordField from "@/Components/PasswordField";
import LoadingButton from "@/Components/LoadingButton.jsx";


const ChangePasswordForm = ({
                                open,
                                onClose,
                                user = undefined,
                            } )=> {
    const {
        data,
        reset,
        submit,
        processing,
        clearErrors,
        setError,
        errors,
        handleChange
    } = useSubmitForm(
        {
            current_password: "",
            password: "",
            password_confirmation: "",
            _method: "put"
        },
        user?.id ? route("admin.users.updatePassword",user.id) : route("password.update")
    );
    useEffect(() => {
        reset();
    }, []);
    const handleSubmit = (e) => {
        e.preventDefault();
        clearErrors();
        if (changePasswordValidator(data, setError, user))
            submit({onSuccess: () => onClose()});
    }

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                Change <strong>{user?.name}</strong> Password
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} method="post" action={ route("password.update")}
                     sx={{pt: "1em"}}>
                    <Grid container direction="column" spacing={2} alignItems="center" justifyContent="center">
                        {!user && <Grid item sx={{width: "100%"}}>
                            <PasswordField
                                fullwidth
                                name="current_password"
                                label="Current Password"
                                value={data.current_password}
                                error={errors.hasOwnProperty("current_password")}
                                helperText={errors.current_password}
                                autoComplete="current"
                                onChange={handleChange}
                            />
                        </Grid>}
                        <Grid item sx={{width: "100%"}}>
                            <PasswordField
                                name="password"
                                label="New Password"
                                value={data.password}
                                error={errors.hasOwnProperty("password")}
                                helperText={errors.password}
                                autoComplete="password"
                                fullwidth
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item sx={{width: "100%"}}>
                            <PasswordField
                                name="password_confirmation"
                                label="Password Confirmation"
                                type="password"
                                value={data.password_confirmation}
                                error={errors.hasOwnProperty("password_confirmation")}
                                helperText={errors.password_confirmation}
                                autoComplete="password_confirmation"
                                fullwidth
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item
                              sx={{
                                  justifyContent: "space-between",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center"
                              }}>
                            <Button onClick={onClose}>Cancel</Button>
                            <LoadingButton
                                loading={processing}
                                variant="contained"
                                type="submit"
                            >Submit</LoadingButton>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default ChangePasswordForm;
