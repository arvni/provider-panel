import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {IconButton, Input, ListItem, ListItemSecondaryAction, TextField} from "@mui/material";
import Button from "@mui/material/Button";
import React from "react";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import {RemoveRedEye} from "@mui/icons-material";
import RequirementForm from "@/Pages/OrderForm/Components/RequirementForm";

const Form = ({values, setValues, cancel, submit, errors, edit}) => {
    const handleChange = (e) => setValues(prevValues => ({...prevValues, [e.target.name]: e.target.value}));
    const handleFileChange = (e) => setValues(prevState => ({...prevState, [e.target.name]: e.target.files[0]}));

    const handleFormDataChanged=(formData)=>setValues(prevState=>({...prevState,formData}));

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
                <Grid item xs={12}>
                    <RequirementForm onChange={handleFormDataChanged} requirements={values.formData} error={errors}/>
                </Grid>
                <Grid item xs={12}>
                    {typeof values.file == "string" && values.file ? <List>
                        <ListItem>
                            <ListItemText>File</ListItemText>
                            <ListItemSecondaryAction>
                                <IconButton href={route("file", {id:values.id,type:"orderForm"})}
                                            target="_blank"><RemoveRedEye/></IconButton>
                            </ListItemSecondaryAction>
                        </ListItem></List>:null}
                    <Input type="file" name="file" onChange={handleFileChange}/>
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
