import {
    Button,
    Dialog, DialogActions,
    DialogContent,
    DialogTitle, FormControlLabel,
    Grid, Switch, TextField
} from "@mui/material";
import React, {useState} from "react";
import {Save} from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch";

const AddSampleTypeForm = ({data, setData, open, onClose, onSubmit}) => {
    const [errors, setErrors] = useState();
    const handleChange = (e) => setData(e.target.name, e.target.value)
    const handleSwitchChanged = (e, v) => setData(e.target.name, v);
    const handleSubmit = () => check() ? onSubmit() : console.log(errors);
    const check = () => {
        clearErrors();
        let output = true;
        if (!data?.sample_type?.id) {
            output = false;
            addErrors("sample_type", "please choose a sample type");
        }
        if (!data.description) {
            output = false;
            addErrors("description", "please enter description")
        }
        return output;
    }
    const clearErrors = () => setErrors(undefined);

    const addErrors = (key, error) => setErrors((prevState) => ({...(prevState ?? null), [key]: error}));

    return <Dialog open={open} onClose={onClose} fullWidth maxWidth={"md"}>
        <DialogTitle>{`${data.id ? "Edit" : "Add New"} Method`}</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} padding={2}>
                <Grid item xs={12} md={4}>
                    <SelectSearch name="sample_type"
                                  value={data.sample_type}
                                  url={route("api.sampleTypes.list")}
                                  label="Sample Type"
                                  onchange={handleChange}
                                  helperText={errors?.sample_type}
                                  error={!!errors?.sample_type}
                                  required/>
                </Grid>

                <Grid item xs={12} sm={6} md={2} sx={{display: "flex"}}>
                    <FormControlLabel control={<Switch/>}
                                      labelPlacement="start"
                                      label={"Default"}
                                      name={"is_default"}
                                      checked={data.is_default}
                                      onChange={handleSwitchChanged}/>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        name="description"
                        value={data.description}
                        onChange={handleChange}
                        label="Description"/>
                </Grid>
            </Grid>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button startIcon={<Save/>} onClick={handleSubmit} variant="contained">Save</Button>
            </DialogActions>
        </DialogContent>
    </Dialog>;
}
export default AddSampleTypeForm;
