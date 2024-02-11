import {
    Button, Divider,
    Grid,
    Stack,
} from "@mui/material";
import * as React from "react";
import Typography from "@mui/material/Typography";
import RenderFormField from "@/Components/RenderFormField";
import Box from "@mui/material/Box";
import FileUploader from "@/Components/FileUploader";

const ClinicalDetailsForm = (props) => {
    const handleChange = (orderFormId, elId, type) => (e, v) => {
        let newForms = [...props.orderForms];
        let formIndex = props.orderForms.findIndex(item => item.id === orderFormId);
        let elIndex = props.orderForms[formIndex].formData.findIndex(item => item.id === elId);
        newForms[formIndex].formData[elIndex].value = type === "checkbox" ? v : e.target.value;
        props.onChange("orderForms", newForms);
    }

    return <Box component="form" onSubmit={props.onSubmit}>
        <Grid container spacing={2} mt={2}>
            {props.orderForms.map((orderForm, index) => <Grid item xs={12} key={"form-" + orderForm.id}>
                <Typography variant="h2" fontSize="28px">{orderForm.name} Form</Typography>
                <Grid container spacing={2} my={3} sx={{maxWidth:"400px"}}>
                    {orderForm.formData.map((el, i) => <Grid item xs={12} key={el.id}>
                        <RenderFormField field={el}
                                         onchange={handleChange(orderForm.id, el.id, el.type)}
                                         defaultValue={el.value ?? null}/>
                    </Grid>)}
                </Grid>
            </Grid>)}
            <Grid item xs={12}>
                <Divider/>
                <FileUploader title="Files" onChange={props.onFileChanged} defaultValues={props.files} name="files"/>
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
export default ClinicalDetailsForm;
