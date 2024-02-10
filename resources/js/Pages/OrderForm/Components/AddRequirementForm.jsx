import React, {useState} from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, FormControlLabel,
    Grid,
    MenuItem, Switch,
    TextField
} from "@mui/material";

import {Save} from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";


const AddRequirementForm = ({data, setData, open, onClose, onSubmit}) => {
    const [errors, setErrors] = useState();
    const handleSubmit = () => {
        if (check()) {
            onSubmit();
        }
    }
    const check = () => {
        clearErrors();
        let output = true;
        if (!data.id) {
            output = false;
            addErrors("id", "please enter method name");
        }
        if (!data.type) {
            output = false;
            addErrors("type", "please add at least one")
        }
        return output;
    }
    const clearErrors = () => {
        setErrors(undefined);
    }
    const handleChange = (e) => {
        setData(e.target.name, e.target.value);
        if (e.target.name !== "select")
            setData("options", []);
    }
    const handleOptionChangedChange = (_, v) => setData("options", v);
    const handleRequiredChanged = (_, v) => setData("required", v);

    const addErrors = (key, er) => {
        let newErrors = {...errors, [key]: er};
        setErrors(newErrors);
    }

    return <Dialog open={open} onClose={onClose} fullWidth maxWidth={"md"}>
        <DialogTitle>{`${data.id ? "Edit" : "Add New"} Requirement`}</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} padding={2}>
                <Grid item xs={12} md={4}>
                    <TextField
                        name="label"
                        value={data.label}
                        helperText={errors?.label ?? ""}
                        onChange={handleChange}
                        label="Label"/>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        select
                        name="type"
                        value={data.type}
                        onChange={handleChange}
                        helperText={errors?.type}
                        label="Type">
                        <MenuItem value={"description"}>Title</MenuItem>
                        <MenuItem value={"text"}>Text</MenuItem>
                        <MenuItem value={"date"}>Date</MenuItem>
                        <MenuItem value={"number"}>Number</MenuItem>
                        <MenuItem value={"checkbox"}>Checkbox</MenuItem>
                        <MenuItem value={"select"}>combobox</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                    <FormControlLabel control={<Switch/>}
                                      label="Required"
                                      checked={data.required}
                                      onChange={handleRequiredChanged}
                                      labelPlacement="start"/>
                </Grid>
                {data.type == "select" && <Grid item xs={12}>
                    <Autocomplete
                        multiple
                        name="options"
                        value={data.options}
                        onChange={handleOptionChangedChange}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        options={[]}
                        freeSolo
                        renderInput={(params) => (
                            <TextField {...params}
                                       label="Options"
                                       fullWidth
                                       helperText={errors?.options}/>
                        )}/>
                </Grid>}
            </Grid>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button startIcon={<Save/>} onClick={handleSubmit} variant={"contained"}>Save</Button>
            </DialogActions>
        </DialogContent>
    </Dialog>;
}
export default AddRequirementForm;
