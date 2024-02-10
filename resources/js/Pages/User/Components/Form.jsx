import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {TextField} from "@mui/material";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import React from "react";
import SelectSearch from "@/Components/SelectSearch";
import Autocomplete from "@mui/material/Autocomplete";
import countries from "@/Data/countries";

const UserForm = ({values, setValues, cancel, submit, errors, edit}) => {
    const handleChange = (e) => setValues(prevValues => ({...prevValues, [e.target.name]: e.target.value}));

    const handleChangeMeta = (key) => (e) => {
        setValues(previousData => ({
            ...previousData,
            meta: {
                ...previousData?.meta || {},
                [key]: {
                    ...((previousData?.meta || {})[key] || {}),
                    [e.target.name]: e.target.value
                }
            }
        }));
    }

    const handleChangeMetaCountry = (key) => (_, value) => setValues(previousData => ({
        ...previousData,
        meta: {
            ...previousData.meta,
            [key]: {
                ...previousData.meta[key] ?? {},
                country: value ?? ""
            }
        }
    }));

    return (
        <Container>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField error={Object.keys(errors).includes('name')}
                               helperText={errors?.name ?? ""}
                               fullWidth
                               label="Name"
                               name="name"
                               value={values.name}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField error={Object.keys(errors).includes('userName')}
                               helperText={errors?.userName ?? ""}
                               fullWidth
                               label="Username"
                               name="userName"
                               value={values.userName}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField error={Object.keys(errors).includes('email')}
                               helperText={errors?.email ?? ""}
                               fullWidth
                               label="Email"
                               name="email"
                               type="email"
                               value={values.email}
                               onChange={handleChange}/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField error={Object.keys(errors).includes('mobile')}
                               helperText={errors?.mobile ?? ""}
                               label="Mobile"
                               name="mobile"
                               value={values.mobile}
                               onChange={handleChange}
                               fullWidth/>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <SelectSearch error={Object.keys(errors).includes("roles")}
                                  helperText={errors?.roles}
                                  label="Roles"
                                  name="roles"
                                  multiple
                                  value={values.roles}
                                  url={route("api.roles.list")}
                                  onchange={handleChange}
                                  required/>
                </Grid><Grid item xs={12}>
                <Divider>
                    <strong>Contact Information</strong>
                </Divider>
            </Grid>
                <Grid item xs={12}>
                    <TextField
                        multiline
                        rows={2}
                        fullWidth
                        name="address"
                        value={values?.meta?.contact?.address}
                        helperText={errors ? errors["meta.contact.address"] : ""}
                        error={errors.hasOwnProperty("meta.contact.address")}
                        onChange={handleChangeMeta("contact")}
                        label="Address"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <TextField
                        fullWidth
                        name="city"
                        value={values?.meta?.contact?.city}
                        helperText={errors["meta.contact.city"]}
                        error={errors.hasOwnProperty("meta.contact.city")}
                        onChange={handleChangeMeta("contact")}
                        label="City"/>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Autocomplete
                        options={countries.map(item => item.label)}
                        value={values?.meta?.contact?.country ?? ""}
                        onChange={handleChangeMetaCountry("contact")}
                        renderInput={(params) => <TextField {...params}
                                                            name="country"
                                                            fullWidth
                                                            label="Country"
                                                            helperText={errors["meta.contact.country"]}
                                                            error={errors.hasOwnProperty("meta.contact.country")}/>}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Divider>
                        <strong> Billing Information</strong>
                    </Divider>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <TextField
                        fullWidth
                        name="name"
                        value={values.meta?.billing?.name ?? ""}
                        helperText={errors["meta.billing.name"]}
                        error={errors.hasOwnProperty("meta.billing.name")}
                        onChange={handleChangeMeta("billing")}
                        label="Name"
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <TextField
                        fullWidth
                        name="email"
                        value={values.meta?.billing?.email ?? ""}
                        helperText={errors["meta.billing.email"]}
                        error={errors.hasOwnProperty("meta.billing.email")}
                        onChange={handleChangeMeta("billing")}
                        label="Email"
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <TextField
                        fullWidth
                        name="phone"
                        value={values.meta?.billing?.phone ?? ""}
                        helperText={errors["meta.billing.phone"]}
                        error={errors.hasOwnProperty("meta.billing.phone")}
                        onChange={handleChangeMeta("billing")}
                        label="Phone"
                        required
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Autocomplete
                        options={countries.map(item => item.label)}
                        value={values?.meta?.billing?.country ?? ""}
                        onChange={handleChangeMetaCountry("billing")}
                        renderInput={(params) => <TextField {...params}
                                                            name="country"
                                                            fullWidth
                                                            label="Country"
                                                            helperText={errors["meta.billing.country"]}
                                                            error={errors.hasOwnProperty("meta.billing.country")}/>}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                    <TextField
                        fullWidth
                        name="city"
                        value={values?.meta?.billing?.city}
                        helperText={errors["meta.contact.city"]}
                        error={errors.hasOwnProperty("meta.billing.city")}
                        onChange={handleChangeMeta("billing")}
                        label="City"/>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        multiline
                        rows={2}
                        fullWidth
                        name="address"
                        value={values?.meta?.billing?.address}
                        helperText={errors["meta.billing.address"]}
                        error={errors.hasOwnProperty("meta.billing.address")}
                        onChange={handleChangeMeta("billing")}
                        label="Address"/>
                </Grid>
            </Grid>
            <Divider sx={{marginY: "1em"}}/>
            {!edit ? <>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField error={Object.keys(errors).includes('password')}
                                   helperText={errors?.password ?? ""}
                                   label={"Password"}
                                   name={"password"}
                                   type={"password"}
                                   onChange={handleChange}
                                   fullWidth/>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField error={Object.keys(errors).includes('password_confirmation')}
                                   helperText={errors?.password_confirmation ?? ""}
                                   label="Confirm Password"
                                   name="password_confirmation"
                                   type="password"
                                   onChange={handleChange}
                                   fullWidth/>
                    </Grid>
                </Grid>
                <Divider sx={{marginY: "1em"}}/>
            </> : null}
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
export default UserForm;
