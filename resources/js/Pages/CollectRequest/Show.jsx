import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Paper from "@mui/material/Paper";
import {
    AccordionActions, Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@mui/material";
import {
    ArrowDownward,
    Download, EditNote,
    Email,
    Flag,
    LocationCity,
    LocationSearching, More,
    Person,
    Phone,
    RemoveRedEye,
    Streetview
} from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import {CalendarIcon} from "@mui/x-date-pickers";
import Button from "@mui/material/Button";
import {useState} from "react";
import {useForm} from "@inertiajs/react";
import Form from "./Components/Form";

const Show = ({collectRequest}) => {
    const {data, setData, post, reset, errors} = useForm({
        ...collectRequest.details,
        status: collectRequest.status,
        _method: "put"
    });
    const [openEdit, setOpenEdit] = useState(false)
    const openEditForm = () => setOpenEdit(true);
    const handleClose = () => {
        setOpenEdit(false);
        reset()
    }
    const handleSubmit = () => post(route("admin.collectRequests.update", collectRequest.id), {onSuccess: handleClose});
    return <>
        Status: <Chip label={collectRequest.status} color="primary"/>
        <Paper>
            <Accordion>
                <AccordionSummary expandIcon={<ArrowDownward/>}>
                    <Typography fontWeight="bolder">{collectRequest.user.name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack direction="row" justifyContent="space-evenly">
                        <List disablePadding dense
                              subheader={<Typography fontWeight="bold">Billing Information</Typography>}>
                            <ListItem>
                                <ListItemAvatar>
                                    <Person/>
                                </ListItemAvatar>
                                <ListItemText primary="Name" secondary={collectRequest?.user?.meta?.billing?.name}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Email/>
                                </ListItemAvatar>
                                <ListItemText primary="Email" secondary={collectRequest?.user?.meta?.billing?.email}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Phone/>
                                </ListItemAvatar>
                                <ListItemText primary="Phone" secondary={collectRequest?.user?.meta?.billing?.phone}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Flag/>
                                </ListItemAvatar>
                                <ListItemText primary="Country"
                                              secondary={collectRequest?.user?.meta?.billing?.country}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Streetview/>
                                </ListItemAvatar>
                                <ListItemText primary="Street"
                                              secondary={collectRequest?.user?.meta?.billing?.address}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <LocationCity/>
                                </ListItemAvatar>
                                <ListItemText primary="State" secondary={collectRequest?.user?.meta?.billing?.state}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <LocationCity/>
                                </ListItemAvatar>
                                <ListItemText primary="City" secondary={collectRequest?.user?.meta?.billing?.city}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <LocationSearching/>
                                </ListItemAvatar>
                                <ListItemText primary="Zip" secondary={collectRequest?.user?.meta?.billing?.zip}/>
                            </ListItem>
                        </List>
                        <List disablePadding dense
                              subheader={<Typography fontWeight="bold">Contact Information</Typography>}>
                            <ListItem>
                                <ListItemAvatar>
                                    <LocationCity/>
                                </ListItemAvatar>
                                <ListItemText primary="City" secondary={collectRequest?.user?.meta?.contact?.city}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Flag/>
                                </ListItemAvatar>
                                <ListItemText primary="Country"
                                              secondary={collectRequest?.user?.meta?.contact?.country}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Phone/>
                                </ListItemAvatar>
                                <ListItemText primary="Phone" secondary={collectRequest?.user?.meta?.contact?.phone}/>
                            </ListItem>
                            <ListItem>
                                <ListItemAvatar>
                                    <Email/>
                                </ListItemAvatar>
                                <ListItemText primary="Email" secondary={collectRequest?.user?.meta?.contact?.email}/>
                            </ListItem>
                        </List>
                    </Stack>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ArrowDownward/>}>
                    <Typography fontWeight="bolder">Logistic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        <ListItem>
                            <ListItemAvatar>
                                <CalendarIcon/>
                            </ListItemAvatar>
                            <ListItemText primary="Pick up Date"
                                          secondary={collectRequest?.details?.pickupDate ?? "not specified"}/>
                        </ListItem>
                        <ListItem>
                            <ListItemAvatar>
                                <More/>
                            </ListItemAvatar>
                            <ListItemText secondary={collectRequest?.details?.more}/>
                        </ListItem>
                    </List>
                </AccordionDetails>
                <AccordionActions>
                    <Button startIcon={<EditNote/>} variant="outlined" onClick={openEditForm}>Edit</Button>
                </AccordionActions>
            </Accordion>
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ArrowDownward/>}>
                    <Typography fontWeight="bolder">Orders List</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Tests</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Patient Name</TableCell>
                                <TableCell>#</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {collectRequest.orders.map(order => <TableRow key={order.id}>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{order.tests.map(test => test.name).join(", ")}</TableCell>
                                <TableCell>{order.status}</TableCell>
                                <TableCell>{order.patient.fullName}</TableCell>
                                <TableCell>
                                    <IconButton href={route("order-summary", order.id)} target="_blank">
                                        <Download/>
                                    </IconButton>
                                    <IconButton href={route("orders.show", order.id)} target="_blank">
                                        <RemoveRedEye/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </AccordionDetails>
            </Accordion>
        </Paper>
        <Form open={openEdit} values={data} setValues={setData} submit={handleSubmit} errors={errors}
              cancel={handleClose} defaultValue={collectRequest}/>
    </>;
}

const breadCrumbs = [
    {
        title: "Collect Requests",
        link: "/admin/collectRequests",
        icon: null
    }
]
Show.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[...breadCrumbs,
    {
        title: "Collect Request #" + page.props.collectRequest.id,
        link: null,
        icon: null
    }]}/>

export default Show;
