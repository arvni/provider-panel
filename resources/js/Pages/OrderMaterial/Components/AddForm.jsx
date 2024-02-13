import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {DialogActions, DialogContent, TextField} from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import MenuItem from "@mui/material/MenuItem";
import * as React from "react";

const AddForm = ({values, setValues, submit, open, setOpen, title, loading, reset, sampleTypes}) => {
    const handleChange = (e) => setValues(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleClose = () => {
        setOpen(false);
        reset();
    }
    return <Dialog open={open && !loading} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{p: "1em"}}>
            <Container>
                <Grid container sx={{marginTop: "1em"}} spacing={2}>
                    <Grid item xs={12}>
                        <TextField select fullWidth onChange={handleChange} name="sample_type"
                                   value={values?.sample_type}
                                   label="Sample Type" required>
                            {sampleTypes?.map(sampleType => <MenuItem value={sampleType.id} key={sampleType?.id}>
                                {sampleType?.name}
                            </MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField label="Qty"
                                   type="number"
                                   fullWidth
                                   inputProps={{min:0,max:100}}
                                   name="amount"
                                   onChange={handleChange}
                                   value={values.amount}/>
                    </Grid>
                </Grid>
            </Container>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={submit} variant={"contained"}>Submit</Button>
        </DialogActions>

    </Dialog>
}

export default AddForm;
