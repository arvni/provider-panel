import React from "react";
import {useSubmitForm} from "@/Services/api";
import EditLayout from "@/Pages/Order/EditLayout";
import {
    Avatar, Box,
    Button,
    Checkbox,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Switch,
    Typography
} from "@mui/material";
import ListItemIcon from "@mui/material/ListItemIcon";

const ConsentForm = ({auth, order, step,consents}) => {
    const {
        data,
        setData,
        submit,
        processing,
        errors,
        setError,
        reset,
        clearErrors,
    } = useSubmitForm({
        ...order,
        consents: [...(!order.consents.length?(consents):[]), ...order.consents],
        _method: "put"
    }, route("orders.update", {order: order.id, step}));

    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}))
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        submit();
    }
    const handleConsentChange = (index) => (e, value) => {
        let consents = data.consents;
        consents[index].value = value;
        handleChange("consents", consents)
    }
    return <EditLayout auth={auth} step={step} id={order.id}>
        <Box component="form" onSubmit={handleSubmit}>
        <Typography sx={{my: 4}} component="h2" fontSize="18px" fontWeight="700">PLEASE READ THIS STEP THROUGH
            CAREFULLY AND SELECT CHECKBOXES</Typography>
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <List>
                    {data.consents.map((consent, index) => <ListItem key={index}>
                        <ListItemAvatar>
                            <Avatar>{index + 1}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={consent.title}/>
                        <ListItemIcon>
                            <Checkbox required defaultChecked={consent?.value || false}
                                      onChange={handleConsentChange(index)}/>
                        </ListItemIcon>
                    </ListItem>)}
                </List>
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
    </EditLayout>
}
export default ConsentForm;
