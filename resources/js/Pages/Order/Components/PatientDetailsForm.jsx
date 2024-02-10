import {
    Autocomplete,
    Box,
    Button,
    FormControl, FormHelperText,
    Grid, InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import React from "react";
import countries from "@/Data/countries";
import CountrySelector from "@/Components/CountrySelector";



const PatientDetailsForm = (props) => {
    const handleChange = (e) => {

        props.onChange(e.target.name, e.target.value);
    }
    const handleContactChange = (e) => {
        let contact = {...props.patient?.contact, [e.target.name]: e.target.value};
        props.onChange("contact", contact);
    }
    const handleSubmit = () => {
        props.onSubmit();
    }

    const handleNationalityChange = (e, value) => {
        props.onChange("nationality", value);
    }
    const handleContactCountryChange = (e, value) => {
        let contact = {
            ...props.patient?.contact,
            country: value,
            phone: props.patient?.contact?.phone ?? ("+" + value?.phone)
        };
        props.onChange("contact", contact);
    }
    const handlePhoneCountryCodeChange = (phone) => props.onChange("contact", {
        ...props.patient,
        contact: {...props.patient?.contact, phone: "+" + phone}
    });

    return <>

        <Grid container spacing={2} mt={2}>
            <Grid item xs={8}>
                <Typography component={"h2"} fontWeight={"bolder"}>Patient Information</Typography>
                <Grid container spacing={1.5} mt={2}>
                    <Grid item xs={6}>
                        <TextField fullWidth label={"Reference ID"} value={props.patient?.reference_id ?? ""}
                                   name={"reference_id"} onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel id="consanguineousParents-label">Are Parents Consanguineous ?</InputLabel>
                            <Select
                                labelId="consanguineousParents-label"
                                id="consanguineousParents-select"
                                value={props.patient?.consanguineousParents ?? null}
                                name={"consanguineousParents"}
                                label="Are Parents Consanguineous ?"
                                error={!!props.errors["consanguineousParents"]}
                                onChange={handleChange}
                            >
                                <MenuItem value={1}>Yes</MenuItem>
                                <MenuItem value={0}>No</MenuItem>
                            </Select>
                            {props.errors["consanguineousParents"] &&
                                <FormHelperText>{props.errors["consanguineousParents"]}</FormHelperText>}
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth
                                   error={!!props.errors["fullName"]}
                                   helperText={props.errors["fullName"]}
                                   label={"Patient Full Name"}
                                   value={props.patient?.fullName ?? ""}
                                   name={"fullName"}
                                   onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel error={!!props.errors["gender"]} id="gender-label">Gender</InputLabel>
                            <Select
                                labelId="gender-label"
                                id="gender-select"
                                value={props.patient?.gender ?? null}
                                error={!!props.errors["gender"]}
                                label="Gender"
                                name={"gender"}
                                onChange={handleChange}
                            >
                                <MenuItem value={1}>Male</MenuItem>
                                <MenuItem value={0}>Female</MenuItem>
                                <MenuItem value={-1}>Unknown</MenuItem>
                            </Select>
                            <FormHelperText
                                error={!!props.errors["gender"]}>{props.errors["gender"]}</FormHelperText>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth
                                   inputProps={{sx: {textAlign: "right", gap: ".5em", alignItems: "center"}}}
                                   placeholder={""}
                                   label={"Date Of Birth"}
                                   error={!!props.errors["dateOfBirth"]}
                                   helperText={props.errors["dateOfBirth"]}
                                   value={props.patient?.dateOfBirth ?? ""}
                                   name={"dateOfBirth"}
                                   type={"date"}
                                   onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <Autocomplete id="country-select"
                                      options={countries}
                                      value={props.patient?.nationality ?? null}
                                      onChange={handleNationalityChange} autoHighlight
                                      getOptionLabel={(option) => option.label}
                                      renderOption={(props, option) => (
                                          <Box component="li" sx={{'& > img': {mr: 2, flexShrink: 0}}} {...props}>
                                              <img loading="lazy" width="20"
                                                   src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                                                   srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                                                   alt=""
                                              />
                                              {option.label} ({option.code})
                                          </Box>)}
                                      renderInput={(params) => (<TextField {...params} required
                                                                           error={!!props.errors["nationality.code"]}
                                                                           helperText={props.errors["nationality.code"]}
                                                                           inputProps={{
                                                                               ...params.inputProps,
                                                                               autoComplete: 'new-password',
                                                                           }}
                                                                           label={"nationality"}
                                      />)}
                        />
                    </Grid>
                </Grid>
                <Typography component={"h2"} fontWeight={"bolder"} sx={{mt: 2}}>Patient Contact Information</Typography>
                <Grid container spacing={1.5} mt={2}>
                    <Grid item xs={6}>
                        <Autocomplete id="country-select"
                                      options={countries}
                                      value={props.patient?.contact?.country}
                                      onChange={handleContactCountryChange} autoHighlight
                                      getOptionLabel={(option) => option.label}
                                      renderOption={(props, option) => (
                                          <Box component="li" sx={{'& > img': {mr: 2, flexShrink: 0}}} {...props}>
                                              <img loading="lazy" width="20"
                                                   src={`https://flagcdn.com/w20/${option?.code?.toLowerCase()}.png`}
                                                   srcSet={`https://flagcdn.com/w40/${option?.code?.toLowerCase()}.png 2x`}
                                                   alt=""
                                              />
                                              {option.label} ({option.code})
                                          </Box>)}
                                      renderInput={(params) => (<TextField {...params}
                                                                           label="country"
                                                                           inputProps={{
                                                                               ...params.inputProps,
                                                                               autoComplete: 'new-password',
                                                                           }}
                                      />)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth label={"State"} value={props.patient?.contact?.state ?? ""} name={"state"}
                                   onChange={handleContactChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth label={"City"} value={props.patient?.contact?.city ?? ""} name={"city"}
                                   onChange={handleContactChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth label={"Address"} value={props.patient?.contact?.address ?? ""}
                                   name={"address"}
                                   onChange={handleContactChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField InputProps={{
                            startAdornment: <InputAdornment position="start">
                                <CountrySelector value={props.patient?.contact?.phone?.substring(1) ?? ""}
                                                 onChange={handlePhoneCountryCodeChange}/>
                            </InputAdornment>,
                        }} fullWidth label={"Phone"} value={props.patient?.contact?.phone ?? ""}
                                   name={"phone"} onChange={handleContactChange}/>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth label={"Email"} value={props.patient?.contact?.email} name={"email"}
                                   onChange={handleContactChange}/>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} mt={2}>
                <Stack alignItems="flex-end">
                    <Button variant="contained" onClick={handleSubmit}>
                        Save & continue
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </>
}

export default PatientDetailsForm;
