import {Box, Grid, IconButton, TextField} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import {Delete} from "@mui/icons-material";
import * as React from "react";

const SampleRow = () => {

    return <Box sx={{width: "100%", background: "#c0c0c0", padding: 2, mb: 2}}
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
                    onBlur={checkSampleId(sample.id)}
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
    </Box>
}
