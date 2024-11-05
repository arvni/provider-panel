import React from "react";
import {
    Avatar,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    List,
    ListItem, ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import {Close, Done} from "@mui/icons-material";
import ConsanguineousParents from "@/Enums/ConsanguineousParents.js";
import ListItemButton from "@mui/material/ListItemButton";

const Show = ({order: {consents, ...restOrder}}) => {
    let consentForm, restConsents;
    if (Array.isArray(consents)) {
        restConsents = consents;
        consentForm = null;
    } else {
        consentForm = consents.consentForm;
        restConsents = Object.keys(consents)
            .filter(item => item !== "consentForm")
            .map(item => consents?.[item])
        // restConsents = Object?.values();
    }

    return <Paper sx={{p: "1em", mt: "1em"}}>
        <Stack
            direction="row"
            justifyContent="space-between">
            <Typography
                component={"h1"}
                fontWeight={"900"}
                fontSize={"18px"}
            >Order ID {restOrder.id}</Typography>
            <Button
                href={route("order-summary", restOrder.id)}
                target="_blank"
                variant="contained"
            >Download Order Summary</Button>
        </Stack>
        <Typography>Analysis requested:</Typography>
        <ul>
            <li>{restOrder.tests.map((test) => <Typography fontWeight="600">{test.name}</Typography>)}</li>
        </ul>
        <Card>
            <CardHeader title="Patient details" sx={{background: "#c0c0c0"}}/>
            <CardContent>
                <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                        <ul>
                            <li><strong>Full Name:</strong> {restOrder.patient?.fullName}</li>
                            <li><strong>Date of birth:</strong> {restOrder.patient?.dateOfBirth}</li>
                            <li><strong>Reference ID:</strong> {restOrder.patient?.reference_id ?? "not specified"}</li>
                            <li><strong>Gender:</strong> {(restOrder.patient?.gender * 1) ? "male" : "female"}</li>
                            <li><strong>Nationality:</strong> {restOrder.patient?.nationality?.label}</li>
                            <li><strong>City:</strong> {restOrder.patient?.contact?.city ?? "not specified"}</li>
                            <li><strong>Street:</strong> {restOrder.patient?.contact?.address ?? "not specified"}</li>
                            <li><strong>State:</strong> {restOrder.patient?.contact?.state ?? "not specified"}</li>
                            <li><strong>Phone:</strong> {restOrder.patient?.contact?.phone ?? "not specified"}</li>
                            <li><strong>Country:</strong> {restOrder.patient?.contact?.country?.label}</li>
                            <li><strong>Email:</strong> {restOrder.patient?.contact?.email ?? "not specified"}</li>
                            <li><strong>Consanguineous
                                parents:</strong> {ConsanguineousParents.get(restOrder.patient?.consanguineousParents)}
                            </li>
                        </ul>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography fontWeight={"600"}>Material details</Typography>
                        <ol>
                            {restOrder.samples?.map((sample, index) => <li key={sample.id}>
                                <ul style={{paddingLeft: "30px"}}>
                                    <li><strong>Sample type:</strong>{sample.sample_type?.name} </li>
                                    <li><strong>Sample ID:</strong>{sample.sampleId ?? "not specified"}</li>
                                    <li><strong>Sample Collection Date:</strong>{sample.collectionDate}</li>
                                    {sample?.material &&
                                        <li><strong>Expire Date:</strong>{sample.material?.expire_date}</li>}
                                </ul>
                            </li>)}
                        </ol>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="Request Form" sx={{background: "#c0c0c0"}}/>
            <CardContent>
                <Grid container>
                    {restOrder?.orderForms?.map(orderForm => <Grid item xs={12} md={6} key={orderForm.id}>
                        <List>
                            {orderForm?.formData.map(item => <ListItem>
                                <ListItemText>
                                    {item.label + ": " + (item.value ?? "")}
                                </ListItemText>
                            </ListItem>)}
                        </List>
                    </Grid>)}
                </Grid>
            </CardContent>
        </Card>
        <Card>
            <CardHeader title="Consent" sx={{background: "#c0c0c0"}}/>
            <CardContent>
                <Grid container>
                    <Grid item xs={12}>
                        <List>
                            {restConsents?.map((consent, index) => <ListItem key={index}>
                                <ListItemAvatar>
                                    <Avatar>{consent?.value ? <Done color="success"/> : <Close color="error"/>}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={consent?.title}/>
                            </ListItem>)}
                            <ListItem>
                                <ListItemText primary="Consent Form"
                                              secondary={<List>
                                                  {consentForm?.map(item => <ListItemButton href={"/files/" + item}
                                                                                            target="_blank">Download</ListItemButton>)}
                                              </List>}/>
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    </Paper>
}
const breadcrumbs = [
    {
        title: "Orders",
        link: route("orders.index"),
        icon: null
    },
];
Show.layout = (page) => <ClientLayout auth={page.props.auth}
                                      breadcrumbs={[...breadcrumbs, {
                                          title: "Order #" + page.props.order.id,
                                          link: "",
                                          icon: null
                                      },]}
                                      children={page}/>
export default Show;
