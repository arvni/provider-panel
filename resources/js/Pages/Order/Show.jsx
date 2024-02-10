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

const Show = ({auth, order}) => {
    return <ClientLayout auth={auth} breadcrumbs={[]}>
        <Paper sx={{p: "1em", mt: "1em"}}>
            <Stack
                direction="row"
                justifyContent="space-between">
                <Typography
                    component={"h1"}
                    fontWeight={"900"}
                    fontSize={"18px"}
                >Order ID {order.id}</Typography>
                <Button
                    href={route("order-summary", order.id)}
                    target="_blank"
                    variant="contained"
                >Download Order Summary</Button>
            </Stack>
            <Typography>Analysis requested:</Typography>
            <ul>
                <li>{order.tests.map((test) => <Typography fontWeight="600">{test.name}</Typography>)}</li>
            </ul>
            <Card>
                <CardHeader title="Patient details" sx={{background: "#c0c0c0"}}/>
                <CardContent>
                    <Grid container spacing={1}>
                        <Grid item xs={12} md={4}>
                            <ul>
                                <li><strong>Full Name:</strong> {order.patient?.fullName}</li>
                                <li><strong>Date of birth:</strong> {order.patient?.dateOfBirth}</li>
                                <li><strong>Reference ID:</strong> {order.patient?.reference_id ?? "not specified"}</li>
                                <li><strong>Gender:</strong> {order.patient?.gender ? "male" : "female"}</li>
                                <li><strong>City:</strong> {order.patient?.contact?.city ?? "not specified"}</li>
                                <li><strong>Street:</strong> {order.patient?.contact?.address ?? "not specified"}</li>
                                <li><strong>State:</strong> {order.patient?.contact?.state ?? "not specified"}</li>
                                <li><strong>Phone:</strong> {order.patient?.contact?.phone ?? "not specified"}</li>
                                <li><strong>Country:</strong> {order.patient?.contact?.country.label}</li>
                                <li><strong>Email:</strong> {order.patient?.contact?.email ?? "not specified"}</li>
                                <li><strong>Consanguineous
                                    parents:</strong> {order.patient?.consanguineousParents ? "yes" : "no"}</li>
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography fontWeight={"600"}>Material details</Typography>
                            <ol>
                                {order.samples?.map((sample, index) => <React.Fragment key={sample.id}>
                                    {index + 1}
                                    <ul>
                                        <li><strong>Sample type:</strong>{sample.sample_type?.name} </li>
                                        <li><strong>Sample ID:</strong>{sample.sampleId ?? "not specified"}</li>
                                        <li><strong>Sample Collection Date:</strong>{sample.collectionDate}</li>
                                    </ul>
                                </React.Fragment>)}
                            </ol>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Card>
                <CardHeader title="Request Form" sx={{background: "#c0c0c0"}}/>
                <CardContent>
                    <Grid container>
                        {order.orderForms.map(orderForm => <Grid item xs={12} md={6} key={orderForm.id}>
                            <List>
                                {orderForm.formData.map(item => <ListItem>
                                    <ListItemText primary={item.label}/>
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
                                {order.consents.map((consent, index) => <ListItem key={index}>
                                    <ListItemAvatar>
                                        <Avatar>{consent.value?<Done color="success"/>:<Close color="error"/>}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={consent.title}/>
                                </ListItem>)}
                            </List>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Paper>
    </ClientLayout>
}
export default Show;
