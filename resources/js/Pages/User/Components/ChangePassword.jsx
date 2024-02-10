import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {Dialog, DialogActions, DialogContent, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import {checkPassword} from "@/Services/validate.js";

const ChangePassword = ({open, onClose, data,setData,onSubmit,errors,setError, currentNeeded = true}) => {

    const submit = () => {
        if (checkPassword(data,currentNeeded,setError))
            onSubmit();
    }
    const handleChange = (e) => setData(prevValues => ({...prevValues, [e.target.name]: e.target.value}));
    return (
        <Dialog open={open}
                onClose={onClose}>
            <DialogTitle>
                Change Password
            </DialogTitle>
            <DialogContent>
                <Container>
                    <Grid container
                          spacing={2}
                          sx={{pt: "1em"}}>
                        {currentNeeded ? <Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('current')}
                                       helperText={errors?.current ?? ""}
                                       label={"Current Password"}
                                       name={"current"}
                                       type={"password"}
                                       onChange={handleChange}
                                       sx={{width: "100%"}}/>
                        </Grid> : null}
                        <Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('password')}
                                       helperText={errors?.password ?? ""}
                                       label="New Password"
                                       name="password"
                                       type="password"
                                       onChange={handleChange}
                                       sx={{width: "100%"}}/>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('password_confirmation')}
                                       helperText={errors?.password_confirmation ?? ""}
                                       label="Confirm Password"
                                       name="password_confirmation"
                                       type="password"
                                       onChange={handleChange}
                                       sx={{width: "100%"}}/>
                        </Grid>
                    </Grid>
                </Container>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained"
                        onClick={submit}>Submit</Button>
            </DialogActions>
        </Dialog>
    );
}
export default ChangePassword;
