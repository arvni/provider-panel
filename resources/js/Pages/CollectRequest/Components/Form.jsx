import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {
    DialogActions,
    DialogContent,
    TextField
} from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";

const collectRequestStatuses=[
    {
        label:"Requested",
        value:"requested",
    },
    {
        label:"Scheduled",
        value:"scheduled",
    },
    {
        label:"Picked up",
        value:"picked up",
    },
    {
        label:"Received",
        value:"received",
    },
];
const Form = ({values, setValues, cancel, submit, errors, open, defaultValue}) => {
    const handleChange = (e) => setValues(prevValues => ({...prevValues, [e.target.name]: e.target.value}));

    return (
        <Dialog open={open} onClose={cancel}>
            <DialogTitle>
                Edit Logistic Request Details
            </DialogTitle>
            <DialogContent>
                <Container>
                    <Grid container spacing={2} mt={2}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="status"
                                value={values.status}
                                name="status"
                                onChange={handleChange} >
                                {collectRequestStatuses.map((option,index) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        {values.status==="picked up"?<Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('pickupDate')}
                                       helperText={errors?.pickupDate ?? ""}
                                       fullWidth
                                       type="date"
                                       label="Pickup Date"
                                       name="pickupDate"
                                       value={values.pickupDate}
                                       onChange={handleChange}/>
                        </Grid>:null}
                        {values.status==="scheduled"?<Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('scheduleDate')}
                                       helperText={errors?.scheduleDate ?? ""}
                                       fullWidth
                                       type="date"
                                       label="Schedule Date"
                                       name="scheduleDate"
                                       value={values.scheduleDate}
                                       onChange={handleChange}/>
                        </Grid>:null}
                        {values.status!=="received"?<Grid item xs={12}>
                            <TextField error={Object.keys(errors).includes('more')}
                                       helperText={errors?.more ?? ""}
                                       fullWidth
                                       multiline
                                       rows={4}
                                       label="Logistic Information"
                                       name="more"
                                       value={values.more}
                                       onChange={handleChange}/>
                        </Grid>:null}
                    </Grid>

                </Container>
            </DialogContent>
            <DialogActions>
                <Button onClick={cancel}>Cancel</Button>
                <Button variant="contained"
                        onClick={submit}
                        disabled={defaultValue.status==="received"} >Submit</Button>
            </DialogActions>
        </Dialog>
    );
}
export default Form;
