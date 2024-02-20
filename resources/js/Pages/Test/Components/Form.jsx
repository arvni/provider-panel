import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {FormControlLabel, TextField, Switch} from "@mui/material";
import Button from "@mui/material/Button";
import SelectSearch from "@/Components/SelectSearch";
import SampleTypeForm from "./SampleTypeForm";

const Form = ({values, setValues, cancel, submit, errors}) => {
    const handleChange = (e) => setValues(e.target.name, e.target.value);
    const handleSwitchChanged = (e, v) => setValues(e.target.name, v);

    return (
        <Container>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField error={Object.keys(errors).includes('name')}
                               helperText={errors?.name ?? ""}
                               fullWidth
                               label="Name"
                               name="name"
                               required
                               defaultValue={values.name}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField error={Object.keys(errors).includes('code')}
                               helperText={errors?.code ?? ""}
                               fullWidth
                               label="Code"
                               name="code"
                               defaultValue={values.code}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField error={Object.keys(errors).includes('shortName')}
                               helperText={errors?.shortName ?? ""}
                               fullWidth
                               label="Short Name"
                               required
                               name="shortName"
                               defaultValue={values.shortName}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={2} sx={{display: "flex"}}>
                    <FormControlLabel control={<Switch/>}
                                      required
                                      labelPlacement="start"
                                      label={"Active"}
                                      name={"is_active"}
                                      checked={values.is_active}
                                      onChange={handleSwitchChanged}/>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField error={Object.keys(errors).includes('turnaroundTime')}
                               helperText={errors?.turnaroundTime ?? ""}
                               fullWidth
                               required
                               type="number"
                               inputProps={{min: 1}}
                               inputMode="numeric"
                               label="Turnaround Time"
                               name="turnaroundTime"
                               defaultValue={values.turnaroundTime}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SelectSearch name="consent"
                                  label="Consent"
                                  required
                                  value={values.consent}
                                  error={Object.keys(errors).includes('consent')}
                                  helperText={errors.consent}
                                  url={route("api.consents.list")}
                                  onchange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SelectSearch name="order_form"
                                  label="Order Form"
                                  required
                                  value={values.order_form}
                                  error={Object.keys(errors).includes("order_form")}
                                  helperText={errors.order_form}
                                  url={route("api.orderForms.list")}
                                  onchange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SelectSearch name="instruction"
                                  label="Instruction"
                                  required
                                  value={values.instruction}
                                  error={Object.keys(errors).includes('instruction')}
                                  helperText={errors.instruction}
                                  url={route("api.instructions.list")}
                                  onchange={handleChange}/>
                </Grid>
                <Grid item xs={12}>
                    <SampleTypeForm sampleTypes={values.sample_types} error={errors.sample_types} onChange={setValues}/>
                </Grid>
                <Grid item xs={12}>
                    <TextField multiline rows={5} error={Object.keys(errors).includes('description')}
                               helperText={errors?.description ?? ""}
                               fullWidth
                               label="Description"
                               name="description"
                               defaultValue={values.description}
                               onChange={handleChange}/>
                </Grid>
            </Grid>
            <Grid container spacing={2} flex justifyContent={"flex-end"} justifyItems={"flex-end"}>
                <Grid item>
                    <Button onClick={cancel}>Cancel</Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={submit}>Submit</Button>
                </Grid>
            </Grid>
        </Container>
    );
}
export default Form;
