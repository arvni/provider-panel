import {Box, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography} from "@mui/material";
import React from "react";
import AdminLayout from "@/Layouts/AuthenticatedLayout";
import LightModeIcon from '@mui/icons-material/LightMode';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import AddOrderByBarcode from "@/Components/AddOrderByBarcode.jsx";
export const Greeting = () => {
    var myDate = new Date();
    var hours= myDate.getHours();

    if (hours < 12)
        return <>
            <WbTwilightIcon fontSize="large" color="warning"/>
            <span>Good Morning!</span>
        </>;
    else if (hours >= 12 && hours <= 17)
        return <>
            <LightModeIcon fontSize="large" color="warning"/>
            <span>Good Afternoon!</span>
        </>;
    else if (hours >= 17 && hours <= 24)
        return <>
            <Brightness3Icon fontSize="large" />
            <span>Good Evening!</span>
        </>;

}
export default function Dashboard({ auth,recentlyOrders,notDownloadedReports }) {
    return (
        <AdminLayout auth={auth} breadcrumbs={[]} >
            <Grid container spacing={3}>
                <Grid item xs={12} md={4} lg={3}>
                    <Paper elevation={5}
                        sx={{
                            height:"calc(50% - 8px)",
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: "space-evenly",
                            alignItems: "center"
                        }}
                    >
                        <Greeting/>
                    </Paper>
                    <Paper elevation={5}
                        sx={{
                            height:"calc(50% - 8px)",
                            mt:2,
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: "space-evenly",
                            alignItems: "center"
                        }}
                    >
                        <Typography variant="h3">{notDownloadedReports}</Typography>
                        <Typography variant="subtitle">Reports Ready To Download</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8} lg={9}>
                    <Paper elevation={5}
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            overflowX:"auto"
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <h3>Latest Orders</h3>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                <TableCell>Patient Name</TableCell>
                                <TableCell>Tests</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Latest Update</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {recentlyOrders.map(order=><TableRow key={"order-"+order.id}>
                                <TableCell>{order.patient_full_name}</TableCell>
                                <TableCell>{order.tests_name}</TableCell>
                                <TableCell>{order.status}</TableCell>
                                <TableCell>{new Date(order.updated_at).toLocaleDateString()}</TableCell>
                            </TableRow>)}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={5}
                           sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <AddOrderByBarcode/>
                    </Paper>
                </Grid>
            </Grid>
        </AdminLayout>
    );
}
