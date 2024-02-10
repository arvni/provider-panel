import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {DialogActions, DialogContent, FormControlLabel, Switch, TextField} from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";

const AddForm = ({values, setValues, submit, open, setOpen, title, loading, reset}) => {
    const handleChange = (e) => setValues(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleClose = () => {
        setOpen(false);
        reset();
    }
    const handleSwitchChange=(e,v)=>setValues(e.target.name,v)
    return <Dialog open={open && !loading} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{p: "1em"}}>
            <Container>
                <Grid container sx={{marginTop: "1em"}}>
                    <Grid item xs={12} md={4}>
                        <TextField label="Title" name="name" onChange={handleChange} value={values.name}/>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControlLabel label="Orderable"
                                          control={<Switch/>}
                                          labelPlacement="start"
                                          name="orderable"
                                          onChange={handleSwitchChange}
                                          checked={values.orderable}/>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <FormControlLabel label="sample id required"
                                          control={<Switch/>}
                                          labelPlacement="start"
                                          name="sample_id_required"
                                          onChange={handleSwitchChange}
                                          checked={values.sample_id_required}/>
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
