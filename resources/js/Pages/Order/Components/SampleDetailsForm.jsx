import {Alert, Box, Button, Grid, IconButton, Stack, TextField, Typography} from "@mui/material";
import * as React from "react";
import MenuItem from '@mui/material/MenuItem';
import {Delete} from "@mui/icons-material";


const SampleDetailsForm = ({
                               samples,
                               onChange,
                               onSubmit,
                               sampleTypes,
                               errors,
                               user,
                               setError,
                               clearErrors
                           }) => {
    const handleChange = (index) => (e) => {
        let newSamples = [...samples];
        if (newSamples[index]) {
            newSamples[index] = {
                ...samples[index],
                [e.target.name]: e.target.name === "sample_type" ? sampleTypes.find((sampleType) => sampleType.id == e.target.value) : e.target.value
            }
        } else
            newSamples[index] = {[e.target.name]: e.target.name === "sample_type" ? sampleTypes.find((sampleType) => sampleType.id == e.target.value) : e.target.value}
        onChange("samples", newSamples)
    }
    const addSample = () => {
        let newSamples = [...samples];
        newSamples.push({});
        onChange("samples", newSamples);
    }
    const deleteSample = (index) => () => {
        let newSamples = [...samples];
        newSamples.splice(index, 1);
        onChange("samples", newSamples);
    }
    const handleSubmit = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (Object.keys(errors).length < 1)
            onSubmit();
    }

    const checkSampleId = (id, index) => e => {
        clearErrors();
        if (e.target.required) {
            axios.get(route("api.check_materials")+"?" + new URLSearchParams({
                id,
                sampleId: e.target.value,
                user
            }).toString(),)
                .then((res) => console.log(res.data))
                .catch((e) => setError(`samples.${index}.sampleId`, e.response.data.message))
        }
    }
    return <Box component={"form"} onSubmit={handleSubmit}>
        <Grid container>
            <Grid item xs={12}>
                <Typography fontWeight={"900"} fontSize={"larger"} sx={{my: 4}}>Diagnostics Analysis</Typography>
                <Typography fontWeight={"900"} sx={{my: 1}}>Document material details</Typography>
                {errors.samples && <Alert severity="error">{errors.samples}</Alert>}
                {samples.map((sample, index) => <Box sx={{width: "100%", background: "#c0c0c0", padding: 2, mb: 2}}
                                                     key={index}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField select fullWidth onChange={handleChange(index)} name="sample_type"
                                       value={sample?.sample_type?.id}
                                       label="Sample Type" required>
                                {sampleTypes?.map(sampleType => <MenuItem value={sampleType.id} key={sampleType?.id}>
                                    {sampleType?.name}
                                </MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                onChange={handleChange(index)}
                                value={sample?.sampleId}
                                name="sampleId"
                                label="Sample ID"
                                onBlur={checkSampleId(sample.id, index)}
                                error={errors.hasOwnProperty("samples." + index + ".sampleId")}
                                helperText={errors.hasOwnProperty("samples." + index + ".sampleId") ? errors["samples." + index + ".sampleId"] : ""}
                                required={sample?.sample_type?.sampleIdRequired}/>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                onChange={handleChange(index)}
                                type="date"
                                name="collectionDate"
                                inputProps={{
                                    style: {
                                        textAlign: "right"
                                    }
                                }}
                                error={errors.hasOwnProperty("samples." + index + ".collectionDate")}
                                helperText={errors.hasOwnProperty("samples." + index + ".collectionDate") ? errors["samples." + index + ".collectionDate"] : ""}
                                value={sample?.collectionDate}
                                label={"Collection Date"}
                                required/>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <IconButton color="error" onClick={deleteSample(index)}>
                                <Delete/>
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>)}
            </Grid>
            <Grid item xs={12} mt={2}>
                <Stack alignItems="flex-end">
                    <Button variant="contained" onClick={addSample}>
                        Add Sample Material
                    </Button>
                </Stack>
            </Grid>
            <Grid item xs={12} mt={2}>
                <Stack alignItems="flex-end">
                    <Button variant="contained" type="submit">
                        Save & continue
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Box>
}
export default SampleDetailsForm;
